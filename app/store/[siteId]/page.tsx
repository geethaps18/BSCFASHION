// app/store/[siteId]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    siteId?: string;
  }>;
};

export default async function StorePage({ params }: Props) {
  const { siteId } = await params;

  // 🛑 ABSOLUTE GUARD — stops Prisma crash
  if (!siteId || siteId === "undefined") {
    notFound();
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold">{site.name}</h1>

      {site.tagline && (
        <p className="text-gray-600 mt-1">{site.tagline}</p>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border rounded p-3">
            <img
              src={p.images?.[0] || "/placeholder.png"}
              alt={p.name}
              className="h-40 w-full object-cover rounded"
            />
            <p className="mt-2 text-sm font-medium">{p.name}</p>
            <p className="font-semibold">₹{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

