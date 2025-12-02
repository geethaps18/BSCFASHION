import { Suspense } from "react";
import SearchPageInner from "@/components/SearchPageInner";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
