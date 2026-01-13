// app/api/products/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

// ----------------------
// Cloudinary config
// ----------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ----------------------
// Upload helper (Cloudinary)
// ----------------------
async function uploadToCloudinary(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    return await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "bscfashion/products" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary error:", error);
              reject(null);
            }
            resolve(result?.secure_url ?? null);
          }
        )
        .end(buffer);
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

async function uploadVideoToCloudinary(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    return await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "bscfashion/product-videos",
            resource_type: "video", // 🔥 IMPORTANT
          },
          (error, result) => {
            if (error) {
              console.error(error);
              resolve(null);
            }
            resolve(result?.secure_url ?? null);
          }
        )
        .end(buffer);
    });
  } catch {
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

    const where: Record<string, any> = {};
    const category = searchParams.get("category");
const subCategory = searchParams.get("subCategory");
const subSubCategory = searchParams.get("subSubCategory");


   // GET /api/products
if (siteId) {
  where.siteId = siteId;
} else {
  where.status = "ACTIVE";
}

if (category) {
  where.category = category.toLowerCase();
}

if (subCategory) {
  where.subCategory = subCategory.toLowerCase();
}

if (subSubCategory) {
  where.subSubCategory = subSubCategory.toLowerCase();
}



    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        price: true,
        mrp: true,
        discount: true,
        images: true,
        video: true,
        brandName: true,
        category: true,
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            stock: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      products,
      hasMore: total > page * pageSize,
      page,
    });
  } catch (err) {
    console.error("GET /products error:", err);
    return NextResponse.json(
      { message: "Failed to fetch products" },
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

    // ----------------------
    // SITE + BRAND LOGIC
    // ----------------------
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

      brandName = site.name; // 🔥 Rock
      isPlatform = false;
    }

    // ----------------------
    // Basic fields
    // ----------------------
    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");

    const categoryPath = formData.get("categoryPath")
      ? JSON.parse(formData.get("categoryPath") as string)
      : [];

    const category = (categoryPath[0] || "").toLowerCase();
    const subCategory = (categoryPath[1] || "").toLowerCase();
    const subSubCategory = (categoryPath[2] || "").toLowerCase();

    const price = Number(formData.get("price") || 0);
    const mrp = Number(formData.get("mrp") || price);
    const discount =
      Number(formData.get("discount")) ||
      (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

    // ----------------------
    // Product images (frontend uploaded)
    // ----------------------
    const productImages: string[] = formData.get("images")
      ? JSON.parse(formData.get("images") as string)
      : [];

    // ----------------------
    // Extra fields
    // ----------------------
    const fit = formData.get("fit")
      ? JSON.parse(formData.get("fit") as string)
      : [];

    const fabricCare = formData.get("fabricCare")
      ? JSON.parse(formData.get("fabricCare") as string)
      : [];

    const features = formData.get("features")
      ? JSON.parse(formData.get("features") as string)
      : [];

    // ----------------------
    // Variants
    // ----------------------
    const variants = formData.get("variants")
      ? JSON.parse(formData.get("variants") as string)
      : [];

    const variantData = [];

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];

      const files = formData.getAll(`variantImages_${i}`) as File[];
      const uploadedImages: string[] = [];

      for (const file of files) {
        const url = await uploadToCloudinary(file);
        if (url) uploadedImages.push(url);
      }

      variantData.push({
        size: v.size ?? null,
        color: v.color ?? null,
        price: Number(v.price) || null,
        stock: Number(v.stock) || 0,
        images: uploadedImages,
      });
    }
const videoFile = formData.get("video") as File | null;

let videoUrl: string | null = null;
if (videoFile && videoFile.size > 0) {
  videoUrl = await uploadVideoToCloudinary(videoFile);
}

    // ----------------------
    // Save product
    // ----------------------
    const product = await prisma.product.create({
      data: {
        siteId,
        brandName,
        isPlatform,
        name,
        description,
        category,
        subCategory,
        subSubCategory,
        price,
        mrp,
        discount,
        images: productImages,
        video: videoUrl,
        fit,
        fabricCare,
        features,
        status: "ACTIVE",
        variants: {
          create: variantData,
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({
      message: "✅ Product added successfully",
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
