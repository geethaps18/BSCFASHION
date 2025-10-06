import mongoose, { Document, Model } from "mongoose";

export interface IProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  products: IProduct[];
  status: "Pending" | "Confirmed" | "Shipped" | "Out for Delivery" | "Delivered";
  createdAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  status: { type: String, enum: ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
