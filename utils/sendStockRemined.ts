import nodemailer from "nodemailer";

export async function sendStockReminderEmail(
  email: string,
  productName: string,
  productId: string,
  image?: string
) {
  try {
    const html = `
<div style="font-family:Inter, sans-serif; max-width:600px; margin:auto; border:1px solid #f9e5a5; border-radius:12px;">
  <div style="background:#f9e5a5; padding:20px; text-align:center;">
    <h2 style="margin:0; color:#5a3e00;">BSCFASHION — Product Back in Stock ✨</h2>
  </div>

  <div style="padding:20px;">
    <p style="font-size:16px; color:#444;">
      Hi there! 💛<br/><br/>
      Great news — an item you wanted is <strong>back in stock</strong>!
    </p>

    ${
      image
        ? `<img src="${image}" style="width:100%; max-width:300px; border-radius:10px; margin:10px auto; display:block;" />`
        : ""
    }

    <p style="font-size:15px; margin-top:10px;">
      <strong>${productName}</strong> is now available again.  
    </p>

    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}"
       style="display:block; width:100%; text-align:center; background:#000; padding:12px; 
              border-radius:8px; color:#fff; text-decoration:none; margin-top:15px;">
      Shop Now →
    </a>
  </div>

  <div style="background:#f9e5a5; text-align:center; padding:10px; font-size:12px; color:#5a3e00;">
    Powered by TBITS INDIA Davanagere
  </div>
</div>
`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"BSCFASHION" <${process.env.EMAIL_USER!}>`,
      to: email,
      subject: `Back in Stock • ${productName}`,
      html,
    });

    console.log("📧 Stock reminder sent to", email);
  } catch (err) {
    console.error("❌ Stock Reminder Email Error:", err);
  }
}
