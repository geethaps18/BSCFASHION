import { Suspense } from "react";
import OurStoryPageInner from "@/components/OurStoryPageInner";
import LoadingRing from "@/components/LoadingRing";

export default function OurStoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <LoadingRing />
        </div>
      }
    >
      <OurStoryPageInner />
    </Suspense>
  );
}
