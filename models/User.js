// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  identifier: { type: String, required: true, unique: true }, // email or phone
  otp: String,
  otpExpiry: Date,
});

export default mongoose.models.User || mongoose.model("User", userSchema);
