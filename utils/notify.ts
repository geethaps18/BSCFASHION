import nodemailer from "nodemailer";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  size?: string;
  image?: string;
};

export type NotificationOptions = {
  email?: string; // user email
  phone: string;
  customerName?: string; // fallback (from user)
  addressName?: string; // NEW — name from address
  addressEmail?: string; // NEW — email from address
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMode: string;
  status: "ordered" | "packed" | "shipped" | "out_for_delivery" | "delivered";
};

// ✨ Premium BSCFASHION cute + professional messages
const STATUS_TEXTS: Record<
  NotificationOptions["status"],
  (name: string) => string
> = {
  ordered: (name) =>
    `Hi ${name}! 👋  
Thank you for shopping with BSCFASHION 💛  
Your order has been placed successfully. Our team has already started preparing it with care ✨`,

  packed: (name) =>
    `Good news ${name}! 🎀  
Your order is now packed beautifully and ready to ship.  
Everything is double-checked with love 💛`,

  shipped: (name) =>
    `Hello ${name}! 🚚✨  
Your BSCFASHION order has been shipped and is on its way to you!  
Get ready — your moment is coming soon 💛`,

  out_for_delivery: (name) =>
    `Hi ${name}! 🛵💨  
Your order is *out for delivery* and will reach you shortly.  
Please keep your phone nearby to assist our delivery partner 💛`,

  delivered: (name) =>
    `Hi ${name}! 🥰💛  
Your BSCFASHION order has been successfully delivered!  
We hope you love it as much as we enjoyed packing it for you.  
Thank you for supporting our 85+ years of tradition ❤️`,
};

export async function sendOrderNotification(options: NotificationOptions) {
  try {
    let {
      email,
      addressEmail,
      customerName,
      addressName,
      phone,
      orderId,
      items,
      total,
      paymentMode,
      status,
    } = options;

    // --------------------------
    // 1️⃣ FINAL CUSTOMER NAME LOGIC
    // --------------------------
    let finalName =
      addressName ||
      customerName ||
      (email ? email.split("@")[0] : "") ||
      "Customer";

    finalName =
      finalName.charAt(0).toUpperCase() + finalName.slice(1).toLowerCase();

    // --------------------------
    // 2️⃣ FINAL EMAIL LOGIC
    // --------------------------
    let finalEmail =
      addressEmail && addressEmail.includes("@")
        ? addressEmail
        : email && email.includes("@")
        ? email
        : process.env.EMAIL_USER!; // fallback to store email

    // --------------------------
    // 3️⃣ MESSAGE
    // --------------------------
    const message = STATUS_TEXTS[status](finalName);

    // --------------------------
    // 4️⃣ EMAIL TEMPLATE
    // --------------------------
    const itemListHtml = items
      .map(
        (item) => `
<tr>
  <td style="padding:10px; border-bottom:1px solid #eee; display:flex; align-items:center;">
    ${
      item.image
        ? `<img src="${item.image}" width="60" style="margin-right:10px; border-radius:6px;" />`
        : ""
    }
    ${item.name}${item.size ? " - " + item.size : ""}
  </td>
  <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">x${
    item.qty
  }</td>
  <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">₹${(
    item.price * item.qty
  ).toFixed(2)}</td>
</tr>`
      )
      .join("");

    const emailHtml = `
<div style="font-family: Inter, sans-serif; max-width:650px; margin:auto; border:1px solid #f9e5a5; border-radius:12px;">
  <div style="background:#f9e5a5; padding:25px; text-align:center;">
    <h2 style="margin:0; color:#5a3e00;">BSCFASHION — Order Update ✨</h2>
  </div>

  <div style="padding:20px;">
    <p style="font-size:15px; color:#444;">${message.replace(
      /\n/g,
      "<br/>"
    )}</p>

    <p><strong>Order ID:</strong> ${orderId}</p>

    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
      ${itemListHtml}
    </table>

    <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
    <p><strong>Payment Mode:</strong> ${paymentMode}</p>
  </div>

  <div style="background:#f9e5a5; text-align:center; padding:10px; font-size:12px; color:#5a3e00;">
    Powered by TBITS INDIA Davanagere
  </div>
</div>
`;

    // --------------------------
    // 5️⃣ SEND EMAIL
    // --------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"BSCFASHION" <${process.env.EMAIL_USER!}>`,
      to: finalEmail,
      subject: `Order Update • #${orderId} • ${status
        .replace(/_/g, " ")
        .toUpperCase()}`,
      html: emailHtml,
    });

    console.log("📧 Email sent to:", finalEmail);

    // --------------------------
    // 6️⃣ WHATSAPP MESSAGE
    // --------------------------
    const itemListText = items
      .map(
        (item) =>
          `• ${item.name}${item.size ? " - " + item.size : ""} × ${item.qty}`
      )
      .join("\n");

    const whatsappBody = `${message}

Order ID: ${orderId}
--------------------
Items:
${itemListText}

Total: ₹${total}
Payment Mode: ${paymentMode}

Thank you for choosing BSCFASHION 💛`;

    await fetch(
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
          text: { body: whatsappBody },
        }),
      }
    );

    console.log("📲 WhatsApp sent to:", phone);
  } catch (err) {
    console.error("❌ Notification Error:", err);
  }
}
