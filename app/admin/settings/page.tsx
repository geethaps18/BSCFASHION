"use client";

import { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { Upload } from "lucide-react";

export default function SettingsPage() {
  // States
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();

        setStoreName(data.storeName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setLogoPreview(data.logoUrl || null);
        setRazorpayEnabled(!!data.razorpay);
        setCodEnabled(!!data.cod);
      } catch (err) {
        console.error("SETTINGS LOAD ERROR:", err);
      }
    };

    loadSettings();
  }, []);

const handleLogoUpload = (e: any) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = () => {
    setLogoPreview(reader.result as string); // base64 string
  };

  reader.readAsDataURL(file); // convert to base64
};


  // Save settings to backend
  const saveSettings = async () => {
    const payload = {
      storeName,
      email,
      phone,
      address,
      razorpay: razorpayEnabled,
      cod: codEnabled,
      logoUrl: logoPreview,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      alert("Settings saved successfully!");
    } catch (err) {
      console.error("SETTINGS SAVE ERROR:", err);
      alert("Failed to save settings");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {/* Business Info */}
      <Section title="Business Information">
        <Input label="Store Name" value={storeName} onChange={setStoreName} />
        <Input label="Email" value={email} onChange={setEmail} />
        <Input label="Phone" value={phone} onChange={setPhone} />
        <Input label="Address" value={address} onChange={setAddress} />
      </Section>

      {/* Logo */}
      <Section title="Store Branding">
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 rounded-lg border  flex items-center justify-center p-2 overflow-hidden">
  {logoPreview ? (
    <img
      src={logoPreview}
      className="max-w-full max-h-full object-contain"
      alt="Store Logo"
    />
  ) : (
    <span className="text-gray-400 text-sm">No Logo</span>
  )}
</div>


          <label className="flex items-center gap-2 cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg">
            <Upload size={18} />
            Upload Logo
            <input type="file" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
      </Section>

      {/* Payments */}
      <Section title="Payment Settings">
        <Toggle
          label="Enable Razorpay Payments"
          enabled={razorpayEnabled}
          setEnabled={setRazorpayEnabled}
        />
        <Toggle
          label="Enable Cash on Delivery (COD)"
          enabled={codEnabled}
          setEnabled={setCodEnabled}
        />
      </Section>

      <button
        onClick={saveSettings}
        className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-lg hover:bg-green-700 transition"
      >
        Save Settings
      </button>
    </div>
  );
}

/* Components */
function Section({ title, children }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-600 font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 rounded-lg bg-gray-50"
      />
    </div>
  );
}

function Toggle({ label, enabled, setEnabled }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>

      <Switch
        checked={enabled}
        onChange={setEnabled}
        className={`${
          enabled ? "bg-green-600" : "bg-gray-300"
        } relative inline-flex h-6 w-11 items-center rounded-full transition`}
      >
        <span
          className={`${
            enabled ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform bg-white rounded-full transition`}
        />
      </Switch>
    </div>
  );
}
