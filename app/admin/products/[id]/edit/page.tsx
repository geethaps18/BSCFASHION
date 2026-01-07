import ProductFormTabbed from "../../new/page";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <ProductFormTabbed
      mode="edit"
      productId={id}
    />
  );
}
