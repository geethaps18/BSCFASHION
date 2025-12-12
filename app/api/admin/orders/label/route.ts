export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import fs from "fs";
import path from "path";

// pdfToBuffer → FIXED (NO doc.end() here)
function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    doc.on("data", (c) => buffers.push(c));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });
}

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId)
      return NextResponse.json({ error: "orderId missing" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true } },
        items: { include: { product: true } },
      },
    });

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Address parsing
    let addressObj: any = {};
    try {
      addressObj =
        typeof order.address === "string"
          ? JSON.parse(order.address)
          : order.address || {};
    } catch {
      addressObj = {};
    }

    const recipientName = addressObj.name || order.user?.name || "Customer";
    const recipientPhone = addressObj.phone || order.user?.phone || "N/A";

    const addrLines = [
      addressObj.doorNumber,
      addressObj.street,
      addressObj.landmark ? `Landmark: ${addressObj.landmark}` : "",
      `${addressObj.city ?? ""}${addressObj.state ? ", " + addressObj.state : ""}${
        addressObj.pincode ? " - " + addressObj.pincode : ""
      }`,
    ]
      .filter(Boolean)
      .map((s) => s.trim());

    // barcode
    const barcode = await bwipjs.toBuffer({
      bcid: "code128",
      text: order.id,
      scale: 3,
      height: 12,
    });

    // fonts
    const regularPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const boldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");

    // A6 page
    const doc = new PDFDocument({
      size: "A6",
      margins: { top: 8, left: 10, right: 10, bottom: 8 },
      font: fs.existsSync(regularPath) ? regularPath : undefined,
    });

    if (fs.existsSync(regularPath)) doc.registerFont("r", regularPath);
    if (fs.existsSync(boldPath)) doc.registerFont("b", boldPath);

    // convert PDF to buffer
    const pdfPromise = pdfToBuffer(doc);

    // ---------------------------------------------------
    // HEADER
    // ---------------------------------------------------
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fontSize(12).text("BSCFASHION", { align: "center" });

    if (fs.existsSync(regularPath)) doc.font("r");
    doc.fontSize(8).text("Since 1938 — B.S. Channabasappa & Sons", {
      align: "center",
    });

    doc.moveDown(0.5);

    // ---------------------------------------------------
    // ORDER + BARCODE
    // ---------------------------------------------------
    doc.fontSize(8).text(`Order ID: ${order.id}`);
    doc.moveDown(0.3);

    doc.image(barcode, { fit: [180, 50], align: "center" });
    doc.moveDown(0.5);

    // ---------------------------------------------------
    // SHIPPING
    // ---------------------------------------------------
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.text("Ship To:");
    if (fs.existsSync(regularPath)) doc.font("r");

    doc.fontSize(8).text(recipientName);
    doc.text(`Phone: ${recipientPhone}`);
    addrLines.forEach((line) => doc.text(line));

    doc.moveDown(0.5);

    // ---------------------------------------------------
    // ITEMS
    // ---------------------------------------------------
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fontSize(9).text("Items:");
    if (fs.existsSync(regularPath)) doc.font("r");

    order.items.forEach((it, i) => {
      const name = it.product?.name ?? it.name ?? "Product";
      const size = it.size ? ` (${it.size})` : "";
      const qty = it.quantity ?? 1;

      doc.fontSize(8).text(`${i + 1}. ${name}${size}  x${qty}`);
    });

    doc.moveDown(0.4);

    // ---------------------------------------------------
    // PAYMENT
    // ---------------------------------------------------
    if (fs.existsSync(boldPath)) doc.font("b");
    const total = order.totalAmount ?? 0;
    doc.fontSize(9).text(
      order.paymentMode === "COD"
        ? `COD: ₹${total.toFixed(2)}`
        : "Payment: Prepaid"
    );

    doc.moveDown(0.5);

    // ---------------------------------------------------
    // FOOTER
    // ---------------------------------------------------
    if (fs.existsSync(regularPath)) doc.font("r");
    doc.fontSize(7).text("Thank you for shopping with BSCFASHION 💛", {
      align: "center",
    });
    doc.text("Davanagere — 577001", { align: "center" });
    doc.text("Phone: 9770808020 | hello@bscfashion.com", {
      align: "center",
    });
    doc.text("Powered by TBITS INDIA Davanagere", { align: "center" });

    // IMPORTANT ✔ end after writing content
    doc.end();

    const pdfBuffer = await pdfPromise;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=label-${order.id}.pdf`,
      },
    });
  } catch (err: any) {
    console.error("PDF LABEL ERROR:", err);
    return NextResponse.json(
      { error: "PDF Label failed", message: err.message },
      { status: 500 }
    );
  }
}
