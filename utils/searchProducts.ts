// utils/searchProducts.ts
import OpenAI from "openai";
import { Product } from "@/types/product";

// ⚠️ Server-side environment variable only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // 1️⃣ Fetch all products
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();
    const products: Product[] = data.products || [];

    if (!products.length) return [];

    const lowerQuery = query.toLowerCase();

    // 2️⃣ Basic fallback search (matches name or category)
    const basicMatch = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.category?.toLowerCase() || "").includes(lowerQuery)
    );

    if (basicMatch.length) return basicMatch;

    // 3️⃣ Prepare product strings for OpenAI
    const productStrings = products.map((p) => {
      const sizes = Array.isArray(p.sizes) ? p.sizes.join(", ") : "";
      
      return `${p.id}: ${p.name}, category: ${p.category || "N/A"}, sizes: ${sizes}, price: ${p.price}`;
    });

    // 4️⃣ Prompt OpenAI to rank products
    const prompt = `
You are a product search assistant. Given the user query: "${query}", 
rank the following products in order of relevance (most relevant first). 
Only return a comma-separated list of product IDs that are most relevant:

${productStrings.join("\n")}
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
      temperature: 0,
    });

    const outputText = response.output_text || "";
    const rankedIds = outputText
      .split(/,|\n/)
      .map((id) => id.trim())
      .filter((id) => id);

    // 5️⃣ Map ranked IDs back to products
    const rankedProducts = rankedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);

    // 6️⃣ Return OpenAI-ranked products or fallback
    return rankedProducts.length ? rankedProducts : basicMatch;
  } catch (err) {
    console.error("OpenAI search error:", err);
    return [];
  }
}
