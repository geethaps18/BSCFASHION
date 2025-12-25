// app/api/products/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Buffer } from "buffer";

// ----------------------
// Upload helper
// ----------------------
async function uploadToSupabase(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
   const safeName = file.name.replace(/\s+/g, "-");
const fileName = `${Date.now()}_${safeName}`;


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

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(`images/${fileName}`);

    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

// ----------------------
// GET Products
// ----------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    const page = Number(searchParams.get("page") || 1);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const mainSlug = searchParams.get("main");
    const sub1Slug = searchParams.get("sub1");
    const sub2Slug = searchParams.get("sub2");
    const home = searchParams.get("home");
    const excludeId = searchParams.get("exclude");
    

    const slugToName = (slug: string | null) =>
      slug ? slug.replace(/-/g, " ").toLowerCase() : undefined;

    const main = slugToName(mainSlug);
    const sub1 = slugToName(sub1Slug);
    const sub2 = slugToName(sub2Slug);

    const where: Record<string, any> = {};


    // ✅ validate site only if siteId exists
    if (siteId) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
      });

      if (!site) {
        return NextResponse.json(
          { message: "Invalid site" },
          { status: 400 }
        );
      }

      where.siteId = siteId;
    }

    if (home !== "true") {
      if (main && !sub1 && !sub2) {
        where.category = { equals: main, mode: "insensitive" };
      } else if (sub1 && !sub2) {
        where.subCategory = { equals: sub1, mode: "insensitive" };
      } else if (sub2) {
        where.subSubCategory = { equals: sub2, mode: "insensitive" };
      }
    }

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      products,
      hasMore: total > page * pageSize,
      page,
    });
  } catch (err: any) {
    console.error("GET /products error:", err);
    return NextResponse.json(
      { message: "Failed to fetch products", error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------
// POST — Add Product
// ----------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

const siteIdRaw = formData.get("siteId");
let siteId: string | null = null;
let brandName = "BSCFASHION";
let isPlatform = true;

if (siteIdRaw) {
  siteId = String(siteIdRaw);

  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    return NextResponse.json(
      { message: "Invalid site" },
      { status: 400 }
    );
  }

  brandName = site.name;
  isPlatform = false;
}


    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");

    const categoryPath = formData.get("categoryPath")
      ? JSON.parse(String(formData.get("categoryPath")))
      : [];

    const category = (categoryPath[0] || "").toLowerCase();
    const subCategory = (categoryPath[1] || "").toLowerCase();
    const subSubCategory = (categoryPath[2] || "").toLowerCase();

    const price = Number(formData.get("price") || 0);
    const mrp = Number(formData.get("mrp") || price);
    const discount =
      Number(formData.get("discount")) ||
      (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
    const stock = Number(formData.get("stock") || 0);

    const sizes = formData.get("sizes")
      ? JSON.parse(String(formData.get("sizes")))
      : [];

    const colors = formData.get("colors")
      ? JSON.parse(String(formData.get("colors")))
      : [];

    const productFiles = formData.getAll("images") as File[];
    const productImages: string[] = [];
 const fit = formData.get("fit")
  ? JSON.parse(formData.get("fit") as string)
  : [];

const fabricCare = formData.get("fabricCare")
  ? JSON.parse(formData.get("fabricCare") as string)
  : [];

const features = formData.get("features")
  ? JSON.parse(formData.get("features") as string)
  : [];


    for (const file of productFiles) {
      const url = await uploadToSupabase(file);
      if (url) productImages.push(url);
    }

   const product = await prisma.product.create({
  data: {
    siteId,                 // null for admin
    brandName,              // BSCFASHION or site name
    isPlatform,             // true for admin
    name,
    description,
     fit,           // ✅ ADD
    fabricCare,    // ✅ ADD
    features, 
    category,
    subCategory,
    subSubCategory,
    price,
    mrp,
    discount,
    stock,
    sizes,
    images: productImages,
    status: "ACTIVE",       // admin products auto-live
  },
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
