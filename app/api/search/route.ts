// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; 

type ProductMin = {
  id: string;
  name: string | null;
  price: number | null;
  images: string[] | null;
  category: string | null;
  subCategory: string | null;
  subSubCategory: string | null;
  description?: string | null;
  colorNames?: string[];
};

//-------------------------------
// PRICE EXTRACTION
//-------------------------------
function extractMaxPrice(q: string): number | null {
  const s = q.toLowerCase();
  const r1 = s.match(/under\s+(\d+)/);
  const r2 = s.match(/below\s+(\d+)/);
  const r3 = s.match(/less than\s+(\d+)/);

  if (r1) return Number(r1[1]);
  if (r2) return Number(r2[1]);
  if (r3) return Number(r3[1]);

  return null;
}

//-------------------------------
// GENDER DETECTION
//-------------------------------
function extractGender(q: string) {
  const s = q.toLowerCase();
  if (/\b(women|woman|ladies|girl|girls)\b/.test(s)) return "women";
  if (/\b(men|man|boys|boy)\b/.test(s)) return "men";
  if (/\b(kid|kids|children)\b/.test(s)) return "kids";
  return null;
}

//-------------------------------
// COLOR DETECTION
//-------------------------------
function extractColor(q: string) {
  const COLORS = [
    "white","black","red","blue","green","yellow","pink","orange","maroon",
    "purple","grey","gray","beige","brown","gold","silver","navy","cream","ivory"
  ];
  const tokens = q.toLowerCase().split(/\W+/);
  return COLORS.find((c) => tokens.includes(c)) || null;
}

//-------------------------------
// MAIN PRODUCT KEYWORDS
// Removes gender, color, price words
//-------------------------------
function cleanKeywords(q: string, removeList: (string | null)[]) {
  let s = q.toLowerCase();

  for (const r of removeList) {
    if (r) {
      s = s.replace(new RegExp(`\\b${r}\\b`, "gi"), " ");
    }
  }

  s = s.replace(/\b(under|below|less|than|for)\b/gi, " ");
  s = s.replace(/\d+/g, " "); // remove numbers (they trigger price)
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

//-------------------------------
// BUILD WHERE CLAUSE
//-------------------------------
function buildWhere({ keywords, gender, color, maxPrice }: any) {
  const AND: any[] = [];

  // price filter
  if (typeof maxPrice === "number") {
    AND.push({ price: { lte: maxPrice } });
  }

  // gender filter
  if (gender) {
    AND.push({
      OR: [
        { category: { contains: gender, mode: "insensitive" } },
        { subCategory: { contains: gender, mode: "insensitive" } },
        { subSubCategory: { contains: gender, mode: "insensitive" } },
        { description: { contains: gender, mode: "insensitive" } },
      ],
    });
  }

  // color filter
  if (color) {
    AND.push({
      OR: [
        { colorNames: { has: color } },
        { description: { contains: color, mode: "insensitive" } },
        { name: { contains: color, mode: "insensitive" } },
      ],
    });
  }

  // product keyword filter
  if (keywords) {
    const words = keywords.split(" ").filter(Boolean);
    const orList: any[] = [];

    for (const w of words) {
      orList.push(
        { name: { contains: w, mode: "insensitive" } },
        { description: { contains: w, mode: "insensitive" } },
        { category: { contains: w, mode: "insensitive" } },
        { subCategory: { contains: w, mode: "insensitive" } },
        { subSubCategory: { contains: w, mode: "insensitive" } }
      );
    }

    AND.push({ OR: orList });
  }

  return AND.length ? { AND } : {};
}

//-------------------------------
// SEARCH FUNCTION
//-------------------------------
async function searchProducts(query: string) {
  const q = query.toLowerCase().trim();

  const maxPrice = extractMaxPrice(q);
  const gender = extractGender(q);
  const color = extractColor(q);

  const keywords = cleanKeywords(q, [
    String(maxPrice || ""),
    gender,
    color,
  ]);

  const where = buildWhere({ keywords, gender, color, maxPrice });

  const items = await prisma.product.findMany({
    where,
    take: 100,
    orderBy: { purchases: "desc" },
  });

  return { suggestions: generateSuggestions(q, items), products: items };
}

//-------------------------------
// FLIPKART-LIKE SUGGESTIONS
//-------------------------------
function generateSuggestions(q: string, items: any[]) {
  const set = new Set<string>();
  set.add(q);

  items.slice(0, 10).forEach((p) => {
    if (p.name) set.add(p.name);
    if (p.category) set.add(p.category);
  });

  if (q.split(" ").length >= 2) {
    set.add(q.split(" ").slice(0, 2).join(" "));
  }

  return Array.from(set).slice(0, 8);
}

//-------------------------------
// API HANDLERS
//-------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = body.query || body.q || "";
    const result = await searchProducts(q);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ suggestions: [], products: [] });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const result = await searchProducts(q);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ suggestions: [], products: [] });
  }
}
