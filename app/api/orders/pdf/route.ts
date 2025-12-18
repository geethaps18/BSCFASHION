export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

/* ---------------- PDF BUFFER ---------------- */
function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, bw } = await req.json();

    if (!orderId) {
      return new Response("orderId missing", { status: 400 });
    }

    /* ---------------- Fetch Order ---------------- */
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                siteId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return new Response("Order not found", { status: 404 });
    }

    /* ---------------- Resolve Seller (Builder) ---------------- */
    let seller = {
      storeName: "BSCFASHION",
      address: "B.S Channabasappa & Sons, Davanagere — 577001",
      phone: "9770808020",
      email: "hello@bscfashion.com",
    };

    const firstItem = order.items[0];
    if (firstItem?.product?.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: firstItem.product.siteId },
      });

      if (site) {
        const settings = await prisma.settings.findFirst({
          where: { ownerId: site.ownerId },
        });

        if (settings) {
          seller = {
            storeName: settings.storeName || seller.storeName,
            address: settings.address || seller.address,
            phone: settings.phone || seller.phone,
            email: settings.email || seller.email,
          };
        }
      }
    }

    /* ---------------- Address Parsing ---------------- */
    let address: any = {};
    try {
      address =
        typeof order.address === "string"
          ? JSON.parse(order.address)
          : order.address || {};
    } catch {
      address = {};
    }

    const fullAddress = `
${address.doorNumber || ""} ${address.street || ""}
${address.landmark || ""}
${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}
`.trim();

    /* ---------------- Styling ---------------- */
    const gold = "#CBA135";
    const maroon = "#800000";
    const useBW = Boolean(bw);

    const accent = useBW ? "#000000" : gold;
    const title = useBW ? "#000000" : maroon;

    const regularPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf"
    );
    const boldPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Bold.ttf"
    );

    /* ---------------- Create PDF ---------------- */
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, left: 48, right: 48, bottom: 48 },
      font: regularPath,
    });

    if (fs.existsSync(regularPath)) doc.registerFont("r", regularPath);
    if (fs.existsSync(boldPath)) doc.registerFont("b", boldPath);

    const pdfPromise = pdfToBuffer(doc);

    /* ================= HEADER ================= */
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fillColor(title).fontSize(22).text(seller.storeName, { align: "center" });

    if (fs.existsSync(regularPath)) doc.font("r");
    doc.fillColor(accent)
      .fontSize(10)
      .text("Invoice", { align: "center" });

    doc.moveDown(1);

    /* ================= ORDER META ================= */
    doc.fillColor("black").fontSize(11);
    doc.text(`Order ID: ${order.id}`);
    doc.text(`Payment: ${order.paymentMode}`);
    doc.text(
      `Date: ${new Date(order.createdAt!).toLocaleDateString("en-IN")}`
    );

    doc.moveDown(0.6);

    /* ================= CUSTOMER ================= */
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fillColor(title).fontSize(12).text("Bill To");

    if (fs.existsSync(regularPath)) doc.font("r");
    doc.fillColor("black").fontSize(10);
    doc.text(address.name || order.user?.name || "Customer");
    doc.text(`Phone: ${address.phone || order.user?.phone || "-"}`);
    doc.text(`Email: ${address.email || order.user?.email || "-"}`);
    doc.moveDown(0.4);
    doc.text(fullAddress);

    /* ================= QR ================= */
    const qrData = await QRCode.toDataURL(
      JSON.stringify({
        orderId: order.id,
        customer: address.name || order.user?.name,
      })
    );
    const qr = Buffer.from(qrData.split(",")[1], "base64");
    doc.image(qr, doc.page.width - 160, 120, { width: 110 });

    doc.moveDown(1);

    /* ================= PRODUCTS ================= */
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fillColor(accent).fontSize(14).text("Products");
    doc.moveDown(0.5);

    if (fs.existsSync(regularPath)) doc.font("r");

    order.items.forEach((item, i) => {
      doc.fillColor("black").fontSize(11).text(
        `${i + 1}. ${item.product?.name || item.name}`
      );
      doc.text(
        `Qty: ${item.quantity} | Price: ₹${item.price}`,
        { indent: 12 }
      );
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    /* ================= TOTAL ================= */
    if (fs.existsSync(boldPath)) doc.font("b");
    doc.fillColor(title)
      .fontSize(16)
      .text(`Total Amount: ₹${order.totalAmount}`);

    doc.moveDown(1.5);

    /* ================= FOOTER ================= */
    if (fs.existsSync(regularPath)) doc.font("r");
    doc.fillColor("black")
      .fontSize(10)
      .text("Sold & Shipped By", { align: "center" });

    doc.text(seller.storeName, { align: "center" });
    doc.text(seller.address, { align: "center" });
    doc.text(`Phone: ${seller.phone}`, { align: "center" });
    doc.text(`Email: ${seller.email}`, { align: "center" });

    doc.moveDown(0.5);
    doc.fillColor(accent).text(
      "Powered by BSCFASHION • TBITS INDIA Davanagere",
      { align: "center" }
    );

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order.id}.pdf`,
      },
    });
  } catch (err) {
    console.error("INVOICE PDF ERROR:", err);
    return new Response("Invoice generation failed", { status: 500 });
  }
}
