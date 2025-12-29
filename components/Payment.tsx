"use client";

import { useState } from "react";
import toast from "react-hot-toast";
interface BagItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  size?: string | null;
  color?: string | null;        // ✅ ADD
  variantId?: string | null;    // ✅ ADD
}


interface Address {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaymentOptionsProps {
  totalAmount: number;
  userId: string;
  bagItems: BagItem[];
  address: Address;
}

export default function PaymentOptions({
  totalAmount,
  userId,
  bagItems,
  address,
}: PaymentOptionsProps) {
  const [loading, setLoading] = useState(false);

  // ------------------------------------------
  // 🟢 CASH ON DELIVERY
  // ------------------------------------------
  const handleCOD = async () => {
    if (!bagItems || bagItems.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: bagItems.map((item) => ({
  productId: item.productId,
  quantity: item.quantity,
  price: item.price,
  size: item.size ?? null,
  color: item.color ?? null,
  variantId: item.variantId ?? null, // 🔥 THIS IS THE KEY
}))
,
          totalAmount,
          paymentMode: "COD",
          address: `${address.name}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Order placed successfully!");
        window.location.href = "/success";
      } else {
        toast.error(data.error || "Failed to place order");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // 🔵 UPI ONLINE PAYMENT (PhonePe / GPay / Paytm / BHIM)
  // ------------------------------------------
  const handleOnlinePayment = async (upiApp: string) => {
    if (!bagItems || bagItems.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order (backend API)
      const res = await fetch("/api/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to create payment");
        return;
      }

      const orderId = data.order.id;

      // ------------------------------
      // 🔗 UPI Deep Links (opens app)
      // ------------------------------
      const upiLinks: Record<string, string> = {
        phonepe: `phonepe://pay?pa=yourupi@bank&pn=BSCFASHION&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`,
        gpay: `gpay://upi/pay?pa=yourupi@bank&pn=BSCFASHION&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`,
        paytm: `paytm://upi/pay?pa=yourupi@bank&pn=BSCFASHION&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`,
        bhim: `upi://pay?pa=yourupi@bank&pn=BSCFASHION&am=${totalAmount}&cu=INR&tn=Order%20${orderId}`,
      };

      window.location.href = upiLinks[upiApp];
    } catch (err: any) {
      console.error(err);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">

      {/* ---------------- UPI BUTTONS ---------------- */}

      <button
        onClick={() => handleOnlinePayment("phonepe")}
        disabled={loading}
        className="w-full bg-purple-600 text-white py-3 font-semibold rounded-lg hover:bg-purple-700"
      >
        Pay with PhonePe
      </button>

      <button
        onClick={() => handleOnlinePayment("gpay")}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 font-semibold rounded-lg hover:bg-blue-700"
      >
        Pay with Google Pay
      </button>

      <button
        onClick={() => handleOnlinePayment("paytm")}
        disabled={loading}
        className="w-full bg-cyan-600 text-white py-3 font-semibold rounded-lg hover:bg-cyan-700"
      >
        Pay with Paytm
      </button>

      <button
        onClick={() => handleOnlinePayment("bhim")}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 font-semibold rounded-lg hover:bg-green-700"
      >
        Pay with BHIM UPI
      </button>

      {/* ---------------- COD BUTTON ---------------- */}
      <button
        onClick={handleCOD}
        disabled={loading}
        className="w-full border border-gray-400 text-gray-900 py-3 font-semibold rounded-lg hover:bg-gray-100"
      >
        Cash on Delivery (COD)
      </button>

    </div>
  );
}
