import express from "express";
import mongoose from "mongoose";
import "../models/Otp"; // register schema
const Otp = mongoose.model("Otp"); // use registered model

import nodemailer from "nodemailer";

const router = express.Router();

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cooldown map to prevent spam
const otpCooldown: Record<string, number> = {};

// Send OTP
router.post("/send", async (req, res) => {
  try {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ error: "Contact required" });

    // Check cooldown
    const lastSent = otpCooldown[contact];
    if (lastSent && Date.now() - lastSent < 60 * 1000) {
      return res.status(429).json({ error: "Wait 1 minute before requesting OTP again" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.create({ contact, otp, expiresAt });
    otpCooldown[contact] = Date.now();

    if (contact.includes("@")) {
      // Email OTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // Gmail app password
        },
      });

      await transporter.sendMail({
        from: `"BSCFASHION" <${process.env.EMAIL_USER}>`,
        to: contact,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. Expires in 5 minutes.`,
      });

    } else {
      // Phone OTP (here you can log it or use a GSM modem)
      console.log(`Send SMS OTP ${otp} to ${contact}`);
    }

    res.json({ message: "OTP sent ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP ❌" });
  }
});

// Verify OTP
router.post("/verify", async (req, res) => {
  try {
    const { contact, otp } = req.body;
    if (!contact || !otp) return res.status(400).json({ error: "Contact and OTP required" });

    const record = await Otp.findOne({ contact, otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ error: "Invalid OTP ❌" });

    if (record.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired ❌" });

    await Otp.deleteOne({ _id: record._id });

    // Issue JWT token for login session
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ contact }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "OTP verified ✅", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP ❌" });
  }
});

export default router;
