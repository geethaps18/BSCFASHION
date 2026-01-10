import AddProductFormTabbed from "@/components/AddProductForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AddProductFormTabbed
  mode="edit"
  productId={id}
  siteId="builder"
/>
 );
}
