// app/builder/products/new/page.tsx
import { prisma } from "@/lib/db";
import AddProductFormTabbed from "@/components/AddProductForm";

export default async function NewProductPage() {
  // 🔥 FETCH CURRENT SITE (SERVER SIDE)
  const site = await prisma.site.findFirst({
    select: { id: true },
  });

  if (!site) {
    return <div>No store found</div>;
  }

  return (
    <AddProductFormTabbed
      mode="add"
      siteId={site.id} // ✅ PASS SITE ID
    />
  );
}
