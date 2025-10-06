// server.ts
import express, { Request, Response, NextFunction } from "express";
import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ----------------------------
// Load environment variables
dotenv.config();

// ----------------------------
// Validate required environment variables
const requiredEnv = ["MONGODB_URI", "PORT", "JWT_SECRET"] as const;
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Environment variable ${envVar} is required`);
    process.exit(1);
  }
});

// ----------------------------
// Types
interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

// ----------------------------
// Initialize Express
const app = express();

// ----------------------------
// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Change in production
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ----------------------------
// JWT Auth Middleware
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

// ----------------------------
// MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "bscfashion",
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    } as ConnectOptions);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err: any) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
}

// ----------------------------
// Schemas & Models
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  images: [String],
  sizes: [String],
});
const Product = mongoose.model("Product", productSchema);

const wishlistSchema = new mongoose.Schema({
  userId: String,
  productId: String,
  createdAt: { type: Date, default: Date.now },
});
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

const bagSchema = new mongoose.Schema({
  userId: String,
  productId: String,
  sizes: [String],
  quantity: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});
const Bag = mongoose.model("Bag", bagSchema);

// ----------------------------
// Auth Routes
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!email && !phone) return res.status(400).json({ error: "Email or phone required" });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const user = new User({ name, email, phone, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true }).json({ success: true, token, user });
  } catch (err: any) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (password && user.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true }).json({ success: true, token, user });
  } catch (err: any) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// OTP Routes (mock)
app.post("/api/otp/send", (req: Request, res: Response) => {
  const { phone } = req.body;
  console.log(`Sending OTP to ${phone} (mock)`);
  res.json({ success: true, otp: "123456" });
});

app.post("/api/otp/verify", (req: Request, res: Response) => {
  const { otp } = req.body;
  if (otp === "123456") res.json({ success: true });
  else res.status(400).json({ success: false, error: "Invalid OTP" });
});

// ----------------------------
// Search Route
app.get("/api/search", async (req: Request, res: Response) => {
  const { q } = req.query;
  const products = await Product.find({ name: { $regex: q as string, $options: "i" } });
  res.json({ products });
});

// ----------------------------
// Wishlist Routes
const wishlistRouter = express.Router();
wishlistRouter.use(authenticateJWT);

wishlistRouter.get("/", async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any).userId;
  const wishlist = await Wishlist.find({ userId });
  res.json({ wishlist });
});

wishlistRouter.post("/", async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any).userId;
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: "ProductId required" });

  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ added: false });
  }

  const entry = new Wishlist({ userId, productId });
  await entry.save();
  res.json({ added: true });
});

app.use("/api/wishlist", wishlistRouter);

// ----------------------------
// Bag/Cart Routes
const bagRouter = express.Router();
bagRouter.use(authenticateJWT);

bagRouter.get("/", async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any).userId;
  const bag = await Bag.find({ userId });
  res.json({ bag });
});

bagRouter.post("/", async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any).userId;
  const { productId, size } = req.body;
  if (!productId || !size) return res.status(400).json({ error: "ProductId and size required" });

  const existing = await Bag.findOne({ userId, productId, sizes: size });
  if (existing) {
    existing.quantity += 1;
    await existing.save();
    return res.json({ success: true, item: existing });
  }

  const newItem = new Bag({ userId, productId, sizes: [size], quantity: 1 });
  await newItem.save();
  res.json({ success: true, item: newItem });
});

bagRouter.put("/", async (req: AuthRequest, res: Response) => {
  const { bagId, quantity, size } = req.body;
  const item = await Bag.findById(bagId);
  if (!item) return res.status(404).json({ error: "Bag item not found" });
  if (size) item.sizes = [size];
  if (quantity !== undefined) {
    if (quantity <= 0) await item.deleteOne();
    else item.quantity = quantity;
  }
  await item.save();
  res.json({ success: true, item });
});

bagRouter.delete("/", async (req: AuthRequest, res: Response) => {
  const { bagId } = req.body;
  const item = await Bag.findById(bagId);
  if (!item) return res.status(404).json({ error: "Bag item not found" });
  await item.deleteOne();
  res.json({ success: true, removed: true });
});

app.use("/api/bag", bagRouter);

// ----------------------------
// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ----------------------------
// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
