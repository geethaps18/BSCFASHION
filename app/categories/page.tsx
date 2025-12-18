
import { Suspense } from "react";
import CategoriesClient from "./CategoriesClient";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading categories...</div>}>
      <CategoriesClient />
    </Suspense>
  );
}
