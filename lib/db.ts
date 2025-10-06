// lib/db.ts
import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";

// ---------------- MONGOOSE SETUP ----------------
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI environment variable in .env");
}

// Cache global mongoose connection across hot reloads in dev
let mongooseCached = globalThis as typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise?: Promise<typeof mongoose> };
};

if (!mongooseCached.mongoose) {
  mongooseCached.mongoose = { conn: null, promise: undefined };
}

export async function mongooseConnect(): Promise<typeof mongoose> {
  if (mongooseCached.mongoose!.conn) return mongooseCached.mongoose!.conn;

  if (!mongooseCached.mongoose!.promise) {
    mongooseCached.mongoose!.promise = mongoose
      .connect(MONGODB_URI!, { // <-- Non-null assertion here
        dbName: "bscfashion",
        bufferCommands: false,
      })
      .then((m) => {
        console.log("✅ MongoDB Connected");
        return m;
      });
  }

  mongooseCached.mongoose!.conn = await mongooseCached.mongoose!.promise;
  return mongooseCached.mongoose!.conn;
}

// ---------------- PRISMA SETUP ----------------
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
