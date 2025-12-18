import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerId } from "@/utils/getOwnerId";
import slugify from "slugify";

/* =========================
   ADMIN CREATE SELLER + SITE
========================= */
export async function POST(req: Request) {
  try {
    // 🔐 ADMIN AUTH CHECK
    const userId = await getOwnerId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 📦 BODY
    const { name, phone, email, brandName } = await req.json();

    if (!name || !phone || !brandName) {
      return NextResponse.json(
        { error: "Name, phone, and brand name are required" },
        { status: 400 }
      );
    }

    // 🔑 SLUG (safe + unique)
    const slug = `${slugify(brandName, {
      lower: true,
      strict: true,
    })}-${Date.now()}`;

    // 🔁 TRANSACTION (SAFE)
    const result = await prisma.$transaction(async (tx) => {
      const seller = await tx.user.create({
        data: {
          name,
          phone,
          email,
          role: "SELLER",
        },
      });

      const site = await tx.site.create({
        data: {
          ownerId: seller.id,
          name: brandName,
          brandName,
          slug,
          template: "default",
          color: "#000000",
          section: [],
        },
      });

      return { seller, site };
    });

    return NextResponse.json({
      success: true,
      seller: result.seller,
      site: result.site,
    });
  } catch (error: any) {
    console.error("CREATE SELLER ERROR:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Seller or site already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create seller" },
      { status: 500 }
    );
  }
}

/* =========================
   ADMIN FETCH SELLERS
========================= */
export async function GET() {
  try {
    // 🔐 ADMIN AUTH CHECK
    const userId = await getOwnerId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellers = await prisma.user.findMany({
      where: { role: "SELLER" },
      orderBy: { createdAt: "desc" },
      include: {
        sites: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error("FETCH SELLERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
      { status: 500 }
    );
  }
}
