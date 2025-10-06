// app/api/products/latest-prices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface LatestPricesRequestBody {
  productIds: string[]; // expect array of product IDs
}

export async function POST(req: NextRequest) {
  try {
    const body: LatestPricesRequestBody = await req.json();

    if (!body.productIds || !Array.isArray(body.productIds)) {
      return NextResponse.json(
        { error: "Invalid productIds. Must be a non-empty array." },
        { status: 400 }
      );
    }

    // Filter out null/undefined and ensure all IDs are strings
    const validIds = body.productIds.filter(Boolean).map(String);

    console.log("Valid product IDs:", validIds);

    if (validIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // no valid IDs
    }

    // Fetch latest prices from DB
    const products = await prisma.product.findMany({
      where: { id: { in: validIds } },
      select: { id: true, price: true },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("Latest prices API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json(
    { error: "GET method not allowed. Use POST." },
    { status: 405 }
  );
}
