import nodemailer from "nodemailer";

export async function sendEmailOtp(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  // Public URL of your logo (replace with your actual hosted logo URL)
  const logoUrl = "https://yourwebsite.com/logo.jpeg";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">

      <!-- Secure OTP Banner -->
      <div style="background-color: #2a9d8f; color: white; text-align: center; padding: 10px; font-weight: bold;">
        🔒 BSCFASHION Secure OTP
      </div>

      <!-- Logo -->
      <div style="background-color: #ffffff; padding: 20px; text-align: center;">
        <img src="${logoUrl}" alt="BSCFASHION" width="180" style="display:block; margin:auto;" />
      </div>

      <!-- Body -->
      <div style="padding: 30px; text-align: center;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p style="color: #555; font-size: 16px;">
          Use the following OTP to complete your login or signup.
        </p>
        <div style="margin: 20px 0;">
          <span style="
            display: inline-block;
            background-color: #2a9d8f;
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            padding: 15px 25px;
            border-radius: 5px;
            letter-spacing: 3px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            ${otp}
          </span>
        </div>
        <p style="color: #999; font-size: 14px;">This OTP will expire in 5 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        BSCFASHION &copy; ${new Date().getFullYear()}. All rights reserved.<br/>
        Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2a9d8f;">${process.env.EMAIL_USER}</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your BSCFASHION OTP Code",
    html,
  });
}
