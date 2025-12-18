export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PaymentCallbackInner from "@/components/PaymentCallbackInner";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Processing payment…</div>}>
      <PaymentCallbackInner />
    </Suspense>
  );
}
