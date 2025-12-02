import mongoose from "mongoose";

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) {
    return; // Already connected
  }

  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: "bscfashion",
  });

  console.log("MongoDB connected ✔ (Mongoose)");
}
