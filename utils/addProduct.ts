import Product from "../models/Product";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function addProduct(
  name: string,
  description: string,
  price: number,
  imageUrl: string
) {
  // Generate embeddings from text (name + description)
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: `${name} ${description}`, // text input only
  });

  // Save product to MongoDB
  const product = new Product({
    name,
    description,
    price,
    images: [imageUrl], // store your image URL here
    embeddings: embeddingRes.data[0].embedding, // number[]
  });

  await product.save();
  console.log("✅ Product saved:", product.name);
  return product;
}
