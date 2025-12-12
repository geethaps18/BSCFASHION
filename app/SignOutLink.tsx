// utils/notify.ts
import nodemailer from "nodemailer";

export type OrderItem = {
  name: string;
  quantity: number; // unified field name (was qty/quantity mismatch)
  price: number;
  size?: string;
  image?: string;
};

export type NotificationOptions = {
  email: string;
  phone: string;
  customerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMode: string;
  deliveryAddress?: string;
  // use DB statuses
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  deliveryOtp?: string | null;
};

const STATUS_MESSAGES: Record<
  NotificationOptions["status"],
  string
> = {
  PENDING: `Hi {{name}}! 👋 Your order has been placed successfully! ❤️`,
  CONFIRMED: `Great news! 🎉 Your order is confirmed and being prepared.`,
  SHIPPED: `Good news! 🚚 Your order has been shipped and is on the way.`,
  OUT_FOR_DELIVERY: `Your order is out for delivery — should reach you today! 📦`,
  DELIVERED: `Yay! 🥳 Your order has been delivered. Enjoy!`,
};

export async function sendOrderNotification(opts: NotificationOptions) {
  try {
    const { email, phone, customerName, orderId, items, total, paymentMode, status } = opts;

    const statusTextTemplate = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.PENDING;
    const statusText = statusTextTemplate.replace("{{name}}", customerName);

    // HTML rows
    const itemListHtml = items
      .map(
        (it) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center;">
          ${it.image ? `<img src="${it.image}" width="60" style="margin-right:10px; border-radius:6px"/>` : ""}
          <span>${it.name}${it.size ? " - " + it.size : ""}</span>
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">x${it.quantity}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">₹${(it.price * it.quantity).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: sans-serif; max-width:650px; margin:auto; border:1px solid #f7e4a0; border-radius:12px;">
        <div style="background-color:#f7e4a0; padding:25px; text-align:center;">
          <h2>Order Update ✨</h2>
        </div>
        <div style="padding:20px;">
          <p>${statusText}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            ${itemListHtml}
          </table>
          <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          <p><strong>Payment:</strong> ${paymentMode}</p>
        </div>
        <div style="background:#f7e4a0; text-align:center; padding:10px; font-size:12px;">Powered by TBITS INDIA</div>
      </div>
    `;

    // nodemailer transport (GMail)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS not set — skipping email send");
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Order Update #${orderId} (${status})`,
        html: emailHtml,
      });

      console.log("✅ Email sent to", email);
    }

    // optional WhatsApp via Meta Graph API — only attempted if tokens present
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const itemListText = items.map((it) => `- ${it.name}${it.size ? " - " + it.size : ""} x${it.quantity}`).join("\n");
      const whatsappMessage = `${statusText}

Order ID: ${orderId}
Items:
${itemListText}

Total: ₹${total.toFixed(2)}
Payment: ${paymentMode}
Powered by TBITS INDIA`;

      const res = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: whatsappMessage },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("❌ WhatsApp failed:", err);
      } else {
        console.log("✅ WhatsApp sent to", phone);
      }
    } else {
      console.log("WhatsApp tokens not configured — skipping WhatsApp.");
    }
  } catch (err) {
    console.error("❌ Notification error:", err);
  }
}
