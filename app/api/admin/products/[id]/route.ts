// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import { Buffer } from "buffer";
import nodemailer from "nodemailer";

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
async function uploadImage(file: File) {
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
      console.error("Supabase upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(`images/${fileName}`);

    return data?.publicUrl || null;
  } catch (err) {
    console.error("uploadImage error:", err);
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
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verifyAdmin(req);
    if (!adminId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const form = await req.formData();

    // parse fields
    const name = form.get("name")?.toString() ?? "";
    const description = form.get("description")?.toString() ?? "";
    const price = form.get("price") ? Number(form.get("price")) : undefined;
    const mrp = form.get("mrp") ? Number(form.get("mrp")) : undefined;
    const stock = form.get("stock") ? Number(form.get("stock")) : undefined;
const categoryPath = form.get("categoryPath")
  ? JSON.parse(form.get("categoryPath")!.toString())
  : [];

const [category, subCategory, subSubCategory] = categoryPath;


    const sizes = form.get("sizes")
      ? JSON.parse(form.get("sizes")!.toString())
      : [];

    // fetch previous product to compare stock
    const prevProduct = await prisma.product.findUnique({
  where: { id },
  include: { variants: true },
});



    if (!prevProduct)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // handle uploaded images (form field name = "images")
    const uploadedImages: string[] = [];
    const imageFiles = form.getAll("images") as File[]; // may be []
    for (const f of imageFiles || []) {
      try {
        // if file-like object, upload
        if ((f as File).size && (f as File).size > 0) {
          const url = await uploadImage(f as File);
          if (url) uploadedImages.push(url);
        }
      } catch (e) {
        console.warn("image upload skipped", e);
      }
    }

    // parse existingImages JSON from form if provided
    const existingImages = form.get("existingImages")
      ? JSON.parse(form.get("existingImages")!.toString())
      : [];

   const finalImages =
  uploadedImages.length > 0 ? uploadedImages : prevProduct.images;


    // prepare update data
    const updateData: any = {
      name,
      description,
      category,
      subCategory,
      subSubCategory,
      ...(finalImages.length ? { images: finalImages } : undefined),
    };

    if (price !== undefined) updateData.price = price;
    if (mrp !== undefined) updateData.mrp = mrp;
    if (stock !== undefined) updateData.stock = stock;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    const variantsRaw = form.get("variants");
if (variantsRaw) {
  const incomingVariants = JSON.parse(variantsRaw.toString());

  for (let i = 0; i < incomingVariants.length; i++) {
    const v = incomingVariants[i];

    const existingVariant = prevProduct.variants.find(
      ev => ev.size === v.size && ev.color === v.color
    );

    const variantImageFiles = form.getAll(`variantImages_${i}`) as File[];
    const uploadedVariantImages: string[] = [];

    for (const file of variantImageFiles) {
      if (file && file.size > 0) {
        const url = await uploadImage(file);
        if (url) uploadedVariantImages.push(url);
      }
    }

    if (existingVariant) {
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: {
          price: v.price ?? existingVariant.price,
          stock: v.stock ?? existingVariant.stock,
          images:
            uploadedVariantImages.length > 0
              ? uploadedVariantImages
              : existingVariant.images,
        },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: id,
          size: v.size,
          color: v.color,
          price: v.price,
          stock: v.stock,
          images: uploadedVariantImages,
        },
      });
    }
  }
}


    // ---------- RESTOCK LOGIC ----------
    const prevStock = prevProduct.stock ?? 0;
    const newStock = updated.stock ?? 0;

    // If previously out-of-stock (or 0) and now restocked (>0), notify only users who set reminders
    if (prevStock <= 0 && newStock > 0) {
      try {
        // 1) load reminders for this product (only userIds available in schema)
        const reminders = await prisma.stockReminder.findMany({
          where: { productId: id },
          select: { id: true, userId: true, createdAt: true },
        });

        const userIds = reminders.map((r) => r.userId).filter(Boolean);

        if (userIds.length > 0) {
          // 2) load the users (emails)
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, phone: true, name: true },
          });

          // 3) send notifications to each user that has an email (fire-and-forget)
          const sendPromises = users.map(async (u) => {
            if (!u.email) {
              console.info(`User ${u.id} has no email — skipping email`);
              return;
            }

            const subject = `Back in stock: ${updated.name ?? "Product"}`;
            const html = `
              <div style="font-family:Inter, sans-serif; max-width:600px; margin:auto; padding:20px; border-radius:10px; border:1px solid #f0e6b8;">
                <h2 style="margin:0 0 8px 0;">Good news${u.name ? " " + u.name : ""} — it's back!</h2>
                <p style="margin:8px 0;">The product <strong>${updated.name}</strong> is now back in stock. Order now while it's available.</p>
                <p style="margin-top:12px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/product/${updated.id}" target="_blank">View product</a></p>
                <div style="margin-top:18px; font-size:12px; color:#666;">Powered by TBITS INDIA Davanagere</div>
              </div>
            `;

            try {
              await sendEmail(u.email!, subject, html);
              console.log("Stock notify email sent to", u.email);
            } catch (err) {
              console.error("Failed to send stock email to", u.email, err);
            }
          });

          await Promise.allSettled(sendPromises);

          // 4) delete reminders for this product (they have been notified)
          await prisma.stockReminder.deleteMany({
            where: { productId: id },
          });

          console.log(`Notified ${users.length} users and deleted ${reminders.length} reminders.`);
        }
      } catch (notifyErr) {
        console.error("Restock notify error:", notifyErr);
        // don't fail overall update if notification fails
      }
    }

    return NextResponse.json({ message: "Product updated!", product: updated }, { status: 200 });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    return NextResponse.json({ error: "Update failed", details: String(err) }, { status: 500 });
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



