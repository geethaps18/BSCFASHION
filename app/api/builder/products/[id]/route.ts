import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadVariantToCloudinary(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    return await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "bscfashion/products" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error", error);
              resolve(null);
            }
            resolve(result?.secure_url ?? null);
          }
        )
        .end(buffer);
    });
  } catch (err) {
    console.error("Variant upload failed", err);
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
            resource_type: "video", // 🔥 REQUIRED
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary video error", error);
              resolve(null);
            }
            resolve(result?.secure_url ?? null);
          }
        )
        .end(buffer);
    });
  } catch (err) {
    console.error("Video upload failed", err);
    return null;
  }
}


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

export async function PUT(req: Request, context: Context) {
  try {
    const { id } = await context.params;
    const form = await req.formData();
    // ---------- BRAND (EDIT SUPPORT) ----------
const brandIdRaw = form.get("brandId");
const brandId =
  typeof brandIdRaw === "string" && /^[a-f\d]{24}$/i.test(brandIdRaw)
    ? brandIdRaw
    : null;

const brandNameRaw = form.get("brandName");
const brandNameInput =
  typeof brandNameRaw === "string" ? brandNameRaw.trim() : null;


    // ---------- BASIC FIELDS ----------
    const name = form.get("name")?.toString() ?? "";
    const description = form.get("description")?.toString() ?? "";
    const price = form.get("price") ? Number(form.get("price")) : undefined;
    const mrp = form.get("mrp") ? Number(form.get("mrp")) : undefined;
const normalize = (v?: string) =>
  v ? v.trim().toLowerCase().replace(/\s+/g, "-") : null;

    // ---------- FETCH PREVIOUS PRODUCT ----------
    const prevProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!prevProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ---------- ✅ SAFE CATEGORY UPDATE ----------
  let category = prevProduct.category;
let subCategory = prevProduct.subCategory;
let subSubCategory = prevProduct.subSubCategory;

if (form.get("categoryPath")) {
  const path = JSON.parse(form.get("categoryPath")!.toString());

  category = normalize(path[0]);
  subCategory = normalize(path[1]);
  subSubCategory = normalize(path[2]);
}

const fit = form.get("fit")
  ? JSON.parse(form.get("fit")!.toString())
  : prevProduct.fit;

const fabricCare = form.get("fabricCare")
  ? JSON.parse(form.get("fabricCare")!.toString())
  : prevProduct.fabricCare;

const features = form.get("features")
  ? JSON.parse(form.get("features")!.toString())
  : prevProduct.features;
let finalBrandId = prevProduct.brandId ?? null;
let finalBrandName = prevProduct.brandName;

// If admin selected an existing brand
if (brandId) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (brand) {
    finalBrandId = brand.id;
    finalBrandName = brand.name;
  }
}

// If admin typed a custom brand name (Shopify-style)
else if (brandNameInput) {
  finalBrandId = null; // custom brand
  finalBrandName = brandNameInput;
}


    // ---------- PRODUCT IMAGES ----------
    const finalImages = form.get("images")
      ? JSON.parse(form.get("images")!.toString())
      : prevProduct.images;

    // ---------- VIDEO ----------
    const videoFile = form.get("video") as File | null;
    let videoUrl = prevProduct.video || null;

    if (videoFile && videoFile.size > 0) {
      const uploadedVideo = await uploadVideoToCloudinary(videoFile);
      if (uploadedVideo) videoUrl = uploadedVideo;
    }

    // ---------- UPDATE PRODUCT (ONCE) ----------
    const updateData: any = {
      name,
      description,
      fit,          // ✅ ADD
      fabricCare,   // ✅ ADD
      features,     // ✅ ADD

      category,
      subCategory,
      subSubCategory,
      images: finalImages,
      siteId: prevProduct.siteId,
      brandId: finalBrandId,
      brandName: finalBrandName,

      isPlatform: prevProduct.isPlatform,
    };

    if (price !== undefined) updateData.price = price;
    if (mrp !== undefined) updateData.mrp = mrp;
    if (videoUrl) updateData.video = videoUrl;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // ---------- VARIANTS ----------
const variantsRaw = form.get("variants");

if (variantsRaw) {
  const incomingVariants = JSON.parse(variantsRaw.toString());

  // 🔴 CRITICAL: clear carts FIRST
  await prisma.bag.deleteMany({
    where: { productId: id },
  });

  // 🔴 then delete variants
  await prisma.productVariant.deleteMany({
    where: { productId: id },
  });

  // 🔴 recreate variants
  for (let i = 0; i < incomingVariants.length; i++) {
    const v = incomingVariants[i];

    const files = form.getAll(`variantImages_${i}`) as File[];
    const uploadedImages: string[] = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const url = await uploadVariantToCloudinary(file);
        if (url) uploadedImages.push(url);
      }
    }

    const finalVariantImages = [
      ...(Array.isArray(v.existingImages) ? v.existingImages : []),
      ...uploadedImages,
    ];

    await prisma.productVariant.create({
      data: {
        productId: id,
        size: v.size ?? null,
        color: v.color ?? null,
      price:
  v.price !== undefined && v.price !== ""
    ? Number(v.price)
    : prevProduct.price,

        stock: Number(v.stock) || 0,
        images: finalVariantImages,
      },
    });
  }
}

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("BUILDER UPDATE ERROR", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
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

  try {
    await prisma.$transaction([
      prisma.productVariant.deleteMany({
        where: { productId: id },
      }),

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


