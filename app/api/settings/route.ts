import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { identcode } from "bwip-js";

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ownerId:"identcode",
          storeName: "BSCFASHION",
          email: "hello@bschfashion.com",
          phone: "9770808020",
          address: "Kalikadevi Road, Davangere – 577001",
        }
      });
    }

    return NextResponse.json(settings);

  } catch (err) {
    console.error("SETTINGS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updated = await prisma.settings.updateMany({
      data: {
        storeName: body.storeName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        razorpay: body.razorpay,
        cod: body.cod,
        logoUrl: body.logoUrl ?? null,
      }
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("SETTINGS SAVE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

