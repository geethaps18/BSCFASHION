// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import jwt from "jsonwebtoken";

import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});


const JWT_SECRET = process.env.JWT_SECRET!;

// ---------------------------------------------------
// AUTH CHECK (admin)
function verifyAdmin(req: NextRequest) {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------
// Supabase upload helper
async function uploadToCloudinary(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    return await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "bscfashion/products" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary error", error);
              resolve(null);
            }
            resolve(result?.secure_url ?? null);
          }
        )
        .end(buffer);
    });
  } catch (err) {
    console.error("Upload failed", err);
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
            resource_type: "video",
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



// ---------------------------------------------------
// Small helper to send an email (nodemailer)
// Customize / replace with your existing notification util if you have one
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER / EMAIL_PASS not configured - skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ---------------------------------------------------
// GET product for admin edit page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

  const product = await prisma.product.findUnique({
  where: { id },
  include: { variants: true }, // 🔥 REQUIRED
});


    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET /admin/products/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ---------------------------------------------------
// PUT update product (admin only)
// - handles images upload
// - if product restocked (prevStock <=0 && newStock > 0) send notifications
// ---------------------------------------------------
// PUT update product (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ---------------- AUTH ----------------
    const adminId = verifyAdmin(req);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const form = await req.formData();

    // ---------------- BASIC FIELDS ----------------
    const name = form.get("name")?.toString() ?? "";
    const description = form.get("description")?.toString() ?? "";
    const price = form.get("price") ? Number(form.get("price")) : undefined;
    const mrp = form.get("mrp") ? Number(form.get("mrp")) : undefined;
    

    const categoryPath = form.get("categoryPath")
      ? JSON.parse(form.get("categoryPath")!.toString())
      : [];

    const [category, subCategory, subSubCategory] = categoryPath;

    // ---------------- FETCH PREVIOUS PRODUCT ----------------
    const prevProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!prevProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
const brandIdRaw = form.get("brandId");
const brandNameRaw = form.get("brandName");

const brandId =
  typeof brandIdRaw === "string" && /^[a-f\d]{24}$/i.test(brandIdRaw)
    ? brandIdRaw
    : null;

let resolvedBrandName = prevProduct.brandName; // default

    // ---------------- PRODUCT IMAGES ----------------
    const finalImages = form.get("images")
      ? JSON.parse(form.get("images")!.toString())
      : prevProduct.images;

    // ---------------- VIDEO (CLOUDINARY) ----------------
    const videoFile = form.get("video") as File | null;
    let videoUrl = prevProduct.video || null;

    if (videoFile && videoFile.size > 0) {
      const uploadedVideo = await uploadVideoToCloudinary(videoFile);
      if (uploadedVideo) videoUrl = uploadedVideo;
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
  if (brandId) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  });

  if (brand) {
    resolvedBrandName = brand.name;
  }
} else if (typeof brandNameRaw === "string" && brandNameRaw.trim()) {
  resolvedBrandName = brandNameRaw.trim();
}


    // ---------------- UPDATE PRODUCT ----------------
  const updateData: any = {
  name,
  description,
  category,
  subCategory,
  subSubCategory,
  images: finalImages,

  fit,
  fabricCare,
  features,

  siteId: prevProduct.siteId,
brandId: brandId,              // 🔥 NEW
brandName: resolvedBrandName,  // 🔥 UPDATED

  isPlatform: prevProduct.isPlatform,
};


    if (price !== undefined) updateData.price = price;
    if (mrp !== undefined) updateData.mrp = mrp;
    if (videoUrl) updateData.video = videoUrl;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // ---------------- VARIANTS ----------------
    const variantsRaw = form.get("variants");

    if (variantsRaw) {
      const incomingVariants = JSON.parse(variantsRaw.toString());

      // delete old variants
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      // recreate variants
      for (let i = 0; i < incomingVariants.length; i++) {
        const v = incomingVariants[i];

        const variantFiles = form.getAll(
          `variantImages_${i}`
        ) as File[];

        const uploadedImages: string[] = [];

        for (const file of variantFiles) {
          if (file && file.size > 0) {
            const url = await uploadToCloudinary(file);
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
            price: Number(v.price) || null,
            stock: Number(v.stock) || 0,
            images: finalVariantImages,
          },
        });
      }
    }

    // ---------------- RESPONSE ----------------
    return NextResponse.json(
      { message: "Product updated!", product: updatedProduct },
      { status: 200 }
    );
  } catch (err) {
    console.error("ADMIN UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Update failed", details: String(err) },
      { status: 500 }
    );
  }
}




// ---------------------------------------------------
// DELETE product (admin)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // your delete logic here


  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Delete Stock Reminders
      await tx.stockReminder.deleteMany({
        where: { productId: id },
      });

      // 2️⃣ Delete Wishlist items
      await tx.wishlist.deleteMany({
        where: { productId: id },
      });

      // 3️⃣ Delete Bag items
      await tx.bag.deleteMany({
        where: { productId: id },
      });

      // 4️⃣ Delete Reviews
      await tx.review.deleteMany({
        where: { productId: id },
      });

      // 5️⃣ Delete Ratings
      await tx.rating.deleteMany({
        where: { productId: id },
      });

      // 6️⃣ 🔥 DELETE PRODUCT VARIANTS FIRST
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      // 7️⃣ ✅ NOW delete Product (NO ERROR)
      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}



