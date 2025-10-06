import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  contact: string;      // email or phone
  otp: string;          // 6-digit code
  expiresAt: Date;      // OTP expiry
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    contact: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: automatically delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
