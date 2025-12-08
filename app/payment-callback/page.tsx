"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PaymentCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const paymentId = params.get("razorpay_payment_id");
    const orderId = params.get("razorpay_order_id");

    if (paymentId) {
      router.replace(`/order-success/${orderId}`);
    } else {
      router.replace(`/checkout/payment?error=failed`);
    }
  }, []);

  return <div className="p-10 text-center">Processing payment...</div>;
}
