import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signJwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { deliveryBoyId, phone, otp } = await req.json();

    if (!deliveryBoyId || !phone || !otp) {
      return NextResponse.json(
        { message: "DeliveryBoy ID, phone & OTP are required" },
        { status: 400 }
      );
    }

    // 1 — Find delivery boy
    const deliveryBoy = await prisma.deliveryBoy.findUnique({
      where: { deliveryBoyId },
    });

    if (!deliveryBoy) {
      return NextResponse.json({ message: "Invalid Delivery Boy ID" }, { status: 404 });
    }

    // 2 — Verify phone
    if (deliveryBoy.phone !== phone) {
      return NextResponse.json(
        { message: "Phone number does not match our records" },
        { status: 401 }
      );
    }

    // 3 — OTP validate
    if (!deliveryBoy.otp || deliveryBoy.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 401 });
    }

    // 4 — Create token
    const token = signJwt({
      id: deliveryBoy.id,
      deliveryBoyId,
      name: deliveryBoy.name,
    });

    // 5 — Remove OTP from DB after login
    await prisma.deliveryBoy.update({
      where: { deliveryBoyId },
      data: { otp: null },
    });

    // 6 — Set global cookie (REAL AUTH)
    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      deliveryBoyId,
      name: deliveryBoy.name,
    });

    res.cookies.set("delivery_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
