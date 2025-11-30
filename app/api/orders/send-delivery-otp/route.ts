import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

// ----------------------------
//  OTP GENERATOR
// ----------------------------
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ----------------------------
//  SEND WHATSAPP OTP
// ----------------------------
async function sendWhatsappOtp(phone: string, otp: string) {
  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: {
            body: `Your BSCFASHION Delivery OTP is ${otp}. Share this OTP only after receiving your product.`,
          },
        }),
      }
    );
  } catch (err) {
    console.log("WhatsApp OTP Error:", err);
  }
}

// ----------------------------
//  SEND EMAIL OTP
// ----------------------------
async function sendEmailOtp(email: string, otp: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Delivery OTP - BSCFASHION",
      text: `Your BSCFASHION Delivery OTP is ${otp}. Please share the OTP only after receiving your product.`,
    });
  } catch (err) {
    console.log("Email OTP Error:", err);
  }
}

// =====================================================
//  MAIN API ROUTE  →  SEND DELIVERY OTP
// =====================================================
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch order from DB
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: {
        phone: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Generate OTP
    const otp = generateOtp();

    // 4️⃣ Save OTP into order table
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryOtp: otp },
    });

    // 5️⃣ Priority: WhatsApp → Email
    if (user.phone) {
      await sendWhatsappOtp(user.phone, otp);
    } else if (user.email) {
      await sendEmailOtp(user.email, otp);
    } else {
      return NextResponse.json(
        { message: "User has no phone or email" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Delivery OTP sent successfully",
    });
  } catch (error) {
    console.log("OTP SEND ERROR:", error);
    return NextResponse.json(
      { message: "Error sending OTP", error: `${error}` },
      { status: 500 }
    );
  }
}
