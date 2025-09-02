"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface BagItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
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

  // Place COD Order
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
          items: bagItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
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

  // Razorpay / Online Payment
  const handleOnlinePayment = async () => {
    if (!bagItems || bagItems.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    setLoading(true);
    try {
      // Create order on server (you can integrate Razorpay server API here)
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: bagItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount,
          paymentMode: "ONLINE",
          address: `${address.name}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        }),
      });
      const orderData = await res.json();
      if (!orderData.success) {
        toast.error(orderData.error || "Failed to create order");
        setLoading(false);
        return;
      }

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: totalAmount * 100, // in paise
        currency: "INR",
        name: "BSCFASHION",
        description: "Order Payment",
        order_id: orderData.orderId, // pass order id from server
        handler: function (response: any) {
          toast.success("Payment successful!");
          window.location.href = "/success";
        },
        prefill: {
          name: address.name,
          email: "",
          contact: address.phone,
        },
        theme: { color: "#2B2B2B" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Online Payment */}
      <button
        onClick={handleOnlinePayment}
        disabled={loading}
        className="w-full bg-[#2B2B2B] text-white py-3 font-semibold rounded-lg hover:bg-[#1A1A1A]"
      >
        {loading ? "Processing..." : `Pay ₹${totalAmount} Online`}
      </button>

      {/* Cash on Delivery */}
      <button
        onClick={handleCOD}
        className="w-full border border-gray-400 text-gray-900 py-3 font-semibold rounded-lg hover:bg-gray-100"
      >
        Cash on Delivery (COD)
      </button>
    </div>
  );
}
