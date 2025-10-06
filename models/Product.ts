// models/Product.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ Define TypeScript interface for Product
export interface IProduct extends Document {
  name: string;
  description?: string;
  price?: number;
  images: string[];
  category?: string;
  createdAt: Date;
}

// 2️⃣ Define Mongoose schema
const productSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    images: { type: [String], default: [] },
    category: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// 3️⃣ Export model (avoid overwriting existing models in dev)
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
