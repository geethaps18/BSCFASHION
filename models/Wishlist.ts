// models/Wishlist.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

// 1️⃣ Define TypeScript interface for Wishlist
export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  title: string;
  price: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Define Mongoose schema
const WishlistSchema: Schema<IWishlist> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

// 3️⃣ Export model (avoid overwriting existing models in dev)
const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
