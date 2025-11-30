import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, city, pincode } = await req.json();

    if (!name || !phone || !email) {
      return NextResponse.json({ error: "Name, Phone, Email are required" }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.deliveryBoy.findFirst({
      where: { OR: [{ phone }, { email }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Delivery boy with this phone or email already exists" }, { status: 400 });
    }

    const deliveryBoy = await prisma.deliveryBoy.create({
      data: {
        name,
        phone,
        email,
        city,
        pincode,
        deliveryBoyId: uuidv4(),
      },
    });

    return NextResponse.json({
      message: "Delivery boy registered successfully",
      deliveryBoyId: deliveryBoy.deliveryBoyId,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
