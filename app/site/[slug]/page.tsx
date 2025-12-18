import HeroSection from "@/components/site/HeroSection";
import ProductsSection from "@/components/site/ProductsSection";
import { FooterSection } from "@/components/site/FooterSection";
import { prisma } from "@/lib/db";

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const site = await prisma.site.findUnique({
    where: { slug },
  });

  if (!site) {
    return <div>Website not found</div>;
  }

  const sections = Array.isArray(site.section) ? site.section : [];

  return (
    <div>
      {sections.map((section: any, i: number) => {
        if (section.type === "hero") {
          return (
            <HeroSection
              key={i}
              title={section.title}
              subtitle={section.subtitle}
            />
          );
        }

        if (section.type === "products") {
          return (
            <ProductsSection
              key={i}
              siteId={site.id} // ✅ pass siteId ONLY
            />
          );
        }

        if (section.type === "footer") {
          return <FooterSection key={i} />;
        }

        return null;
      })}
    </div>
  );
}
