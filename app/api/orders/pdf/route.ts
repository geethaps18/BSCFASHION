import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

export const runtime = "nodejs";

(PDFDocument as any).defaultFont = undefined;
(PDFDocument.prototype as any).defaultFont = undefined;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const gold = "#CBA135";
    const maroon = "#800000";
    const useBW = Boolean(body.bw);

    const accent = useBW ? "#000000" : gold;
    const title = useBW ? "#000000" : maroon;

    const otp = body.otp ?? Math.floor(1000 + Math.random() * 9000);

    const regularPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const boldPath = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");

    const pdfBuffer: Buffer = await new Promise(async (resolve, reject) => {
      // FIX: Force default font on creation
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 48, left: 48, right: 48, bottom: 48 },
        font: regularPath,
      });

      if (fs.existsSync(regularPath)) doc.registerFont("regular", regularPath);
      if (fs.existsSync(boldPath)) doc.registerFont("bold", boldPath);

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      if (fs.existsSync(boldPath)) doc.font("bold");
      doc.fillColor(title).fontSize(20).text("BSCFASHION", { align: "center" });

      if (fs.existsSync(regularPath)) doc.font("regular");
      doc.fillColor(accent).fontSize(10).text("Since 1938 — B.S. Channabasappa & Sons", {
        align: "center",
      });

      doc.moveDown(1);

      // QR
      const qrData = await QRCode.toDataURL(
        JSON.stringify({
          orderId: body.orderId,
          otp,
          customer: body.userName,
        })
      );
      const qr = Buffer.from(qrData.split(",")[1], "base64");

      const y = doc.y;

      doc.fontSize(11).fillColor("black");
      doc.text(`Order ID: ${body.orderId}`);
      doc.text(`Payment: ${body.paymentMode}`);
      doc.moveDown(0.5);

      if (fs.existsSync(boldPath)) doc.font("bold");
      doc.fillColor(title).fontSize(12).text(body.userName || "Customer");

      if (fs.existsSync(regularPath)) doc.font("regular");
      doc.fillColor("black").fontSize(10);
      doc.text(`Phone: ${body.phone || "-"}`);
      doc.text(`Email: ${body.email || "-"}`);
      doc.moveDown(0.4);

      doc.fillColor(accent).text("Delivery Address:");
      doc.fillColor("black").text(body.address);

      doc.image(qr, doc.page.width - 150, y, {
        width: 110,
        height: 110,
      });

      doc.moveDown(1);

      // Products
      if (fs.existsSync(boldPath)) doc.font("bold");
      doc.fillColor(accent).fontSize(13).text("Products");
      doc.moveDown(0.5);

      if (fs.existsSync(regularPath)) doc.font("regular");

      (body.products || []).forEach((p: any, i: number) => {
        doc.fontSize(11).fillColor("black").text(`${i + 1}. ${p.name}`);
        doc.text(`Qty: ${p.qty} | Price: ₹${p.price}`, { indent: 10 });
        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // Total
      if (fs.existsSync(boldPath)) doc.font("bold");
      doc.fillColor(title).fontSize(16).text(`Total: ₹${body.total}`);

      doc.moveDown(1.5);

      // Footer
      if (fs.existsSync(regularPath)) doc.font("regular");
      doc.fillColor("black")
        .fontSize(10)
        .text("Thank you for shopping with BSCFASHION 💛", { align: "center" });

      doc.text("B.S Channabasappa & Sons, Textile Super Market, Davangere — 577001", {
        align: "center",
      });

      doc.text("Phone: 9770808020 | Email: hello@bscfashion.com", {
        align: "center",
      });
      doc.fillColor(accent).text("Powered by TBITS INDIA Davanagere", {
        align: "center",
      });

      doc.end();
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${body.orderId}.pdf`,
      },
    });
  } catch (err) {
    console.error("Invoice PDF Error:", err);
    return new Response("Error generating invoice", { status: 500 });
  }
}
