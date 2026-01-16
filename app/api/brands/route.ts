import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import slugify from "slugify";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

/**
 * CREATE BRAND
 * POST /api/brands
 */
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, siteId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        sellerId: userId,   // ✅ SECURE
        siteId,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * LIST BRANDS
 * GET /api/brands
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    const brands = await prisma.brand.findMany({
      where: {
        sellerId: userId,
        ...(siteId ? { siteId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}
