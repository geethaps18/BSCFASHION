import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const sort = searchParams.get("sort") || "newest";

    // Sorting logic
    let orderBy: any = { createdAt: "desc" }; // default newest

    if (sort === "orders") {
      orderBy = { orders: { _count: "desc" } };
    } else if (sort === "spent") {
      // We will sort manually after aggregation
      orderBy = undefined;
    }

    // Fetch users
    const users = await prisma.user.findMany({
      include: {
        orders: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format customer data
    let formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      totalOrders: u.orders.length,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount, 0),
      status: u.blocked ? "blocked" : "active",
    }));

    // If sorting = spent → sort manually after formatting
    if (sort === "spent") {
      formatted = formatted.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("CUSTOMER API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
