import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const siteId = url.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { products: [], total: 0, page: 1, totalPages: 1 },
        { status: 200 }
      );
    }

    let page = Number(url.searchParams.get("page") || 1);
    let limit = Number(url.searchParams.get("limit") || 20);
    const search = String(url.searchParams.get("search") || "").trim();

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      siteId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { stockReminders: true },
        },
      },
    });

    const total = await prisma.product.count({ where });

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name ?? "",
      category: p.category ?? "",
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      images: Array.isArray(p.images) ? p.images : [],
      createdAt: p.createdAt,
      reminderCount: p._count?.stockReminders ?? 0,
    }));

    return NextResponse.json({
      products: mapped,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("BUILDER PRODUCT LIST ERROR", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
