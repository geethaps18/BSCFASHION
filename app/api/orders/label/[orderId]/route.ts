import { NextResponse } from "next/server";
import {prisma} from "@/lib/db"; // ✅ FIXED import
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export async function GET(req: Request, { params }: any) {
  try {
    const orderId = params.orderId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const doc = new PDFDocument();
    const stream = doc as unknown as Readable;

    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    const pdfBuffer = new Promise<Buffer>((resolve) => {
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // ---------------- PDF CONTENT ----------------

    // Title
    doc.font("Helvetica-Bold").fontSize(20).text("BSCFASHION Order Label");
    doc.moveDown();

    // Customer details
    doc.font("Helvetica").fontSize(12);
    doc.text(`Order ID: ${order.id}`);
    doc.text(`Customer: ${order.user?.name}`);
    doc.text(`Phone: ${order.user?.phone}`);
    doc.text(`Address: ${order.address}`);
    doc.moveDown();

    // Items list
    doc.font("Helvetica-Bold").text("Items:");
    doc.font("Helvetica");

    order.items.forEach((item) => {
      doc.text(
        `${item.product.name} — Qty: ${item.quantity} — Size: ${item.size || "N/A"}`
      );
    });

    doc.end();

    const buffer = await pdfBuffer;

   const uint8 = new Uint8Array(buffer);

return new NextResponse(uint8, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="label-${orderId}.pdf"`,
  },
});

  } catch (error) {
    console.error("LABEL ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
