"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import React from "react";

export default function PaymentCallback() {
  return (
    <div>
      <SuspenseWrapper />
    </div>
  );
}

function SuspenseWrapper() {
  return (
    <React.Suspense fallback={<p>Processing payment...</p>}>
      <CallbackInner />
    </React.Suspense>
  );
}

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentId = params.get("razorpay_payment_id");
    const orderId = params.get("razorpay_order_id");
    const signature = params.get("razorpay_signature");

    console.log("Callback params:", { paymentId, orderId, signature });

    // After verifying payment → redirect to success page or error
    router.push("/orders");
  }, [params, router]);

  return (
    <div className="p-10 text-center">
      <h2 className="text-xl font-semibold">Verifying payment...</h2>
    </div>
  );
}
