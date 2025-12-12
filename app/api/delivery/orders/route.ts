import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((o) => ({
      ...o,

      // SAFE JSON PARSE — no TypeScript error
      address:
        typeof o.address === "string"
          ? JSON.parse(o.address)
          : o.address ?? {},
    }));
    
    return NextResponse.json(formatted);
  } catch (err) {
    console.error("DELIVERY ORDERS ERROR:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
