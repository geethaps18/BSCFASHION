import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // 🔐 TEMP seller (replace with auth later)
    const sellerId = "693da742e05c0183b0b6b916";
    const siteId = formData.get("siteId") as string;

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // ✅ FETCH SITE OBJECT (THIS WAS MISSING)
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 400 }
      );
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const mrp = Number(formData.get("mrp"));
    const discount = Number(formData.get("discount") || 0);
    const stock = Number(formData.get("stock"));

    const sizes = JSON.parse((formData.get("sizes") as string) || "[]");

    // 🖼️ TEMP image handling
    const images: string[] = [];
    const imageFiles = formData.getAll("images") as File[];

    for (const file of imageFiles) {
      images.push(`/uploads/${file.name}`);
    }

    const product = await prisma.product.create({
      data: {
        name,
        brandName: site.name, // ✅ FIXED
        description,
        price,
        mrp,
        discount,
        stock,
      
        images,

        sellerId,
        siteId,

        isPlatform: false,
        status: "PENDING",
      },
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
