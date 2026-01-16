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

    const normalize = (v?: string | null) =>
      v ? v.trim().toLowerCase().replace(/\s+/g, "-") : null;

    // ✅ GET params
    const category = normalize(searchParams.get("category"));
    const subCategory = normalize(searchParams.get("subCategory"));
    const subSubCategory = normalize(searchParams.get("subSubCategory"));

    // ✅ THIS WAS MISSING
    const where: Record<string, any> = {};

    // ✅ visibility logic
    if (siteId) {
      where.siteId = siteId;
    } else {
      where.status = "ACTIVE";
    }

    // ✅ category filters
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (subSubCategory) where.subSubCategory = subSubCategory;

    const total = await prisma.product.count({ where });

    const productsRaw = await prisma.product.findMany({
  where,
  orderBy: { createdAt: "desc" },
  skip,
  take: pageSize,
  include: {
    brand: {
      select: {
        id: true,
        name: true,
      },
    },
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

const products = productsRaw.map((p) => ({
  ...p,
  brandName: p.brand?.name || p.brandName || "BSCFASHION",
}));

return NextResponse.json({
  products,
  total,
  hasMore: total > page * pageSize,
  page,
});


    return NextResponse.json({
      products,
      total,
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
// ----------------------
// POST — Add Product
// ----------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    /* ---------------------------------
       BRAND (ID + NAME INPUT)
    ----------------------------------*/
    const brandIdRaw = formData.get("brandId");
    const brandId =
      typeof brandIdRaw === "string" && /^[a-f\d]{24}$/i.test(brandIdRaw)
        ? brandIdRaw
        : null;

   const brandNameRaw = formData.get("brandName");
const brandNameInput =
  typeof brandNameRaw === "string" ? brandNameRaw.trim() : null;


    /* ---------------------------------
       SITE LOGIC
    ----------------------------------*/
    const siteIdRaw = formData.get("siteId");
    let siteId: string | null = null;
    let isPlatform = false;
    let site: any = null;

    if (
      typeof siteIdRaw === "string" &&
      /^[a-f\d]{24}$/i.test(siteIdRaw)
    ) {
      site = await prisma.site.findUnique({
        where: { id: siteIdRaw },
      });

      if (!site) {
        return NextResponse.json(
          { message: "Invalid site" },
          { status: 400 }
        );
      }

      siteId = siteIdRaw;
      isPlatform = false;
    } else {
      isPlatform = true;
    }
    

  

    /* ---------------------------------
       FINAL BRAND RESOLUTION
    ----------------------------------*/
    let finalBrandId: string | null = null;
    let finalBrandName: string | null = null;

    

    // 1️⃣ Selected existing brand
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (brand) {
        finalBrandId = brand.id;
        finalBrandName = brand.name;
      }
    }

    // 2️⃣ Typed brand (Nike, Adidas)
    if (!finalBrandName && brandNameInput) {
      finalBrandName = brandNameInput;
    }

    // 3️⃣ Fallback → site name
    if (!finalBrandName) {
      finalBrandName = site?.name || "BSCFASHION";
    }

    /* ---------------------------------
       BASIC FIELDS
    ----------------------------------*/
    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");

    const normalize = (v?: string) =>
      v ? v.trim().toLowerCase().replace(/\s+/g, "-") : null;

    const categoryPath = formData.get("categoryPath")
      ? JSON.parse(formData.get("categoryPath") as string)
      : [];

    const category = normalize(categoryPath[0]);
    const subCategory = normalize(categoryPath[1]);
    const subSubCategory = normalize(categoryPath[2]);

    const price = Number(formData.get("price") || 0);
    const mrp = Number(formData.get("mrp") || price);
    const discount =
      Number(formData.get("discount")) ||
      (mrp > price
        ? Math.round(((mrp - price) / mrp) * 100)
        : 0);

    /* ---------------------------------
       IMAGES + EXTRA FIELDS
    ----------------------------------*/
    const productImages: string[] = formData.get("images")
      ? JSON.parse(formData.get("images") as string)
      : [];

    const fit = formData.get("fit")
      ? JSON.parse(formData.get("fit") as string)
      : [];

    const fabricCare = formData.get("fabricCare")
      ? JSON.parse(formData.get("fabricCare") as string)
      : [];

    const features = formData.get("features")
      ? JSON.parse(formData.get("features") as string)
      : [];

    /* ---------------------------------
       VARIANTS
    ----------------------------------*/
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

    /* ---------------------------------
       VIDEO
    ----------------------------------*/
    const videoFile = formData.get("video") as File | null;
    let videoUrl: string | null = null;

    if (videoFile && videoFile.size > 0) {
      videoUrl = await uploadVideoToCloudinary(videoFile);
    }

    /* ---------------------------------
       CREATE PRODUCT
    ----------------------------------*/
    const product = await prisma.product.create({
      data: {
        siteId,
        brandId: finalBrandId,
        brandName: finalBrandName,
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

