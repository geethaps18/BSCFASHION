import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { orderId, otp } = await req.json();

    if (!orderId || !otp) {
      return NextResponse.json(
        { message: "Order ID and OTP required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.deliveryOtp) {
      return NextResponse.json(
        { message: "No OTP generated for this order" },
        { status: 400 }
      );
    }

    if (order.deliveryOtp !== otp.trim()) {
      return NextResponse.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP matched → mark delivered
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        deliveryOtp: null, // clear OTP after success
      },
    });

    return NextResponse.json({
      message: "OTP verified. Order marked as Delivered.",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal error verifying OTP" },
      { status: 500 }
    );
  }
}
