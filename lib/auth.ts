import jwt from "jsonwebtoken";

// Use your existing JWT_SECRET from .env
const SECRET = process.env.JWT_SECRET || "default_secret_key";

export function signToken(payload: any) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (err) {
    return null;
  }
}
