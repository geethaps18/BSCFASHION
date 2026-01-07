import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/builder/products/:id
 */
export async function GET(_req: Request, context: Context) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        mrp: true,
        stock: true,
       
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("BUILDER GET ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/builder/products/:id
 */
export async function PUT(req: Request, context: Context) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();

    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "");
    const price = Number(formData.get("price") || 0);
    const mrp = Number(formData.get("mrp") || 0);
    const stock = Number(formData.get("stock") || 0);

    const sizes = formData.get("sizes")
      ? JSON.parse(String(formData.get("sizes")))
      : [];

    const existingImages = formData.get("oldImages")
      ? JSON.parse(String(formData.get("oldImages")))
      : [];

    // 🔥 UPDATE PRODUCT
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        price,
        mrp,
        stock,
        images: existingImages,
      },
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (err) {
    console.error("BUILDER UPDATE ERROR", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/builder/products/:id
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // delete logic here


  try {
    await prisma.$transaction([
      prisma.stockReminder.deleteMany({
        where: { productId: id },
      }),

      prisma.wishlist.deleteMany({
        where: { productId: id },
      }),

      prisma.bag.deleteMany({
        where: { productId: id },
      }),

      prisma.review.deleteMany({
        where: { productId: id },
      }),

      prisma.rating.deleteMany({
        where: { productId: id },
      }),

      prisma.product.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BUILDER DELETE ERROR", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}


