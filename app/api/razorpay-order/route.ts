import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    console.log("RAZORPAY KEY FROM SERVER =", process.env.RAZORPAY_KEY_ID);
    console.log("RP KEY:", process.env.RAZORPAY_KEY_ID);
console.log("RP SECRET:", process.env.RAZORPAY_KEY_SECRET ? "YES_SECRET" : "NO_SECRET");


    const { amount } = await req.json();

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay API Keys on Server" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      notes: { source: "BSCFASHION" }
    });

    const hostedUrl = 
      `https://api.razorpay.com/v1/checkout/embedded?order_id=${order.id}` +
      `&redirect_to=${process.env.NEXT_PUBLIC_BASE_URL}/payment-callback`;

    return NextResponse.json({ success: true, order, hostedUrl });

  } catch (err: any) {
    console.error("Razorpay Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
