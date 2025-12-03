import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { contact, otp, name, signup } = await req.json();

    if (!contact || !otp) {
      return NextResponse.json(
        { message: "Contact and OTP are required ❌" },
        { status: 400 }
      );
    }

    // Fetch OTP
    const record = await prisma.oTP.findFirst({
      where: { contact },
      orderBy: { createdAt: "desc" },
    });

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

    await prisma.oTP.deleteMany({ where: { contact } });

    // Create user if needed
    const isEmail = contact.includes("@");
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

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, contact },
      process.env.JWT_SECRET || "supersecretkey123",
      { expiresIn: "7d" }
    );

    // ✅ SET COOKIE ON SERVER — REAL FIX
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({
      success: true,
      message: "OTP verified ✅",
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
