// app/api/create-order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;

// ✅ Send Order Confirmation Email
async function sendOrderEmail(to: string, order: any, items: any[]) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const itemList = items
    .map(
      (i) =>
        `➜ ${i.name} - ${i.size ?? "Free Size"} (${i.quantity} Unit) - ₹${i.price}`
    )
    .join("<br>");

  const htmlContent = `
    <h2>Hi ${order.user?.name || "Customer"}, 👋</h2>
    <p>Thank you for shopping with <b>BSCFASHION</b>. Your order is being prepared for shipping.</p>
    <p><b>Order ID:</b> ${order.id}</p>
    <p><b>Items:</b><br>${itemList}</p>
    <p><b>Total Amount:</b> ₹${order.totalAmount}</p>
    <p><b>Payment Mode:</b> ${order.paymentMode}</p>
    <br/>
    <p>We’ll notify you once it ships. 🚚</p>
    <br/>
    <p>— Team BSCFASHION</p>
  `;

  await transporter.sendMail({
    from: `"BSCFASHION" <${EMAIL_USER}>`,
    to,
    subject: `Your Order Confirmation - ${order.id}`,
    html: htmlContent,
  });
}

// ✅ Send WhatsApp Order Update
async function sendWhatsAppMessage(phone: string, order: any, items: any[]) {
  const itemList = items
    .map(
      (i) =>
        `➜ ${i.name} - ${i.size ?? "Free Size"} (${i.quantity} Unit) - ₹${i.price}`
    )
    .join("\n");

  const message = `Hi ${order.user?.name || "Customer"} 👋, thank you for shopping with BSCFASHION. 

Your order is being prepared for shipping. 🚚

*Order ID:* ${order.id}
*Items:* 
${itemList}
*Order Amount:* ₹${order.totalAmount}
*Payment Mode:* ${order.paymentMode}`;

  await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });
}

// ✅ Main API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, items, paymentMode, address, upiId, cardDetails } = body;

    if (!userId || !Array.isArray(items) || items.length === 0 || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ Fetch products from DB
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== items.length) {
      return NextResponse.json(
        { error: "Invalid or unavailable products" },
        { status: 400 }
      );
    }

    // ✅ Build order items
   const orderItems = items.map((item: any) => {
  const product = dbProducts.find((p) => p.id === item.productId)!;

  return {
    productId: product.id,

    // 🔥🔥🔥 THIS IS THE KEY LINE
    siteId: product.siteId,

    name: product.name ?? "Product",
    brandName: product.brandName ?? "BSCFASHION",
    quantity: Number(item.quantity),
    price: Number(item.price),
    size: item.size ?? null,
    image: product.images?.[0] ?? null,
    
  };
});


    // ✅ Calculate total amount
    const totalAmount = orderItems.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    );

    // ✅ Razorpay order (for online payments only)
    let razorpayOrder: any = null;
    if (paymentMode === "Online") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paise
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`,
        payment_capture: true,
      });
    }

    // ✅ Create order in DB
   // ✅ CREATE ORDER + ITEMS + REDUCE STOCK (TRANSACTION)
const result = await prisma.$transaction(async (tx) => {
  // 1️⃣ Create order
  const order = await tx.order.create({
    data: {
      userId,
      totalAmount,
      paymentMode: paymentMode || "COD",
      address,
      upiId: paymentMode === "UPI" ? upiId ?? null : null,
      cardDetails:
        paymentMode === "Card" ? JSON.stringify(cardDetails) : null,
      razorpayOrderId: razorpayOrder?.id ?? null,
    },
    include: { user: true },
  });

  // 2️⃣ Create order items + reduce stock
  for (const item of orderItems) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.stock < item.quantity) {
      throw new Error(`${product?.name || "Product"} is out of stock`);
    }

    // create order item
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        siteId: item.siteId,
        brandName: item.brandName,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        image: item.image,
      },
    });

    // 🔥🔥🔥 REDUCE STOCK + INCREASE PURCHASES
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
        purchases: {
          increment: item.quantity,
        },
      },
    });
  }

  return order;
});



 if (user.email) await sendOrderEmail(user.email, result, orderItems);
if (address.phone)
  await sendWhatsAppMessage(address.phone, result, orderItems);

return NextResponse.json(
  { success: true, order: result, rzpOrder: razorpayOrder ?? null },
  { status: 201 }
);

  } catch (err: any) {
    console.error("🔥 Order Error:", err);
    return NextResponse.json(
      { error: "Failed to create order", message: err.message },
      { status: 500 }
    );
  }
}
