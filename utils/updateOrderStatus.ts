import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/utils/notify";

// DB → Notification mapping
const DB_TO_NOTIFICATION = {
  PENDING: "ordered",
  CONFIRMED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
};

// DB → Timestamp field mapping
const TIMESTAMP_FIELDS: Record<string, string | null> = {
  PENDING: null,
  CONFIRMED: "confirmedAt",
  SHIPPED: "shippedAt",
  OUT_FOR_DELIVERY: "outForDeliveryAt",
  DELIVERED: "deliveredAt",
};

export async function updateOrderStatus(orderId: string, newDbStatus: string) {
  try {
    // Fetch old order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) throw new Error("Order not found");

    // Decide which timestamp field to update
    const timestampField = TIMESTAMP_FIELDS[newDbStatus];

    // Build data payload
    const dataToUpdate: any = {
      status: newDbStatus,
      updatedAt: new Date(),
    };

    // ⭐ Save timeline timestamp only when status changes
    if (timestampField) {
      dataToUpdate[timestampField] = new Date();
    }

    // Update DB
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
      include: { user: true, items: true },
    });

    // Prepare items for email/SMS
    const mappedItems = updatedOrder.items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      price: item.price,
      size: item.size ?? undefined,
      image: item.image ?? undefined,
    }));

    // Fix phone formatting
    let phone = updatedOrder.user?.phone ?? "0000000000";
    phone = phone.replace(/\D/g, "");
    if (!phone.startsWith("+")) phone = "+91" + phone;

    // Send notification
    await sendOrderNotification({
      email: updatedOrder.user?.email ?? "noemail@bscfashion.com",
      phone,
      customerName: updatedOrder.user?.name ?? "Customer",
      orderId: updatedOrder.id,
      items: mappedItems,
      total: updatedOrder.totalAmount,
      paymentMode: updatedOrder.paymentMode,
      status: DB_TO_NOTIFICATION[newDbStatus],
    });

    return {
      success: true,
      order: updatedOrder,
    };

  } catch (err) {
    console.error("❌ Order Update Error:", err);
    throw err;
  }
}
