// app/api/admin/order/label/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import fs from "fs";
import path from "path";

// FIX Helvetica error inside Next.js
(PDFDocument as any).defaultFont = null;
(PDFDocument.prototype as any).defaultFont = null;

// Convert PDFKit stream → Buffer
function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "orderId missing" }, { status: 400 });

    // Fetch order with user + items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Address JSON
    let addressObj: any = {};
    try {
      addressObj =
        typeof order.address === "string"
          ? JSON.parse(order.address)
          : order.address ?? {};
    } catch {
      addressObj = {};
    }

    const customerName = order.user?.name ?? addressObj.name ?? "Customer";
    const customerPhone = order.user?.phone ?? addressObj.phone ?? "";
    const addrLines = [
      addressObj.doorNumber,
      addressObj.street,
      addressObj.landmark ? `Landmark: ${addressObj.landmark}` : "",
      `${addressObj.city ?? ""}, ${addressObj.state ?? ""} - ${
        addressObj.pincode ?? ""
      }`,
    ].filter(Boolean);

    // Barcode (Code128)
    const barcode = await bwipjs.toBuffer({
      bcid: "code128",
      text: order.id,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });

    // PDF document
    const doc = new PDFDocument({
      size: "A6",
      margins: { top: 10, left: 12, right: 12, bottom: 10 },
    });

    // Load custom fonts
    const robotoRegular = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Roboto-Regular.ttf"
    );
    const robotoBold = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Roboto-Bold.ttf"
    );

    doc.registerFont("regular", robotoRegular);
    doc.registerFont("bold", robotoBold);

    // ---------- HEADER ----------
    doc.font("bold").fontSize(12).text("BSCFASHION", { align: "left" });
    doc.moveDown(0.2);

    doc.font("regular").fontSize(9).text(`Order ID: ${order.id}`);
    if (order.trackingNumber)
      doc.text(`Tracking: ${order.trackingNumber}`);

    doc.moveDown(0.5);

    // Barcode
    doc.image(barcode, {
      fit: [200, 60],
      align: "center",
    });

    doc.moveDown(0.5);

    // ---------- CUSTOMER ----------
    doc.font("bold").fontSize(10).text("Ship To:");
    doc.font("regular").fontSize(9).text(customerName);
    if (customerPhone) doc.text(`Phone: ${customerPhone}`);
    addrLines.forEach((line) => doc.text(line));

    doc.moveDown(0.4);

    // ---------- ITEMS ----------
    doc.font("bold").fontSize(9).text("Items:");
    doc.font("regular").fontSize(8);

    order.items.forEach((it) => {
      const productName = it.product?.name ?? "Product";
      const qty = it.quantity ?? 1;
      const size = it.size ? ` | Size: ${it.size}` : "";
      doc.text(`- ${productName} x${qty}${size}`);
    });

    doc.moveDown(0.5);

    // ---------- PAYMENT ----------
    if (order.paymentMode === "COD") {
      doc.font("bold").fontSize(10).text(
        `COD Amount: ₹${order.totalAmount.toFixed(2)}`
      );
    } else {
      doc.font("regular").fontSize(9).text(`Paid via: ${order.paymentMode}`);
    }

    doc.moveDown(0.5);

    // ---------- SELLER ----------
    doc.font("bold").fontSize(8).text("Seller:");
    doc.font("regular").fontSize(8).text("B.S. Channabasappa & Sons");
    doc.text("Davanagere, Karnataka");
    doc.text("Phone: +91-XXXXXXXXXX");

    const pdfBuffer = await pdfToBuffer(doc);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=label-${order.id}.pdf`,
      },
    });
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    return NextResponse.json(
      { error: "PDF Label failed", message: err.message },
      { status: 500 }
    );
  }
}
