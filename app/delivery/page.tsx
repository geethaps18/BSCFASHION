"use client";

import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  price: number;
  size?: string;
  deliveryOtp?: string | null;
  delivered: boolean;
  deliveryBoyId?: string | null;
  productName: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  address?: string;
  lastSentOtp?: string; // DEV preview OTP
}

export default function DeliveryPage() {
  const [mode, setMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [deliveryBoyId, setDeliveryBoyId] = useState<string | null>(null);

  // --- Login state ---
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // --- Signup state ---
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupPincode, setSignupPincode] = useState("");

  const [loading, setLoading] = useState(false);

  // --- Dashboard state ---
  const [items, setItems] = useState<OrderItem[]>([]);
  const [sendingOtpId, setSendingOtpId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OUT_FOR_DELIVERY" | "DELIVERED">(
    "OUT_FOR_DELIVERY"
  );

  /** ================= CHECK LOCAL STORAGE ================= */
  useEffect(() => {
    const id = localStorage.getItem("deliveryBoyId");
    if (id) setDeliveryBoyId(id);
  }, []);

  /** ================= LOGIN HANDLERS ================= */
  const sendOtpLogin = async () => {
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent ✅");
        setOtpSent(true);
      } else toast.error(data.message || "Failed to send OTP");
    } catch (err) {
      console.error(err);
      toast.error("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpLogin = async () => {
    if (!otp) return toast.error("Enter OTP");
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Login successful ✅");
        localStorage.setItem("deliveryBoyId", data.deliveryBoyId);
        setDeliveryBoyId(data.deliveryBoyId);
      } else toast.error(data.message || "OTP verification failed");
    } catch (err) {
      console.error(err);
      toast.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  /** ================= SIGNUP HANDLER ================= */
  const handleSignup = async () => {
    if (!signupName || !signupPhone || !signupEmail) {
      return toast.error("Name, Phone, Email are required");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          phone: signupPhone,
          email: signupEmail,
          city: signupCity,
          pincode: signupPincode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Signup successful! Your ID: ${data.deliveryBoyId}`);
        setMode("LOGIN");
      } else toast.error(data.error || "Signup failed");
    } catch (err) {
      console.error(err);
      toast.error("Error signing up");
    } finally {
      setLoading(false);
    }
  };

  /** ================= DASHBOARD HANDLERS ================= */
  const fetchItems = async () => {
    if (!deliveryBoyId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/my-items", {
        headers: { "x-delivery-boy-id": deliveryBoyId },
      });
      if (!res.ok) throw new Error("Failed to fetch delivery items");
      const data: OrderItem[] = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch delivery items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryBoyId) fetchItems();
  }, [deliveryBoyId]);

  const handleOtpChange = (itemId: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, deliveryOtp: value } : i))
    );
  };

  const sendOtp = async (item: OrderItem) => {
    if (!deliveryBoyId) return;
    setSendingOtpId(item.id);
    try {
      const res = await fetch("/api/delivery/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryBoyId,
          contact: item.userPhone || item.userEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent to customer ✅");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, lastSentOtp: data.otp || "123456" } : i
          )
        );
      } else toast.error(data.message || "Failed to send OTP");
    } catch (err) {
      console.error(err);
      toast.error("Error sending OTP");
    } finally {
      setSendingOtpId(null);
    }
  };

  const markDelivered = async (item: OrderItem) => {
    if (!deliveryBoyId) return;
    if (!item.deliveryOtp || item.deliveryOtp.trim() === "") {
      toast.error("Enter OTP before marking delivered");
      return;
    }
    setVerifyingId(item.id);
    try {
      const res = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryBoyId,
          orderItemId: item.id,
          otp: item.deliveryOtp,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product marked delivered ✅");
        fetchItems();
      } else toast.error(data.message || "Failed to update delivery status");
    } catch (err) {
      console.error(err);
      toast.error("Error updating delivery status");
    } finally {
      setVerifyingId(null);
    }
  };

  const displayedItems = items
    .filter((i) =>
      filter === "ALL"
        ? true
        : i.delivered
        ? filter === "DELIVERED"
        : filter === "OUT_FOR_DELIVERY"
    )
    .filter(
      (i) =>
        i.userName.toLowerCase().includes(search.toLowerCase()) ||
        i.productName.toLowerCase().includes(search.toLowerCase())
    );

  /** ================= RENDER ================= */
  if (!deliveryBoyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Toaster />
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Delivery Boy Portal
          </h1>

          {/* LOGIN/SIGNUP TOGGLE */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded ${
                mode === "LOGIN" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setMode("LOGIN")}
            >
              Login
            </button>
            <button
              className={`px-4 py-2 rounded ${
                mode === "SIGNUP" ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setMode("SIGNUP")}
            >
              Signup
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === "LOGIN" && (
            <>
              {!otpSent ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    className="border p-2 rounded w-full mb-4"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button
                    onClick={sendOtpLogin}
                    disabled={loading}
                    className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-4 text-center text-gray-600">
                    OTP sent to {phone}
                  </p>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="border p-2 rounded w-full mb-4"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    onClick={verifyOtpLogin}
                    disabled={loading}
                    className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </>
              )}
            </>
          )}

          {/* SIGNUP FORM */}
          {mode === "SIGNUP" && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Name"
                className="border p-2 rounded w-full"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone"
                className="border p-2 rounded w-full"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className="border p-2 rounded w-full"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="City"
                className="border p-2 rounded w-full"
                value={signupCity}
                onChange={(e) => setSignupCity(e.target.value)}
              />
              <input
                type="text"
                placeholder="Pincode"
                className="border p-2 rounded w-full"
                value={signupPincode}
                onChange={(e) => setSignupPincode(e.target.value)}
              />
              <button
                onClick={handleSignup}
                disabled={loading}
                className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Signing up..." : "Signup"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === DASHBOARD ===
return (
  <div className="p-6 bg-gray-50 min-h-screen">
    <Toaster />

    {/* TOP BAR */}
    <div className="sticky top-0 bg-white shadow-sm p-4 flex justify-between items-center mb-6 z-10">
      <h1 className="text-2xl font-bold text-gray-800">Delivery Dashboard</h1>

      <button
        onClick={() => {
          localStorage.removeItem("deliveryBoyId");
          setDeliveryBoyId(null);
        }}
        className="text-red-600 underline text-sm"
      >
        Logout
      </button>
    </div>

    {/* FILTER TABS */}
    <div className="flex gap-3 mb-5 overflow-x-auto pb-2">
      {["ALL", "OUT_FOR_DELIVERY", "DELIVERED"].map((f) => (
        <button
          key={f}
          className={`px-4 py-2 rounded-full border font-semibold whitespace-nowrap ${
            filter === f
              ? "bg-blue-600 text-white border-blue-700 shadow"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => setFilter(f as any)}
        >
          {f.replaceAll("_", " ")}
        </button>
      ))}
    </div>

    {/* SEARCH */}
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search by Customer or Product Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-3 rounded-lg w-full shadow-sm"
      />
    </div>

    {/* ITEMS GRID */}
    {loading ? (
      <p className="text-gray-500">Loading assigned items...</p>
    ) : displayedItems.length === 0 ? (
      <p className="text-gray-500">No items found.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow-lg border rounded-xl p-5 flex flex-col gap-3"
          >
            {/* PRODUCT NAME */}
            <h2 className="font-bold text-lg text-gray-900">
              {item.productName}
            </h2>

            {/* CUSTOMER INFO */}
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                👤 <span className="font-semibold">{item.userName}</span>
              </p>
              <p>📞 {item.userPhone}</p>
              <p className="text-gray-600 text-sm leading-5">
                📍 <span className="font-medium">{item.address}</span>
              </p>
            </div>

            {/* PRODUCT DETAILS */}
            <p className="text-sm font-medium text-gray-800 border-t pt-2">
              Qty: {item.quantity} | Size: {item.size || "-"} | Price: ₹
              {item.price}
            </p>

            {/* ACTIONS */}
            {!item.delivered ? (
              <div className="flex flex-col gap-2 mt-3">
                {/* Send OTP */}
                <button
                  onClick={() => sendOtp(item)}
                  disabled={sendingOtpId === item.id}
                  className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sendingOtpId === item.id ? "Sending OTP…" : "Send OTP"}
                </button>

                {/* OTP Input */}
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={item.deliveryOtp || ""}
                  onChange={(e) => handleOtpChange(item.id, e.target.value)}
                  className="border p-2 rounded-lg"
                />

                {/* Mark Delivered */}
                <button
                  onClick={() => markDelivered(item)}
                  disabled={verifyingId === item.id}
                  className="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {verifyingId === item.id
                    ? "Verifying…"
                    : "Mark Delivered"}
                </button>

                {/* DEV OTP Preview */}
                {item.lastSentOtp && (
                  <p className="text-xs text-yellow-700 font-bold mt-1">
                    DEV OTP: {item.lastSentOtp}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-green-600 font-bold text-sm mt-3">
                ✔ Delivered
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

}
