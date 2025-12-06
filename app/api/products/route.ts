// app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
// ----------------------
// Helper: upload file to Supabase
// ----------------------
async function uploadToSupabase(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(`images/${fileName}`, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("products").getPublicUrl(
      `images/${fileName}`
    );

    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

// ----------------------
// GET products (with optional filters + similar products)
// ----------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const mainSlug = searchParams.get("main");
    const sub1Slug = searchParams.get("sub1");
    const sub2Slug = searchParams.get("sub2");
    const excludeId = searchParams.get("exclude"); // exclude current product
    const limit = Number(searchParams.get("limit") || 100000);

    const slugToName = (slug: string | null) =>
      slug ? slug.replace(/-/g, " ").toLowerCase() : undefined;

    const main = slugToName(mainSlug);
    const sub1 = slugToName(sub1Slug);
    const sub2 = slugToName(sub2Slug);

    const where: any = {};

    if (main && !sub1 && !sub2) {
      // Only main category
      where.category = { equals: main, mode: "insensitive" };
    } else if (sub1 && !sub2) {
      where.subCategory = { equals: sub1, mode: "insensitive" };
    } else if (sub2) {
      where.subSubCategory = { equals: sub2, mode: "insensitive" };
    }

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { variants: true },
    });

   const safeProducts = products.map((p: typeof products[number]) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : [],
  variants:
    p.variants?.map((v: typeof p.variants[number]) => ({
      ...v,
      images: Array.isArray(v.images) ? v.images : [],
    })) ?? [],
}));


    return NextResponse.json({ products: safeProducts });
  } catch (err: any) {
    console.error("GET /products error:", err);
    return NextResponse.json(
      { message: "Failed to fetch products", error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------
// POST new product
// ----------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const name = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";

    const categoryPath = formData.get("categoryPath")
      ? JSON.parse(formData.get("categoryPath") as string)
      : [];

    const category = (categoryPath[0] || "").toLowerCase();
    const subCategory = (categoryPath[1] || "").toLowerCase();
    const subSubCategory = (categoryPath[2] || "").toLowerCase();

    const price = Number(formData.get("price")) || 0;
    const mrp =
      Number(formData.get("mrp")) || price + Math.floor(Math.random() * 200 + 50);
    const discount =
      Number(formData.get("discount")) ||
      (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
    const stock = Number(formData.get("stock")) || 0;

    const sizes: string[] = formData.get("sizes")
      ? JSON.parse(formData.get("sizes") as string)
      : [];
    const colors: string[] = formData.get("colors")
      ? JSON.parse(formData.get("colors") as string)
      : [];

    // Upload main images
    const productFiles = formData.getAll("images") as File[];
    const productImages: string[] = [];
    for (const file of productFiles) {
      const url = await uploadToSupabase(file);
      if (url) productImages.push(url);
    }

    // Parse variants
    const variantsRaw = formData.get("variants") as string;
    const variantsParsed: {
      sizes?: string[];
      colors?: string[];
      design?: string;
      price?: number;
      mrp?: number;
      discount?: number;
      stock?: number;
    }[] = variantsRaw ? JSON.parse(variantsRaw) : [];

    const variantData = await Promise.all(
      variantsParsed.map(async (v, i) => {
        const uploadedVariantImages: string[] = [];
        const variantFiles = formData.getAll(`variantImages-${i}`) as File[];
        for (const file of variantFiles) {
          const url = await uploadToSupabase(file);
          if (url) uploadedVariantImages.push(url);
        }

        return {
          sizes: v.sizes || [],
          colors: v.colors || [],
          design: v.design || "",
          price: Number(v.price ?? price),
          mrp: v.mrp ? Number(v.mrp) : mrp,
          discount: v.discount ? Number(v.discount) : discount,
          stock: Number(v.stock ?? 0),
          images: uploadedVariantImages,
        };
      })
    );

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        subCategory,
        subSubCategory,
        price,
        mrp,
        discount,
        stock: variantData.length
          ? variantData.reduce((sum, v) => sum + v.stock, 0)
          : stock,
        sizes,
        colors,
        images: productImages,
        variants: { create: variantData },
      },
      include: { variants: true },
    });

    return NextResponse.json({
      message: "✅ Product added successfully!",
      product,
    });
  } catch (err: any) {
    console.error("POST /products error:", err);
    return NextResponse.json(
      { message: "❌ Failed to add product", error: err.message },
      { status: 500 }
    );
  }
}
