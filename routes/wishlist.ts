// routes/wishlist.ts
import express, { Request, Response } from "express";
import Wishlist from "../models/Wishlist";

const router = express.Router();

interface WishlistRequestBody {
  userId: string;
  productId: string;
}

/**
 * ✅ Add product to wishlist
 */
router.post("/add", async (req: Request<{}, {}, WishlistRequestBody>, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: "userId and productId are required",
      });
    }

    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
      return res.json({
        success: true,
        message: "Already in wishlist",
      });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    res.json({
      success: true,
      message: "Added to wishlist",
      data: wishlistItem,
    });
  } catch (err: any) {
    console.error("❌ Wishlist add error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ Remove product from wishlist
 */
router.post("/remove", async (req: Request<{}, {}, WishlistRequestBody>, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: "userId and productId are required",
      });
    }

    const deleted = await Wishlist.findOneAndDelete({ userId, productId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Item not found in wishlist",
      });
    }

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err: any) {
    console.error("❌ Wishlist remove error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ Get wishlist by userId
 */
router.get("/:userId", async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.find({ userId });

    res.json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (err: any) {
    console.error("❌ Wishlist fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
