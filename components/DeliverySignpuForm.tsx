"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function DeliverySignupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/delivery/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, city, pincode }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success("Signup successful! Your DeliveryBoy ID: " + data.deliveryBoyId);
      setName(""); setPhone(""); setEmail(""); setCity(""); setPincode("");
    } else {
      toast.error(data.error || "Signup failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Delivery Boy Signup</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="input" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required className="input" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="input" />
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required className="input" />
      <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode" required className="input" />
      <button type="submit" disabled={loading} className="btn mt-4 w-full">
        {loading ? "Signing up..." : "Signup"}
      </button>
    </form>
  );
}
