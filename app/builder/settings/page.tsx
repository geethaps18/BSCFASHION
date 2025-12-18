"use client";

import { useEffect, useState } from "react";

type Settings = {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  razorpay: boolean;
  cod: boolean;
  logoUrl?: string;
  gstNumber?: string;
};

export default function BuilderSettingsPage() {
  const [form, setForm] = useState<Settings>({
    storeName: "",
    email: "",
    phone: "",
    address: "",
    razorpay: false,
    cod: true,
    logoUrl: "",
    gstNumber: "",
  });

  const [saving, setSaving] = useState(false);

  // Load settings
  useEffect(() => {
    fetch("/api/builder/settings")
      .then((res) => res.json())
      .then((data) => setForm(data));
  }, []);

  const save = async () => {
    setSaving(true);

    await fetch("/api/builder/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    alert("Settings saved");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Store Settings</h1>

      {/* Store Info */}
      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Store Information</h2>

        <input
          value={form.storeName}
          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
          placeholder="Store Name"
          className="border p-2 rounded w-full"
        />

        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Support Email"
          className="border p-2 rounded w-full"
        />

        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Support Phone"
          className="border p-2 rounded w-full"
        />

        <textarea
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Pickup / Return Address"
          className="border p-2 rounded w-full"
        />

        <input
          value={form.gstNumber}
          onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
          placeholder="GST Number (optional)"
          className="border p-2 rounded w-full"
        />
      </section>

      {/* Payments */}
      <section className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Payment Options</h2>

        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.cod}
            onChange={(e) => setForm({ ...form, cod: e.target.checked })}
          />
          Cash on Delivery
        </label>

        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.razorpay}
            onChange={(e) =>
              setForm({ ...form, razorpay: e.target.checked })
            }
          />
          Razorpay Online Payment
        </label>
      </section>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="bg-yellow-500 px-6 py-2 rounded font-medium"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
