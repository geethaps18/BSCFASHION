// routes/productRoutes.ts
import express, { Request, Response } from "express";
import Product from "../models/Product";

const router = express.Router();

interface ProductBody {
  name: string;
  price: number;
  category?: string;
}

// ✅ Fetch all products
router.get("/", async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Add new product
router.post("/", async (req: Request<{}, {}, ProductBody>, res: Response) => {
  try {
    const { name, price, category } = req.body;
    const newProduct = new Product({ name, price, category });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
