// app/api/create-order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* ---------------- CONFIG ---------------- */
const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const JWT_SECRET = process.env.JWT_SECRET!;

/* ---------------- AUTH HELPER ---------------- */
async function getUserFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id) return null;

    // 🔥 AUTO-HEAL USER (iOS Safari fix)
    let user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name ?? "Customer",
        },
      });
    }

    return user;
  } catch {
    return null;
  }
}

/* ---------------- EMAIL ---------------- */
async function sendOrderEmail(to: string, order: any, items: any[]) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const itemList = items
    .map(
      (i) =>
        `➜ ${i.name} - ${i.size ?? "Free Size"} (${i.quantity}) - ₹${i.price}`
    )
    .join("<br>");

  await transporter.sendMail({
    from: `"BSCFASHION" <${EMAIL_USER}>`,
    to,
    subject: `Order Confirmed - ${order.id}`,
    html: `
      <h2>Hi ${order.user?.name || "Customer"} 👋</h2>
      <p>Your order has been placed successfully.</p>
      <p><b>Order ID:</b> ${order.id}</p>
      <p>${itemList}</p>
      <p><b>Total:</b> ₹${order.totalAmount}</p>
      <p>— Team BSCFASHION</p>
    `,
  });
}

/* ---------------- WHATSAPP ---------------- */
async function sendWhatsAppMessage(phone: string, order: any, items: any[]) {
  const itemList = items
    .map(
      (i) =>
        `➜ ${i.name} - ${i.size ?? "Free Size"} (${i.quantity}) - ₹${i.price}`
    )
    .join("\n");

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
      text: {
        body: `Thank you for shopping with BSCFASHION 👋

Order ID: ${order.id}

${itemList}

Total: ₹${order.totalAmount}`,
      },
    }),
  });
}

/* ---------------- MAIN API ---------------- */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { items, paymentMode, address, upiId, cardDetails } =
      await req.json();

    if (!items?.length || !address) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)!;

      return {
        productId: product.id,
        siteId: product.siteId,
        name: product.name,
        brandName: product.brandName ?? "BSCFASHION",
        quantity: Number(item.quantity),
        price: Number(item.price),
        size: item.size ?? null,
        color: item.color ?? null,
        variantId: item.variantId ?? null,
        image: product.images?.[0] ?? null,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    let razorpayOrder: any = null;

    if (paymentMode === "Online") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          paymentMode: paymentMode || "COD",
          address,
          upiId: paymentMode === "UPI" ? upiId ?? null : null,
          cardDetails:
            paymentMode === "Card"
              ? JSON.stringify(cardDetails)
              : null,
          razorpayOrderId: razorpayOrder?.id ?? null,
        },
        include: { user: true },
      });

      for (const item of orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            siteId: item.siteId,
            brandName: item.brandName,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
            variantId: item.variantId,
            image: item.image,
          },
        });
      }

      return createdOrder;
    });

    if (user.email) await sendOrderEmail(user.email, order, orderItems);
    if (address.phone)
      await sendWhatsAppMessage(address.phone, order, orderItems);

    return NextResponse.json(
      { success: true, order, rzpOrder: razorpayOrder },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("🔥 Order Error:", err.message);
    return NextResponse.json(
      { error: "Failed to create order", message: err.message },
      { status: 500 }
    );
  }
}
