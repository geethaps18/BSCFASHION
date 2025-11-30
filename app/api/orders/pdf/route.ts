import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map payment modes
    const paymentModeMap: Record<string, string> = {
      PhonePe: "Prepaid",
      GPay: "Prepaid",
      "Google Pay": "Prepaid",
      Paytm: "Prepaid",
      Card: "Prepaid",
      COD: "Cash on Delivery",
    };
    const displayPaymentMode = paymentModeMap[body.paymentMode] || body.paymentMode;

    // OTP should be generated server-side and stored in DB for this order
    const otp = body.otp || Math.floor(1000 + Math.random() * 9000); // 4-digit fallback

    const pdfBuffer: Buffer = await new Promise(async (resolve, reject) => {
     const doc = new PDFDocument({
  margin: 50,
  font: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf")
});


      // ---------- REGISTER FONTS ----------
      const regularFont = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
      const boldFont = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
      if (fs.existsSync(regularFont)) doc.registerFont("regular", regularFont);
      if (fs.existsSync(boldFont)) doc.registerFont("bold", boldFont);
      doc.font("regular");

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ---------- LOGO ----------
      const logoPath = path.join(process.cwd(), "public/images/logo1.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 50, 20, { width: 100 });
      }
      doc.moveDown(3);

      // ---------- BRAND ----------
      doc.font("bold").fontSize(20).text("BSCFASHION — Since 1938", { align: "center" });
      doc.font("regular").fontSize(12).text(
        "B.S. Channabasappa & Sons — Karnataka’s Trusted Clothing Brand",
        { align: "center" }
      );
      doc.moveDown(2);

      // ---------- QR CODE FOR OTP ----------
      const qrData = JSON.stringify({
        orderId: body.orderId,
        otp,
        customer: body.userName,
        phone: body.phone,
        total: body.total
      });
      const qrImage = await QRCode.toDataURL(qrData);
      const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
      const qrBuffer = Buffer.from(qrBase64, "base64");
      const qrSize = 100;

      const startY = doc.y;
      const leftX = doc.x;
      const rightX = doc.page.width - doc.page.margins.right - qrSize;

      // ---------- ORDER INFO & ADDRESS (Left) ----------
      doc.font("regular").fontSize(12);
      doc.text(`Order ID: ${body.orderId}`, leftX, startY);
      doc.text(`Payment Mode: ${displayPaymentMode}`);
      doc.text(`Customer: ${body.userName}`);
      doc.text(`Phone: ${body.phone}`);
      doc.text(`Email: ${body.email}`);
      doc.moveDown();

      doc.font("bold").text("Delivery Address:");
      doc.font("regular").text(body.address);

      // ---------- QR CODE (Right, side by side) ----------
      doc.image(qrBuffer, rightX, startY, { width: qrSize, height: qrSize });

      doc.moveDown(6);

      // ---------- PRODUCTS ----------
      doc.font("bold").text("Products:");
      doc.moveDown(0.5);
      body.products.forEach((p: any, i: number) => {
        doc.font("regular").text(`${i + 1}. ${p.name} (Qty: ${p.qty}) - ₹${p.price}`);
      });

      doc.moveDown(1);
      doc.font("bold").fontSize(14).text(`Total Amount: ₹${body.total}`);

      // ---------- THANK YOU NOTE ----------
      doc.moveDown(2);
      doc.font("regular").fontSize(12).fillColor("black").text(
        "Thank you for shopping with BSCFASHION 💚\nWe truly appreciate your trust in our heritage brand.",
        { align: "center" }
      );

      // ---------- FOOTER ----------
      doc.moveDown(2);
      doc.font("regular").fontSize(10).text(
        "Address: B.S Channabasappa & Sons, Textile Super Market, Kalikadevi Road, Davangere, Karnataka – 577001",
        { align: "center" }
      );
      doc.text("Phone Number : 9770808020", { align: "center" });
      doc.text("Email : hello@bscfashion.com", { align: "center" });
      doc.text(
        "Follow us on Instagram: @bschannabasappaandsons",
        { align: "center", link: "https://instagram.com/bschannabasappaandsons", underline: true }
      );
      doc.text("Powered by TBITS INDIA Davanagere", { align: "center" });

      doc.end();
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=order-${body.orderId}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response("Error generating PDF", { status: 500 });
  }
}
