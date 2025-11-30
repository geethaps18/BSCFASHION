// app/api/razorpay-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay"; // ✅ ES module import

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR" } = await req.json();

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: "Razorpay keys missing" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Razorpay expects amount in paise
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      payment_capture: true,
      notes: {
        purpose: "BSCFASHION Order Payment",
      },
    });

    // Hosted Checkout URL
    const hostedUrl = `https://api.razorpay.com/v1/checkout/embedded?order_id=${order.id}`;

    return NextResponse.json({ success: true, order, hostedUrl });
  } catch (err: any) {
    console.error("Razorpay order error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
