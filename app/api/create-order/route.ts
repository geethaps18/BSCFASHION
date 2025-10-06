// app/api/create-order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

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
        name: product.name,
        quantity: Number(item.quantity),
        price: Number(item.price), // use price from payment page
        size: item.size ?? null,
      };
    });

    // ✅ Calculate total amount from payment page (not just product.price)
    const totalAmount = orderItems.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    );

    // ✅ Create order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMode: paymentMode || "COD",
        address: JSON.stringify(address),
        upiId: paymentMode === "UPI" ? upiId ?? null : null,
        cardDetails: paymentMode === "Card" ? JSON.stringify(cardDetails) : null,
        items: { create: orderItems },
      },
      include: { items: true, user: true },
    });

    // ✅ Send email & WhatsApp notifications
    if (user.email) await sendOrderEmail(user.email, order, orderItems);
    if (address.phone) await sendWhatsAppMessage(address.phone, order, orderItems);

    return NextResponse.json(
      { success: true, orderId: order.id, order },
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
