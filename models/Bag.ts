// models/Bag.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ Define TypeScript interface for Bag
export interface IBag extends Document {
  userId: string;
  productId: string;
  sizes: string[];
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Define Mongoose schema
const BagSchema: Schema<IBag> = new Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// 3️⃣ Export model (avoid overwriting existing models in dev)
const Bag: Model<IBag> =
  mongoose.models.Bag || mongoose.model<IBag>("Bag", BagSchema);

export default Bag;
