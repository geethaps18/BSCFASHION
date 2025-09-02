import mongoose from "mongoose";

const BagSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.Bag || mongoose.model("Bag", BagSchema);
