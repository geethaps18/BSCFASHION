import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/utils/notify";

export async function updateOrderStatus(
  orderId: string,
  newStatus: "ordered" | "packed" | "shipped" | "delivered"
) {
  try {
    // Fetch order with user & items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new Error("Order not found");

    // Update status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { user: true, items: { include: { product: true } } },
    });

    // Map items for notifications
    const mappedItems = updatedOrder.items.map((item) => ({
      name: item.product?.name ?? "Unnamed Product",
      qty: item.quantity,
      price: item.price,
      size: item.size ?? undefined,
      image: Array.isArray(item.product?.images)
        ? item.product.images[0]
        : item.product?.images ?? undefined,
    }));

    // Format phone number for WhatsApp
    let phone = updatedOrder.user?.phone ?? "0000000000";
    if (!phone.startsWith("+")) phone = "+91" + phone.replace(/\D/g, "");

    // Send notifications
    await sendOrderNotification({
      email: updatedOrder.user?.email ?? "unknown@example.com",
      phone,
      customerName: updatedOrder.user?.name ?? "Customer",
      orderId: updatedOrder.id,
      items: mappedItems,
      total: updatedOrder.totalAmount,
      paymentMode: updatedOrder.paymentMode,
      status: newStatus,
    });

    return {
      success: true,
      message: "Order status updated and notifications sent!",
      order: updatedOrder,
    };
  } catch (err) {
    console.error("❌ Error updating order:", err);
    throw err;
  }
}
