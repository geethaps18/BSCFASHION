// routes/wishlist.js
import express from "express";
import Wishlist from "../models/Wishlist.js"; // ✅ now default export

const router = express.Router();

// Add to wishlist
router.post("/add", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, error: "userId and productId required" });
    }

    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
      return res.json({ success: true, message: "Already in wishlist" });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();
    res.json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    console.error("Wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove from wishlist
router.post("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    await Wishlist.findOneAndDelete({ userId, productId });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    console.error("Wishlist remove error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get wishlist by user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.find({ userId });
    res.json({ success: true, wishlist });
  } catch (err) {
    console.error("Wishlist get error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
