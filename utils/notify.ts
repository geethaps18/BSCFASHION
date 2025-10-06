import nodemailer from "nodemailer";

export type OrderItem = {
  name: string;
  qty: number;
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
  status: "ordered" | "packed" | "shipped" | "delivered";
};

export async function sendOrderNotification({
  email,
  phone,
  customerName,
  orderId,
  items,
  total,
  paymentMode,
  status,
}: NotificationOptions) {
  try {
    const statusMessages: Record<NotificationOptions["status"], string> = {
      ordered: `Hi ${customerName}! 👋 Your order has been placed successfully! ❤️`,
      packed: `Yay ${customerName}! 🎀 Your order is packed and ready to ship! 💛`,
      shipped: `Hello ${customerName}! 🚚 Your order is shipped and on its way! 💖`,
      delivered: `Hi ${customerName}! 🥰 Your order has been delivered. Enjoy your purchase! 💛`,
    };

    // Build HTML for email
    const itemListHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center;">
          ${item.image ? `<img src="${item.image}" width="60" style="margin-right:10px; border-radius:6px"/>` : ""}
          <span>${item.name}${item.size ? " - " + item.size : ""}</span>
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">x${item.qty}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: sans-serif; max-width:650px; margin:auto; border:1px solid #f7e4a0; border-radius:12px;">
        <div style="background-color:#f7e4a0; padding:25px; text-align:center;">
          <h2>Order Update ✨</h2>
        </div>
        <div style="padding:20px;">
          <p>${statusMessages[status]}</p>
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

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },
    });

    await transporter.sendMail({
      from: `"BSCFASHION" <${process.env.EMAIL_USER!}>`,
      to: email,
      subject: `Order Update #${orderId} (${status.toUpperCase()})`,
      html: emailHtml,
    });
    console.log("✅ Email sent to", email);

    // WhatsApp message
    const itemListText = items
      .map((item) => `- ${item.name}${item.size ? " - " + item.size : ""} x${item.qty}`)
      .join("\n");

    const whatsappMessage = `${statusMessages[status]}

Order ID: ${orderId}
Items:
${itemListText}

Total: ₹${total.toFixed(2)}
Payment: ${paymentMode}
Powered by TBITS INDIA`;

    // Send WhatsApp via Graph API
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
      const err = await res.json();
      console.error("❌ WhatsApp failed:", err);
    } else {
      console.log("✅ WhatsApp sent to", phone);
    }
  } catch (error) {
    console.error("❌ Notification error:", error);
  }
}
