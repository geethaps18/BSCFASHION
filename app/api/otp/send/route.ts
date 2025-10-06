import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ✅ Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Send OTP via Email with embedded logo
async function sendEmailOtp(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Convert logo to base64
  const logoPath = path.join(process.cwd(), "public/images/logo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
      
      <!-- Secure OTP Banner -->
      <div style="background-color:#FFD700; color:#333; text-align:center; padding:10px; font-weight:bold;">
        🔒 BSCFASHION Secure OTP
      </div>

      <!-- Logo -->
      <div style="background-color:#fff; padding:20px; text-align:center;">
        <img src="data:image/png;base64,${logoBase64}" alt="BSCFASHION" width="180" style="display:block; margin:auto;" />
      </div>

      <!-- OTP Body -->
      <div style="padding:30px; text-align:center;">
        <h2 style="color:#333;">Your OTP Code</h2>
        <p style="color:#555; font-size:16px;">Use the following OTP to complete your login or signup:</p>

        <div style="margin:20px 0;">
          <span style="
            display:inline-block;
            background-color:#FFD700;
            color:#000;
            font-size:28px;
            font-weight:bold;
            padding:15px 25px;
            border-radius:5px;
            letter-spacing:4px;
            box-shadow:0 4px 6px rgba(0,0,0,0.1);
          ">${otp}</span>
        </div>

        <p style="color:#999; font-size:14px;">Your OTP is valid for 5 minutes.</p>
        <p style="color:#999; font-size:12px;">If you did not request this code, ignore this email.</p>
      </div>

      <!-- Footer -->
      <div style="background-color:#f5f5f5; padding:20px; text-align:center; font-size:12px; color:#999;">
        BSCFASHION &copy; ${new Date().getFullYear()}. All rights reserved.<br/>
        Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#FFD700;">${process.env.EMAIL_USER}</a>
      </div>

    </div>
  `;

  await transporter.sendMail({
    from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your B.S. CHANNABASAPPA & SONS OTP Code",
    html,
  });
}

// ✅ Send OTP via WhatsApp
async function sendWhatsappOtp(phone: string, otp: string) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: `Your OTP is ${otp}. It will expire in 5 minutes.` },
    }),
  });
}

// ✅ Main API
export async function POST(req: Request) {
  try {
    const { contact } = await req.json();

    if (!contact) {
      return NextResponse.json({ message: "Contact is required ❌" }, { status: 400 });
    }

    const isEmail = contact.includes("@");
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60_000); // 5 minutes

    // ✅ Upsert OTP in DB
    await prisma.oTP.upsert({
      where: { contact },
      update: { otp, expiresAt },
      create: { contact, otp, expiresAt },
    });

    // ✅ Send OTP
    if (isEmail) {
      await sendEmailOtp(contact, otp);
    } else {
      await sendWhatsappOtp(contact, otp);
    }

    console.log(`[OTP] ${contact} -> ${otp}`);
    return NextResponse.json({ message: "OTP sent successfully ✅" });

  } catch (err: any) {
    console.error("Send OTP Error:", err);
    return NextResponse.json({ message: "Something went wrong ❌", error: err.message }, { status: 500 });
  }
}
