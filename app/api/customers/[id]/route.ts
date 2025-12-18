import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: true,
        account: true, // ✅ FIXED
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const account = user.account ?? null;
    const address = user.addresses?.[0] ?? null;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,

      status: user.blocked ? "blocked" : "active",

      orders: user.orders,
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce(
        (sum, o) => sum + o.totalAmount,
        0
      ),

      bankName: account?.bankName || null,
      accountNumber: account?.accountNumber
        ? "XXXX" + account.accountNumber.slice(-4)
        : null,
      ifsc: account?.ifsc || null,

      defaultAddress: address
        ? `${address.doorNumber ?? ""}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`
        : null,
    });
  } catch (error) {
    console.error("Customer details error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
