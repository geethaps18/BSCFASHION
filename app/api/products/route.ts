// app/api/products/route.ts
import { NextResponse } from "next/server";
import db from "@/utils/db";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to upload a file to Supabase and return public URL
async function uploadToSupabase(file: File) {
  const buffer = Buffer.from(await (file as any).arrayBuffer());
  const fileName = `${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(`images/${fileName}`, buffer, { contentType: file.type || "application/octet-stream" });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const { data } = supabase.storage.from("products").getPublicUrl(`images/${fileName}`);
  return data?.publicUrl || null;
}

// GET all products
export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    });

    // Normalize images
    const safeProducts = products.map((p) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
      variants: p.variants.map((v) => ({
        ...v,
        images: Array.isArray(v.images) ? v.images : [],
      })),
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

// POST new product
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Product fields
    const name = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "";
    const price = Number(formData.get("price")) || 0;
    let mrp = formData.get("mrp") ? Number(formData.get("mrp")) : price + Math.floor(Math.random() * 200 + 50);
    let discount = formData.get("discount")
      ? Number(formData.get("discount"))
      : mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

    // Upload main images
    const productFiles = formData.getAll("images") as File[];
    const productImages: string[] = [];

    for (const file of productFiles) {
      if (!file) continue;
      try {
        const url = await uploadToSupabase(file);
        if (url) productImages.push(url);
      } catch (e) {
        console.warn("Failed main image upload", e);
      }
    }

    // Handle variants
    const variantsRaw = formData.get("variants") as string;
    const variantsParsed = variantsRaw ? JSON.parse(variantsRaw) : [];
    const variantData = [];

    for (const variant of variantsParsed) {
      const uploadedVariantImages: string[] = [];
      for (const file of variant.images || []) {
        try {
          const url = await uploadToSupabase(file);
          if (url) uploadedVariantImages.push(url);
        } catch (e) {
          console.warn("Failed variant image upload", e);
        }
      }

      variantData.push({
        sizes: variant.sizes || [],
        color: Array.isArray(variant.color) ? variant.color : [variant.color || ""],
        design: variant.design || "",
        price: Number(variant.price ?? price),
        mrp: variant.mrp ? Number(variant.mrp) : mrp,
        discount: variant.discount ? Number(variant.discount) : discount,
        stock: Number(variant.stock ?? 0),
        images: uploadedVariantImages,
      });
    }

    // Create product in DB
    const product = await db.product.create({
      data: {
        name,
        description,
        category,
        price,
        mrp,
        discount,
        images: productImages,
        stock: variantData.reduce((sum, v) => sum + v.stock, 0),
        variants: {
          create: variantData,
        },
      },
    });

    return NextResponse.json({ message: "✅ Product added successfully!", product });
  } catch (err: any) {
    console.error("POST /products error:", err);
    return NextResponse.json(
      { message: "❌ Failed to add product", error: err.message },
      { status: 500 }
    );
  }
}
