import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/products
 * Query params:
 *  - page (default 1)
 *  - limit (default 20, max 100)
 *  - search (optional)
 *
 * Returns products with reminderCount (number of stock reminders)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let page = Number(url.searchParams.get("page") || 1);
    let limit = Number(url.searchParams.get("limit") || 20);
    const search = String(url.searchParams.get("search") || "").trim();
    const siteId = url.searchParams.get("siteId");

    // sanitize
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;
const where: Prisma.ProductWhereInput = {
  ...(siteId ? { siteId } : {}),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {}),
};


    // include _count.stockReminders so we can show reminderCount
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
  status: p.status,          // ✅ REQUIRED
  siteId: p.siteId,          // ✅ REQUIRED
  brandName: p.brandName,    // ✅ OPTIONAL but useful
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
    console.error("PRODUCT LIST ERROR", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
