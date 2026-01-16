import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import slugify from "slugify";

/**
 * UPDATE BRAND
 * PUT /api/brands/:id
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, isActive } = body;

    const data: any = {};

    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
      data.slug = slugify(name, { lower: true, strict: true });
    }

    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data,
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    console.error("UPDATE BRAND ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

/**
 * DELETE BRAND
 * DELETE /api/brands/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ❗ Prevent delete if products exist
    const productCount = await prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Brand has products. Cannot delete." },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE BRAND ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
