import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import wishlistRoutes from "./routes/wishlist.js";
app.use("/api/wishlist", wishlistRoutes);

dotenv.config();

const app = express();
app.use(express.json()); // Middleware for JSON

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Schema + Model
const ItemSchema = new mongoose.Schema({ name: String });
const Item = mongoose.model("Item", ItemSchema);

// --------- ROUTES ----------

// 1. Test Route
app.get("/", (req, res) => {
  res.send("API is running on port 5000 🚀");
});

// 2. Get all items
app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

// 3. Add new item
app.post("/items", async (req, res) => {
  try {
    const newItem = new Item({ name: req.body.name });
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Update item
app.put("/items/:id", async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true } // returns updated doc
    );
    if (!updatedItem) return res.status(404).send("Item not found ❌");
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Delete item
app.delete("/items/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).send("Item not found ❌");
    res.send("Item deleted ✅");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
