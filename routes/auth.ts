import express from "express";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp"; // MongoDB OTP model
import nodemailer from "nodemailer";

const router = express.Router();

// Generate JWT
function generateToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// Generate OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// --------------------
// Send OTP (email)
router.post("/otp/send", async (req, res) => {
  try {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ error: "Contact required" });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.create({ contact, otp, expiresAt });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
      to: contact,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP ❌" });
  }
});

// --------------------
// Verify OTP
router.post("/otp/verify", async (req, res) => {
  try {
    const { contact, otp } = req.body;
    if (!contact || !otp) return res.status(400).json({ error: "Contact and OTP required" });

    const record = await Otp.findOne({ contact, otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ error: "Invalid OTP ❌" });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired ❌" });

    await Otp.deleteOne({ _id: record._id });

    // Create JWT for user
    const token = generateToken({ contact });

    res.json({ message: "OTP verified ✅", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP ❌" });
  }
});

export default router;
