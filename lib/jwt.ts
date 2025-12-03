import jwt from "jsonwebtoken";

export function signJwt(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "365d" });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET || "secret");
}
