import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerId } from "@/utils/getOwnerId";

/* =========================
   GET — Seller's Sites
========================= */
export async function GET() {
  try {
    const ownerId = await getOwnerId(); // 🔥 logged-in SELLER

    if (!ownerId) {
      return NextResponse.json([], { status: 200 });
    }

    const sites = await prisma.site.findMany({
      where: { ownerId }, // ✅ ONLY HIS SITE
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        brandName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(sites);
  } catch (err) {
    console.error("GET sites error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

/* =========================
   POST — Create Site (SELLER)
========================= */
export async function POST(req: Request) {
  try {
    const ownerId = await getOwnerId();

    if (!ownerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, tagline, template } = await req.json();

    if (!name || !template) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔒 ONE SITE PER SELLER (CRITICAL)
    const existingSite = await prisma.site.findFirst({
      where: { ownerId },
    });

    if (existingSite) {
      return NextResponse.json(
        { error: "Seller already has a site" },
        { status: 400 }
      );
    }

    const slug =
      name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    const site = await prisma.site.create({
      data: {
        ownerId,
        brandName: name,
        name,
        slug,
        tagline,
        template,
        color: "#000000",
        section: [
          { type: "hero", title: name, subtitle: tagline || "" },
          { type: "products" },
          { type: "footer" },
        ],
      },
    });

    return NextResponse.json({
      id: site.id,
      slug: site.slug,
    });
  } catch (error) {
    console.error("Create site error:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
