import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { SiteSection } from "@/types/site";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ IMPORTANT
    const body = await req.json();
    const { name, tagline, color } = body;

    const site = await prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // ✅ SAFE CAST (NO MODIFICATION)
    const sections: SiteSection[] = Array.isArray(site.section)
      ? (site.section as SiteSection[])
      : [];

    // ✅ UPDATE BASIC INFO ONLY
    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name,
        tagline,
        color,
        section: sections, // untouched (infinite scroll safe)
      },
    });

    return NextResponse.json(updatedSite);
  } catch (error) {
    console.error("Update site error:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}
