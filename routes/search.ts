// app/api/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ------------------- Helper: Parse query with OpenAI -------------------
async function parseQuery(query: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "Parse user search input into JSON with optional fields: name, category, color, size, maxPrice. Only return JSON.",
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const text = response.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("OpenAI parseQuery error:", err);
    return {};
  }
}

// ------------------- Route -------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Parse natural language query using OpenAI
    const filters = await parseQuery(query);

    const where: any = {};

    // Filter by name or partial match
    if (filters.name) {
      where.name = { contains: filters.name, mode: "insensitive" };
    }

    // Filter by category
    if (filters.category) {
      where.category = { equals: filters.category, mode: "insensitive" };
    }

    // Filter by color (assuming product has colors array with hex or name)
    if (filters.color) {
      where.colors = {
        some: {
          name: { equals: filters.color, mode: "insensitive" },
        },
      };
    }

    // Filter by size (assuming product has sizes array)
    if (filters.size) {
      where.sizes = {
        has: filters.size,
      };
    }

    // Filter by maxPrice
    if (filters.maxPrice) {
      where.price = { lte: Number(filters.maxPrice) };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        mrp: true,
        discount: true,
        images: true,
        colors: true,
        sizes: true,
      },
      take: 50,
    });

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error("POST /api/search error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong" },
      { status: 500 }
    );
  }
}
