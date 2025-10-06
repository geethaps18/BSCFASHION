import express, { Request, Response } from "express";
import Order, { IOrder } from "../models/Order";
import { isAdmin } from "../middlewares/admin";

const router = express.Router();

// GET all orders (admin only)
router.get("/", isAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate("userId", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE order status (admin only)
router.put("/update-status/:orderId", isAdmin, async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body as { status: IOrder["status"] };

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
