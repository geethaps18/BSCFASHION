import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

// ---------------- GET (same as admin) ----------------
export async function GET(_req: Request, context: Context) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }, // ✅ SAME AS ADMIN
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// ---------------- PUT (same logic as admin) ----------------
export async function PUT(req: Request, context: Context) {
  const { id } = await context.params;
  const form = await req.formData();
  

  // ---- basic fields ----
  const name = String(form.get("name") || "");
  const description = String(form.get("description") || "");
  const category = String(form.get("category") || "");
  const price = Number(form.get("price") || 0);
  const mrp = Number(form.get("mrp") || 0);
  const stock = Number(form.get("stock") || 0);

  // ---- fetch previous product ----
  const prevProduct = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!prevProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // ---- images (KEEP OLD IF NO NEW) ----
  const newImages = form.get("images")
    ? JSON.parse(String(form.get("images")))
    : [];

  const finalImages =
    newImages.length > 0 ? newImages : prevProduct.images;

  // ---- update product ----
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      category,
      price,
      mrp,
      stock,
      images: finalImages,
    },
  });

  // ---- variants (SAME AS ADMIN) ----
  const variantsRaw = form.get("variants");

  if (variantsRaw) {
    const incomingVariants = JSON.parse(String(variantsRaw));

    for (const v of incomingVariants) {
      const existingVariant = prevProduct.variants.find(
        ev => ev.size === v.size && ev.color === v.color
      );

      if (existingVariant) {
        // ✅ UPDATE VARIANT
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            price: v.price,
            stock: v.stock,
            images:
              v.images?.length > 0
                ? v.images
                : existingVariant.images,
          },
        });
      } else {
        // ✅ CREATE VARIANT
        await prisma.productVariant.create({
          data: {
            productId: id,
            size: v.size,
            color: v.color,
            price: v.price,
            stock: v.stock,
            images: v.images || [],
          },
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    product: updatedProduct,
  });
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


