// app/api/otp/verify/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { contact, otp, name, signup } = await req.json();

    if (!contact || !otp) {
      return NextResponse.json(
        { message: "Contact and OTP are required ❌" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch OTP record
    const record = await prisma.oTP.findFirst({
      where: { contact },
      orderBy: { createdAt: "desc" },
    });

    console.log("[OTP VERIFY] Stored OTP:", record?.otp);
    console.log("[OTP VERIFY] User input OTP:", otp);

    if (!record) {
      return NextResponse.json(
        { message: "No OTP found for this contact ❌" },
        { status: 400 }
      );
    }

    if (record.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP ❌" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await prisma.oTP.deleteMany({ where: { contact } });
      return NextResponse.json({ message: "OTP expired ❌" }, { status: 400 });
    }

    // 2️⃣ OTP correct → delete all OTPs for this contact
    await prisma.oTP.deleteMany({ where: { contact } });

    // 3️⃣ Check if contact is email or phone
    const isEmail = contact.includes("@");

    // 4️⃣ Find or create user
    let user;
    if (isEmail) {
      user = await prisma.user.findFirst({ where: { email: contact } });
      if (!user && signup) {
        user = await prisma.user.create({
          data: { email: contact, name: name || "New User" },
        });
      }
    } else {
      user = await prisma.user.findFirst({ where: { phone: contact } });
      if (!user && signup) {
        user = await prisma.user.create({
          data: { phone: contact, name: name || "New User" },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found ❌. Please sign up first." },
        { status: 404 }
      );
    }

   // 5️⃣ Generate JWT
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

const token = jwt.sign(
  {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    contact: user.email || user.phone, // IMPORTANT for admin
  },
  JWT_SECRET,
  { expiresIn: "365d" }
);

    // 6️⃣ Success response
    return NextResponse.json({
      message: "OTP verified ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err: any) {
    console.error("Verify OTP Error:", err);
    return NextResponse.json(
      { message: "Something went wrong ❌", error: err.message },
      { status: 500 }
    );
  }
}
