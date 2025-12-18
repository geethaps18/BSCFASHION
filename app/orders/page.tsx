export const dynamic = "force-dynamic";

import { Suspense } from "react";
import OrdersPageInner from "@/components/OrdersPageInner";
import LoadingRing from "@/components/LoadingRing";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <LoadingRing />
        </div>
      }
    >
      <OrdersPageInner />
    </Suspense>
  );
}
