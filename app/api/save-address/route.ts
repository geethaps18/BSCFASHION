import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db"; // make sure this points to your Prisma client

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, phone, street, city, state, pincode } = body;

    if (!userId || !name || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        street,
        city,
        state,
        pincode,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (err: any) {
    console.error("Error saving address:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
