"use client";

import { Suspense } from "react";
import PaymentPageInner from "@/components/PaymentPageInner";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading Payment...</div>}>
      <PaymentPageInner />
    </Suspense>
  );
}
