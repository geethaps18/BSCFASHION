import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import stringSimilarity from "string-similarity";

// ------------------- Types -------------------
type ProductWithRelevance = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  subSubCategory: string | null;
  price: number;
  mrp: number | null;
  discount: number | null;
  images: string[];
  sizes: string[];
  colorNames: string[];
  relevance?: number;
};

// ------------------- OpenAI Client -------------------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ------------------- Safe JSON Parse -------------------
function safeJSONParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// ------------------- Parse natural language query -------------------
async function parseQuery(query: string) {
  if (!query) return {};
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "Parse user search input into JSON with optional fields: name, category, subCategory, subSubCategory, color, size, maxPrice. Only return valid JSON.",
        },
        { role: "user", content: query },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const text = res.choices?.[0]?.message?.content ?? "{}";
    return safeJSONParse(text);
  } catch (err) {
    console.error("parseQuery error:", err);
    return {};
  }
}

// ------------------- Build Prisma Filter -------------------
function buildPrismaFilter(filters: any, query: string) {
  const and: any[] = [];
  const words = query.split(/\s+/).filter(Boolean);

  for (const word of words) {
    and.push({
      OR: [
        { name: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
        { category: { contains: word, mode: "insensitive" } },
        { subCategory: { contains: word, mode: "insensitive" } },
        { subSubCategory: { contains: word, mode: "insensitive" } },
      ],
    });
  }

  // Filters from OpenAI
  if (filters.color) and.push({ colorNames: { has: filters.color.toLowerCase() } });
  if (filters.size) and.push({ sizes: { has: filters.size.toUpperCase() } });
  if (filters.maxPrice) {
    const price = Number(filters.maxPrice);
    if (!isNaN(price)) and.push({ price: { lte: price } });
  }

  return and.length > 0 ? { AND: and } : {};
}

// ------------------- Calculate relevance -------------------
function calculateRelevance(product: ProductWithRelevance, query: string, filters: any) {
  let score = 0;

  const fieldsText = [
    product.name,
    product.description,
    product.category,
    product.subCategory,
    product.subSubCategory,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const words = query.split(/\s+/).filter(Boolean);

  if (fieldsText.includes(query.toLowerCase())) score += 10;

  for (const word of words) {
    const lower = word.toLowerCase();
    if (fieldsText.includes(lower)) score += 1;

    const similarity = stringSimilarity.compareTwoStrings(fieldsText, lower);
    if (similarity > 0.7) score += similarity;
  }

  if (filters.color && product.colorNames?.map((c) => c.toLowerCase()).includes(filters.color.toLowerCase())) score += 3;
  if (filters.size && product.sizes?.map((s) => s.toUpperCase()).includes(filters.size.toUpperCase())) score += 2;

  if (
    filters.category &&
    [product.category, product.subCategory, product.subSubCategory]
      .filter(Boolean)
      .some((c) => c?.toLowerCase() === filters.category.toLowerCase())
  ) {
    score += 5;
  }

  return score;
}

// ------------------- Search Products -------------------
async function searchProducts(query: string) {
  const filters = await parseQuery(query);

  if (filters.color) filters.color = filters.color.toLowerCase();
  if (filters.size) filters.size = filters.size.toUpperCase();

  const where = buildPrismaFilter(filters, query);

  let products: ProductWithRelevance[] = await prisma.product.findMany({
    where,
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      subCategory: true,
      subSubCategory: true,
      price: true,
      mrp: true,
      discount: true,
      images: true,
      sizes: true,
      colorNames: true,
    },
  });

  products = products.map((p) => ({ ...p, relevance: calculateRelevance(p, query, filters) }));
  products = products.filter((p) => (p.relevance ?? 0) > 0).sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

  return products.slice(0, 50);
}

// ------------------- GET API -------------------
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();
    if (!query) return NextResponse.json({ products: [] });

    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (err) {
    console.error("GET /api/search error:", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

// ------------------- POST API -------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query?.trim();
    if (!query) return NextResponse.json({ products: [] });

    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (err) {
    console.error("POST /api/search error:", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
