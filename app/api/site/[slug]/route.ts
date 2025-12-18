import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * GET /api/.../[slug]
 */
export async function GET(_req: Request, context: Context) {
  try {
    const { slug } = await context.params;

    const site = await prisma.site.findUnique({
      where: { slug },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("GET site error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/.../[slug]
 */
export async function PUT(req: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const body = await req.json();

    const updated = await prisma.site.update({
      where: { slug },
      data: {
        name: body.name,
        tagline: body.tagline,
        color: body.color,
        section: body.section, // 👈 builder power stays
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update site error:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}
