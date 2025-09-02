"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface BagItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams?.get("userId") || "";
  const totalFromQuery = searchParams?.get("total") || "0";

  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("COD");
  const [loading, setLoading] = useState<boolean>(true);

  const [upiId, setUpiId] = useState<string>("");
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Fetch bag items
  useEffect(() => {
    async function fetchBag() {
      if (!userId) return;

      try {
        const res = await fetch(`/api/bag?userId=${userId}`);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          setBagItems(
            data.items.map((item: any) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              productName: item.product.name,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch bag items");
      } finally {
        setLoading(false);
      }
    }
    fetchBag();
  }, [userId]);

  // Total amount calculated dynamically
  const totalAmount = bagItems.reduce(
    (acc: number, item: BagItem) => acc + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (!userId) {
      toast.error("User not found");
      return;
    }
    if (bagItems.length === 0) {
      toast.error("No items in the bag");
      return;
    }

    // Validate online payments
    if (paymentMode !== "COD") {
      if (paymentMode === "Card") {
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
          toast.error("Please fill all card details");
          return;
        }
      } else {
        if (!upiId) {
          toast.error("Please enter UPI ID for online payment");
          return;
        }
      }
    }

    const orderItems = bagItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: orderItems,
          totalAmount,
          paymentMode,
          upiId: paymentMode !== "COD" && paymentMode !== "Card" ? upiId : null,
          cardDetails: paymentMode === "Card" ? cardDetails : null,
          address: "Shipping address here", // Replace with actual address from address page
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Order placed successfully!");
        router.push("/order-success");
      } else {
        toast.error(data.error || "Order creation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-right" />

      <h2 className="text-2xl font-bold mb-4">Payment</h2>

      {/* Bag Items */}
      <div className="space-y-3 mb-4">
        {bagItems.map((item) => (
          <div key={item.id} className="flex justify-between border-b py-2">
            <span>{item.productName}</span>
            <span>
              {item.quantity} × ₹{item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between font-bold text-lg mb-6">
        <span>Total:</span>
        <span>₹{totalAmount.toFixed(2)}</span>
      </div>

      {/* Payment Options */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Choose Payment Method:</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 border p-2 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="COD"
              checked={paymentMode === "COD"}
              onChange={() => setPaymentMode("COD")}
              className="accent-green-600"
            />
            <img src="/icons/cod.png" alt="COD" className="w-8 h-8" />
            <span>Cash on Delivery</span>
          </label>

          {["GPay", "PhonePe", "Paytm"].map((method) => (
            <label
              key={method}
              className="flex items-center gap-3 border p-2 rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                value={method}
                checked={paymentMode === method}
                onChange={() => setPaymentMode(method)}
                className="accent-blue-600"
              />
              <img src={`/icons/${method.toLowerCase()}.png`} alt={method} className="w-8 h-8" />
              <span>{method}</span>
            </label>
          ))}

          <label className="flex items-center gap-3 border p-2 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="Card"
              checked={paymentMode === "Card"}
              onChange={() => setPaymentMode("Card")}
              className="accent-red-600"
            />
            <img src="/icons/card.png" alt="Card" className="w-8 h-8" />
            <span>Credit/Debit Card</span>
          </label>
        </div>
      </div>

      {/* Conditional UPI Input */}
      {paymentMode !== "COD" && paymentMode !== "Card" && (
        <div className="mb-4 p-3 border rounded">
          <label className="text-sm font-medium mb-1 block">Enter UPI ID:</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="example@okaxis"
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {/* Conditional Card Input */}
      {paymentMode === "Card" && (
        <div className="mb-4 p-3 border rounded space-y-2">
          <input
            type="text"
            placeholder="Card Number"
            value={cardDetails.number}
            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Expiry (MM/YY)"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
              className="w-1/2 border p-2 rounded"
            />
            <input
              type="text"
              placeholder="CVV"
              value={cardDetails.cvv}
              onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
              className="w-1/2 border p-2 rounded"
            />
          </div>
          <input
            type="text"
            placeholder="Name on Card"
            value={cardDetails.name}
            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      <button
        onClick={handlePayment}
        className="w-full bg-[#2B2B2B] text-white py-3 font-medium hover:bg-[#1A1A1A]"
      >
        {paymentMode === "COD" ? "Place Order" : "Pay Now"}
      </button>
    </div>
  );
}
