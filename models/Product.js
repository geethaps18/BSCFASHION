import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    images: { type: [String], default: [] }, // <-- array of image URLs
    category: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);
