import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerId } from "@/utils/getOwnerId";

export async function GET() {
  try {
    const ownerId = await getOwnerId();

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst({
      where: { ownerId },
    });

    return NextResponse.json(
      settings ?? {
        storeName: "",
        email: "",
        phone: "",
        address: "",
        logoUrl: "",
        gstNumber: "",
        razorpay: false,
        cod: true,
      }
    );
  } catch (err) {
    console.error("GET settings error:", err);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const ownerId = await getOwnerId();

    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const existing = await prisma.settings.findFirst({
      where: { ownerId },
    });

    const settings = existing
      ? await prisma.settings.update({
          where: { id: existing.id },
          data: body,
        })
      : await prisma.settings.create({
          data: {
            ownerId,
            ...body,
          },
        });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("PUT settings error:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
