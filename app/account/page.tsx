"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Mail, Phone, Banknote, MapPin } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs"; 
import Footer from "@/components/Footer"; // ✅ Import your Footer component

interface Account {
  name: string;
  email: string;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  pincode?: string;
  address?: string;
}

export default function AccountPage() {
  const [account, setAccount] = useState<Account>({
    name: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    pincode: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const userId = user?.id;

  // Fetch account data
  useEffect(() => {
    if (!isSignedIn || !userId) return router.push("/login");

    fetch(`/api/account?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setAccount(data);
      })
      .finally(() => setLoading(false));
  }, [router, isSignedIn, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAccount({ ...account, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...account }),
      });

      const data = await res.json();
      if (res.ok) {
        setAccount(data);
        alert("✅ Profile updated successfully!");
      } else {
        alert("⚠️ Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong!");
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; name: keyof Account; icon: React.ReactNode; textarea?: boolean }[] = [
    { label: "Full Name", name: "name", icon: <User className="w-5 h-5 text-gray-400" /> },
    { label: "Email", name: "email", icon: <Mail className="w-5 h-5 text-gray-400" /> },
    { label: "Phone", name: "phone", icon: <Phone className="w-5 h-5 text-gray-400" /> },
    { label: "Bank Name", name: "bankName", icon: <Banknote className="w-5 h-5 text-gray-400" /> },
    { label: "Account Number", name: "accountNumber", icon: <Banknote className="w-5 h-5 text-gray-400" /> },
    { label: "IFSC Code", name: "ifsc", icon: <Banknote className="w-5 h-5 text-gray-400" /> },
    { label: "Branch", name: "branch", icon: <Banknote className="w-5 h-5 text-gray-400" /> },
    { label: "Pincode", name: "pincode", icon: <MapPin className="w-5 h-5 text-gray-400" /> },
    { label: "Address", name: "address", icon: <MapPin className="w-5 h-5 text-gray-400" />, textarea: true },
  ];

  return (
    <div className="pb-32"> {/* Extra padding for footer */}
      <div className="max-w-3xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <User className="w-6 h-6" /> My Account
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading account...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-lg rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ label, name, icon, textarea }) => (
                <div key={name} className="flex flex-col relative col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5">{icon}</div>
                    {textarea ? (
                      <textarea
                        name={name}
                        value={account[name] || ""}
                        onChange={handleChange}
                        rows={2}
                        className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <input
                        type="text"
                        name={name}
                        value={account[name] || ""}
                        onChange={handleChange}
                        className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className={` w-full py-2   transition ${
                saving
                  ? "bg-black text-white cursor-not-allowed"
                  : "bg-black text-white hover:bg-black"
              }`}
            >
              💾 {saving ? "Saving..." : "Save Changes"}
            </button>

            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className=" w-full bg-red-600 text-white py-2  hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </SignOutButton>
          </form>
        )}
      </div>

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
}
