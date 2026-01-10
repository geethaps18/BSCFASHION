// app/api/media/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

export const dynamic = "force-dynamic";

// Cloudinary config (SERVER ONLY)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "bscfashion/products",
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url, // ✅ this is what frontend expects
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}
