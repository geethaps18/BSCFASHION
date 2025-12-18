
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import CheckoutAddressInner from "@/components/CheckoutAddressInner";

export default function CheckoutAddressPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutAddressInner />
    </Suspense>
  );
}
