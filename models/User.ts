import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ Define TypeScript interface for User
export interface IUser extends Document {
  name?: string;
  contact: string;
  role: "user" | "admin"; // Added role
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Define Mongoose schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },
    contact: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }, // Default role = user
  },
  { timestamps: true }
);

// 3️⃣ Export model (avoid overwriting existing models in dev)
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
