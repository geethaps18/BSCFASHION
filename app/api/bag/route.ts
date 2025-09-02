import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

// ✅ Add to bag (or increase quantity)
export async function POST(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if already in bag
    const existing = await prisma.bag.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      const updated = await prisma.bag.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 },
        include: { product: true },
      });

      // Skip if product is missing
      if (!updated.product) {
        await prisma.bag.delete({ where: { id: existing.id } });
        return NextResponse.json({ error: "Product no longer exists", removed: true }, { status: 404 });
      }

      return NextResponse.json({ success: true, item: updated });
    }

    // Create new bag item
    const created = await prisma.bag.create({
      data: { userId, productId, quantity: 1 },
      include: { product: true },
    });

    if (!created.product) {
      await prisma.bag.delete({ where: { id: created.id } });
      return NextResponse.json({ error: "Product no longer exists", removed: true }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: created });
  } catch (err) {
    console.error("POST /bag error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ✅ Get all bag items
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const items = await prisma.bag.findMany({
      where: { userId },
      include: { product: true },
    });

    // Filter out items with missing products
    const validItems = items.filter((item) => item.product !== null);

    return NextResponse.json({ items: validItems });
  } catch (err) {
    console.error("GET /bag error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ✅ Update quantity
export async function PUT(req: NextRequest) {
  try {
    const { bagId, quantity } = await req.json();

    if (!bagId || quantity === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (quantity <= 0) {
      await prisma.bag.delete({ where: { id: bagId } });
      return NextResponse.json({ success: true, removed: true });
    }

    const updated = await prisma.bag.update({
      where: { id: bagId },
      data: { quantity },
      include: { product: true },
    });

    if (!updated.product) {
      await prisma.bag.delete({ where: { id: bagId } });
      return NextResponse.json({ error: "Product no longer exists", removed: true }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("PUT /bag error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ✅ Remove single bag item
export async function DELETE(req: NextRequest) {
  try {
    const { bagId } = await req.json();

    if (!bagId) {
      return NextResponse.json({ error: "Missing bagId" }, { status: 400 });
    }

    await prisma.bag.delete({ where: { id: bagId } });
    return NextResponse.json({ success: true, removed: true });
  } catch (err) {
    console.error("DELETE /bag error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
