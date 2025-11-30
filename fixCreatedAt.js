import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri);

async function fixCreatedAt() {
  try {
    await client.connect();
    console.log("Connected to MongoDB ✅");

    // List of collections to check
    const collections = [
      "Order",
      "OrderItem",
      "Bag",
      "Wishlist",
      "Product",
      "User",
      "Address",
      "OTP",
      "Category",
      "ProductVariant",
      "Account",
      "DeliveryBoy",
      "DeliveryOTP",
      "Rating",
      "Review",
    ];

    for (const colName of collections) {
      const col = client.db().collection(colName);

      const result = await col.updateMany(
        { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] },
        { $set: { createdAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `Fixed ${result.modifiedCount} document(s) in collection '${colName}'`
        );
      } else {
        console.log(`No issues found in collection '${colName}'`);
      }
    }

    console.log("✅ All done!");
  } catch (err) {
    console.error("Error fixing createdAt fields:", err);
  } finally {
    await client.close();
  }
}

fixCreatedAt();
