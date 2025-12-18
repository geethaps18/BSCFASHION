// app/api/otp/verify/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_CONTACT!;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

export async function POST(req: Request) {
  try {
    const { contact, otp, name, signup } = await req.json();

    if (!contact || !otp) {
      return NextResponse.json(
        { message: "Contact and OTP are required ❌" },
        { status: 400 }
      );
    }

    /* ---------------- 1️⃣ Validate OTP ---------------- */
    const record = await prisma.oTP.findFirst({
      where: { contact },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ message: "No OTP found ❌" }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP ❌" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await prisma.oTP.deleteMany({ where: { contact } });
      return NextResponse.json({ message: "OTP expired ❌" }, { status: 400 });
    }

    await prisma.oTP.deleteMany({ where: { contact } });

    /* ---------------- 2️⃣ Find / Create User ---------------- */
    const isEmail = contact.includes("@");
    let user = isEmail
      ? await prisma.user.findFirst({ where: { email: contact } })
      : await prisma.user.findFirst({ where: { phone: contact } });

    if (!user && signup) {
      user = await prisma.user.create({
        data: {
          email: isEmail ? contact : undefined,
          phone: !isEmail ? contact : undefined,
          name: name || "New User",
          role: "CUSTOMER",
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found ❌" },
        { status: 404 }
      );
    }

    /* ---------------- 3️⃣ Blocked check ---------------- */
    if (user.blocked) {
      return NextResponse.json(
        { message: "Your account is blocked ❌" },
        { status: 403 }
      );
    }

    /* ---------------- 4️⃣ ADMIN auto-detection ---------------- */
    let finalRole = user.role;

    if (user.email && user.email === ADMIN_EMAIL) {
      finalRole = "ADMIN";

      if (user.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    }

    /* ---------------- 5️⃣ Seller site lookup ---------------- */
    let siteId: string | null = null;

    if (finalRole === "SELLER") {
      const site = await prisma.site.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      siteId = site?.id || null;
    }

    /* ---------------- 6️⃣ JWT ---------------- */
    const token = jwt.sign(
      {
        userId: user.id,
        role: finalRole,
        siteId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        contact: user.email || user.phone,
      },
      JWT_SECRET,
      { expiresIn: "365d" }
    );

    return NextResponse.json({
      message: "OTP verified ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: finalRole,
        siteId,
      },
    });
  } catch (err: any) {
    console.error("OTP VERIFY ERROR:", err);
    return NextResponse.json(
      { message: "Something went wrong ❌" },
      { status: 500 }
    );
  }
}
