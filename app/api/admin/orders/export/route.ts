import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Parser } from "json2csv";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "CONFIRMED", // ✅ IMPORTANT
      },
      orderBy: {
        confirmedAt: "desc",
      },
    });

    const rows = orders.map((order) => {
     let address: any = {};

if (order.address) {
  if (typeof order.address === "string") {
    try {
      address = JSON.parse(order.address);
    } catch {
      address = {};
    }
  } else {
    address = order.address;
  }
}


      return {
        OrderID: order.id,
        CustomerName: address.name || "",
        Phone: address.phone || "",
        Email: address.email || "",
        Address: `${address.doorNumber || ""} ${address.street || ""}`.trim(),
        City: address.city || "",
        State: address.state || "",
        Pincode: address.pincode || "",
        PaymentMode: order.paymentMode,
        CODAmount: order.paymentMode === "COD" ? order.totalAmount : 0,
        TotalAmount: order.totalAmount,
      };
    });

    const parser = new Parser();
    const csv = parser.parse(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=confirmed-orders.csv",
      },
    });
  } catch (err) {
    console.error("CSV EXPORT ERROR:", err);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
