import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pin = url.searchParams.get("pin");
    if (!pin) return NextResponse.json({ success: false, message: "Pin required" });

    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Failed to fetch pincode" });
  }
}
