// ----------------------------
// Bag/Cart Routes
import { Router, Response } from "express";
import { authenticateJWT } from "../middlewares/auth"; // adjust path
import Bag, { IBag } from "../models/Bag"; // Mongoose model
import { AuthRequest } from "@/types/auth"; // custom type

const bagRouter = Router();

/**
 * GET /api/bag
 * Get all bag items for the authenticated user
 */
bagRouter.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const bag = await Bag.find({ userId });
    res.json({ bag });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
});

/**
 * POST /api/bag
 * Add an item to the bag
 */
bagRouter.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { productId, size } = req.body;
    if (!productId || !size)
      return res.status(400).json({ error: "ProductId and size required" });

    const existing = await Bag.findOne({ userId, productId, sizes: size }) as IBag;
    if (existing) {
      existing.quantity += 1;
      await existing.save();
      return res.json({ success: true, item: existing });
    }

    const newItem = new Bag({ userId, productId, sizes: [size], quantity: 1 }) as IBag;
    await newItem.save();
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
});

/**
 * PUT /api/bag
 * Update quantity or size of a bag item
 */
bagRouter.put("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { bagId, quantity, size } = req.body;
    const item = await Bag.findById(bagId) as IBag;
    if (!item) return res.status(404).json({ error: "Bag item not found" });

    if (size) item.sizes = [size];
    if (quantity !== undefined) {
      if (quantity <= 0) await item.deleteOne();
      else item.quantity = quantity;
    }
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
});

/**
 * DELETE /api/bag
 * Remove an item from the bag
 */
bagRouter.delete("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { bagId } = req.body;
    const item = await Bag.findById(bagId) as IBag;
    if (!item) return res.status(404).json({ error: "Bag item not found" });

    await item.deleteOne();
    res.json({ success: true, removed: true });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err });
  }
});

export default bagRouter;
