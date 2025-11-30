import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { contact, otp } = await req.json();

    if (!contact || !otp) {
      return NextResponse.json({ error: "Contact and OTP are required" }, { status: 400 });
    }

    const deliveryBoy = await prisma.deliveryBoy.findUnique({
      where: { phone: contact },
    });

    if (!deliveryBoy) {
      return NextResponse.json({ error: "Delivery boy not found" }, { status: 404 });
    }

    // Check OTP
    if (deliveryBoy.otp !== otp) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    // Optional: check expiry
    if (deliveryBoy.otpExpiresAt && new Date() > deliveryBoy.otpExpiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // OTP correct, mark verified
    await prisma.deliveryBoy.update({
      where: { id: deliveryBoy.id },
      data: { otp: null, otpExpiresAt: null },
    });

    return NextResponse.json({
      message: "OTP verified ✅",
      deliveryBoyId: deliveryBoy.id,
      name: deliveryBoy.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
