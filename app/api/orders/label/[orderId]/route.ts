// app/api/orders/label/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Generate PDF Label
    const doc = new PDFDocument({ size: "A6", margin: 20 });
    const stream = doc.pipe(Readable.from([]) as any);

    doc.fontSize(20).text("Shipping Label", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Customer: ${order.user?.name || "N/A"}`);
    doc.text(`Phone: ${order.user?.phone || "N/A"}`);
    doc.text(`Address: ${order.address || "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Items:");
    order.items.forEach((item) => {
      doc.fontSize(12).text(
        `${item.product.name} x ${item.quantity} — ₹${item.price}`
      );
    });

    doc.end();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=label-${orderId}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF Label Error:", err);
    return NextResponse.json(
      { error: "Failed to generate label" },
      { status: 500 }
    );
  }
}
