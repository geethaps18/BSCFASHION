// app/api/razorpay-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR" } = await req.json();

    // Check Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: "Razorpay keys missing" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Razorpay expects amount in paise
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency,
      payment_capture: true, // boolean, not number
      notes: {
        purpose: "BSCFASHION Order Payment",
      },
    });

    // Return order and hosted checkout URL
    const hostedUrl = `https://api.razorpay.com/v1/checkout/embedded?order_id=${order.id}`;

    return NextResponse.json({ success: true, order, hostedUrl });
  } catch (err: any) {
    console.error("Razorpay order error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "internal error" },
      { status: 500 }
    );
  }
}
