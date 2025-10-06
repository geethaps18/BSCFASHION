"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import CheckoutStepper from "@/components/CheckoutStepper";
import { getCookie } from "cookies-next";

interface BagItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  size?: string | null;
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

export default function PaymentPage() {
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

  // Decode userId from token cookie
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

  // Fetch bag items
  useEffect(() => {
    if (!userId) return;
    const fetchBag = async () => {
      try {
        const res = await fetch(`/api/bag?userId=${userId}`);
        const data = await res.json();
        if (data.items) {
          const mappedItems: BagItem[] = data.items
            .filter((item: any) => item.product != null && item.product.price != null)
            .map((item: any) => ({
              id: item.id,
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price ?? 0,
              productName: item.product.name ?? "Product",
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

  // Fetch selected address
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

  const handlePayment = async () => {
    if (!userId) return toast.error("User not found");
    if (!selectedAddress) return toast.error("Please select an address");
    if (bagItems.length === 0) return toast.error("Bag is empty");

    try {
      setLoading(true);
      const validProductIds = bagItems.map(i => i.productId).filter((id): id is string => !!id);
      if (validProductIds.length === 0) {
        setLoading(false);
        return toast.error("No valid items in your bag");
      }

      const resProducts = await fetch("/api/products/latest-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: validProductIds }),
      });
      const latestProducts = await resProducts.json();

      const safeOrderItems = bagItems
        .map(item => {
          const product = latestProducts.find((p: any) => String(p.id) === String(item.productId));
          if (!product || product.price <= 0 || item.quantity <= 0) return null;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      if (safeOrderItems.length === 0) {
        setLoading(false);
        return toast.error("Some items in your bag are invalid. Please review your cart.");
      }

      const totalAmount =
        safeOrderItems.reduce((acc, i) => acc + i.price * i.quantity, 0) + shipping - discount;

      const resOrder = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: safeOrderItems,
          total: totalAmount,
          paymentMode,
          address: selectedAddress,
          upiId: paymentMode !== "COD" && paymentMode !== "Card" ? upiId : null,
          cardDetails: paymentMode === "Card" ? cardDetails : null,
        }),
      });

      const data = await resOrder.json();
      setLoading(false);

      if (data.success) {
        toast.success("Order placed successfully!");
        router.push(`/order-success/${data.order.id}`);
      } else {
        toast.error(data.error || "Order creation failed");
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!userId) return <p className="mt-20 text-center">Please login to proceed with payment.</p>;

  const subtotal = bagItems.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  const total = subtotal + shipping - discount;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-0">
      <CheckoutStepper />
      <div className="max-w-2xl mx-auto p-4 flex-grow w-full">
        <Toaster position="top-right" />

        {/* Address */}
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

        {/* Payment Options */}
        <div className="mb-24">
          <h3 className="font-medium mb-3 text-lg">Choose Payment Method:</h3>

          {/* COD Card */}
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
              <img src="/images/icons/COD.png" alt="COD" className="w-8 h-8 rounded-3xl" />
              <span className="font-medium">Cash on Delivery</span>
            </div>
          </label>

          {/* Online UPI Card */}
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
                    src={`/images/icons/${method.toLowerCase()}.png`}
                    alt={method}
                    className="w-8 h-8 rounded-3xl"
                  />
                  <span className="font-medium">{method}</span>
                </div>
              ))}
            </div>
            {["UPI"].includes(paymentMode) && (
              <input
                type="text"
                placeholder="Enter your UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-2 w-full border rounded-md p-2 text-sm"
              />
            )}
          </label>

          {/* Card Payment */}
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
              <img src="/images/icons/CARD.png" alt="Card" className="w-8 h-8 rounded-3xl" />
              <span className="font-medium">Credit/Debit Card</span>
            </div>
            {paymentMode === "Card" && (
              <div className="grid grid-cols-1 gap-3 mt-2">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    className="w-full border rounded-md p-2 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="w-full border rounded-md p-2 text-sm"
                  />
                </div>
              </div>
            )}
          </label>
        </div>

       {/* Bottom Section */}
<div className="bg-white border-t shadow-md p-0 fixed bottom-0 left-0 w-full">
  <button
    onClick={handlePayment}
    disabled={loading}
    className="w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-3 shadow-lg hover:shadow-xl transition flex flex-col items-center"
  >
    {/* Total above */}
    <span className="text-white text-sm">₹{total.toFixed(2)}</span>
    {/* Action text */}
    <span className="text-gray-900 font-bold">
      {loading ? "Processing..." : paymentMode === "COD" ? "Place Order" : "Pay Now"}
    </span>
  </button>
</div>

      </div>
    </div>
  );
}
