import { prisma } from "@/lib/db";
import EditSiteForm from "./EditSiteForm";

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) return <div>Site not found</div>;

  return (
    <EditSiteForm
      siteId={site.id}
      name={site.name}
      tagline={site.tagline ?? ""}
    />
  );
}
