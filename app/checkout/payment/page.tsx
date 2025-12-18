
import { Suspense } from "react";
import PaymentPageInner from "@/components/PaymentPageInner";

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentPageInner />
    </Suspense>
  );
}
