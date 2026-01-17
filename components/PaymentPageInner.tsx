"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import LoadingRing from "./LoadingRing";
import CheckoutStepper from "@/components/CheckoutStepper";
import { getCookie } from "cookies-next";

interface BagItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  size?: string | null;
  color?: string | null;      // ✅ ADD
  variantId?: string | null;  // ✅ ADD
}


interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  doorNumber?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function PaymentPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<"COD" | "Card" | "UPI" | string>("COD");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [upiId, setUpiId] = useState<string>("");
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const addressId = params.get("addressId");
  const shipping = Number(params.get("shipping") ?? 0);
  const discount = Number(params.get("discount") ?? 0);

  const subtotal = bagItems.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  const total = subtotal + shipping - discount;

  // Decode JWT
  useEffect(() => {
    const token = getCookie("token");
    if (!token || typeof token !== "string") {
      setUserId(null);
      setLoading(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.userId || null);
    } catch (err) {
      console.error("Invalid JWT:", err);
      setUserId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Bag
  useEffect(() => {
    if (!userId) return;
    const fetchBag = async () => {
      try {
        const res = await fetch(`/api/bag?userId=${userId}`);
        const data = await res.json();
        if (data.items) {
 const mappedItems: BagItem[] = data.items.map((item: any) => ({
  id: item.id,
  productId: item.product.id,
  quantity: item.quantity,
  price: item.price, // ✅ FIXED (SOURCE OF TRUTH)
  productName: item.product.name ?? "Product",
  size: item.size ?? null,
  color: item.color ?? null,
  variantId: item.variantId ?? null
}));


          setBagItems(mappedItems);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch bag items");
      }
    };
    fetchBag();
  }, [userId]);

  // Fetch Address
  useEffect(() => {
    if (!addressId) return;
    const fetchAddress = async () => {
      try {
        const res = await fetch(`/api/addresses/${addressId}`);
        const data = await res.json();
        if (data.address) setSelectedAddress(data.address);
      } catch (err) {
        console.error("Failed to fetch address:", err);
      }
    };
    fetchAddress();
  }, [addressId]);

  const handleRazorpayPayment = async () => {
  if (!userId) return toast.error("User not found");

  const res = await fetch("/api/razorpay-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: total }),
  });

  const data = await res.json();
  if (!data.success) {
    toast.error("Failed to create order");
    return;
  }

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    amount: total * 100,
    currency: "INR",
    name: "B S CHANNABASAPPA & SONS",
    description: "Order Payment",
    order_id: data.orderId,
    handler: function (response) {
      router.push(`/payment-success?razorpay_payment_id=${response.razorpay_payment_id}`);
    },
    theme: {
      color: "#fbbf24",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

  const handlePayment = () => {
    if (paymentMode === "COD") {
      createCODOrder();
    } else if (["GPay", "PhonePe", "Paytm", "Card"].includes(paymentMode)) {
      handleRazorpayPayment();
    } else {
      toast.error("Select a valid payment method");
    }
  };

  const createCODOrder = async () => {
    if (!userId || !selectedAddress || bagItems.length === 0) return;

    try {
      setLoading(true);

     const orderItems = bagItems.map((item) => ({
  productId: item.productId,
  quantity: item.quantity,
  price: item.price,
  size: item.size,
  color: item.color,          // ✅ ADD
  variantId: item.variantId,  // 🔥 THIS FIXES EVERYTHING
}));

const invalidItem = bagItems.find(i => !i.variantId);

if (invalidItem) {
  toast.error(
    `Please reselect size / color for ${invalidItem.productName}`
  );
  router.push(`/product/${invalidItem.productId}`);
  return;
}

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: orderItems,
          totalAmount: total,
          paymentMode: "COD",
          address: selectedAddress,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        toast.success("Order placed successfully!");
        router.push(`/order-success/${data.order.id}`);
      } else {
        toast.error(data.error || "COD order failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("COD order failed");
      setLoading(false);
    }
  };
if (loading)
  return (
    <div className="flex justify-center items-center py-20">
      <LoadingRing />
    </div>
  );
  if (!userId) return <p className="mt-20 text-center">Please login to proceed with payment.</p>;

  return (
    <div className="flex flex-col min-h-screen pt-0">
      <CheckoutStepper />
      <div className="max-w-2xl mx-auto p-4 flex-grow w-full">
  

        {/* --- Address Card --- */}
        {selectedAddress && (
          <div className="border p-4 rounded mb-4 bg-yellow-50">
            <h3 className="font-semibold">{selectedAddress.type} Address</h3>
            <p>
              {selectedAddress.name} ({selectedAddress.phone})
            </p>
            <p>
              {selectedAddress.doorNumber}, {selectedAddress.street}{" "}
              {selectedAddress.landmark ? `, ${selectedAddress.landmark}` : ""},{" "}
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </p>
          </div>
        )}

        {/* Price Details */}
        <div className="border p-4 rounded mb-4 bg-white">
          <h3 className="font-semibold mb-2">Price Details</h3>
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2 border-t pt-2">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-24">
          <h3 className="font-medium mb-3 text-lg">Choose Payment Method:</h3>

          {/* COD */}
          <label
            className={`flex flex-col gap-2 p-5 border rounded-lg cursor-pointer transition-all ${
              paymentMode === "COD" ? "border-black shadow-md bg-gray-100" : "bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                value="COD"
                checked={paymentMode === "COD"}
                onChange={() => setPaymentMode("COD")}
                className="accent-green-600"
              />
              <img src="/images/COD.png" alt="COD" className="w-8 h-8 rounded-3xl" />
              <span className="font-medium">Cash on Delivery</span>
            </div>
          </label>

          {/* UPI Section */}
          <label
            className={`flex flex-col gap-2 p-5 border rounded-lg cursor-pointer transition-all ${
              ["GPay", "PhonePe", "Paytm"].includes(paymentMode)
                ? "border-black shadow-md bg-gray-100"
                : "bg-white hover:shadow-md"
            }`}
          >
            <span className="font-medium mb-2">Pay via UPI</span>
            <div className="flex flex-col gap-5">
              {["GPay", "PhonePe", "Paytm"].map((method) => (
                <div
                  key={method}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setPaymentMode(method)}
                >
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMode === method}
                    onChange={() => setPaymentMode(method)}
                    className="accent-blue-600"
                  />
                  <img
                    src={`/images/${method.toLowerCase()}.png`}
                    alt={method}
                    className="w-8 h-8 rounded-3xl"
                  />
                  <span className="font-medium">{method}</span>
                </div>
              ))}
            </div>

          
          </label>

          {/* CARD Section */}
          <label
            className={`flex flex-col gap-2 p-5 border rounded-lg cursor-pointer transition-all ${
              paymentMode === "Card" ? "border-black shadow-md bg-gray-100" : "bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                value="Card"
                checked={paymentMode === "Card"}
                onChange={() => setPaymentMode("Card")}
                className="accent-red-600"
              />
              <img src="/images/CARD.png" alt="Card" className="w-8 h-8 rounded-3xl" />
              <span className="font-medium">Credit/Debit Card</span>
            </div>

            {paymentMode === "Card" 
              
            }
          </label>
        </div>
<div className="hidden md:flex flex-col gap-3 mt-4">
  <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-3 shadow-lg hover:shadow-xl transition flex flex-col items-center"
          >
            <span className="text-white text-sm">₹{total.toFixed(2)}</span>
            <span className="text-gray-900 font-bold">
              {loading ? "Processing..." : paymentMode === "COD" ? "Place Order" : "Pay Now"}
            </span>
          </button>
</div>
        {/* Bottom Payment Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white  flex gap-2 p-3 z-50">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-3 shadow-lg hover:shadow-xl transition flex flex-col items-center"
          >
            <span className="text-white text-sm">₹{total.toFixed(2)}</span>
            <span className="text-gray-900 font-bold">
              {loading ? "Processing..." : paymentMode === "COD" ? "Place Order" : "Pay Now"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
