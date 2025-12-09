"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Mail,
  Phone,
  Banknote,
  Save,
  X,
  MapPin,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import toast from "react-hot-toast";
import { deleteCookie } from "cookies-next";
import ProductCard from "@/components/ProductCard";
import LoadingRing from "@/components/LoadingRing";

// ----------------- Types -----------------
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

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  address: string;
  expectedDelivery?: string;
  trackingNumber?: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
  }[];
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface Address {
  id: string;
  label?: string;
  type?: string;
  name: string;
  phone: string;
  doorNumber?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ----------------- Component -----------------
export default function AccountPage() {
  const router = useRouter();

  const [tab, setTab] = useState<
    "bank-details" | "orders" | "wishlist" | "addresses"
  >("bank-details");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});

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

  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Account / Bank Details
        const resProfile = await fetch("/api/account");
        if (!resProfile.ok) throw new Error("Unauthorized");
        const dataProfile = await resProfile.json();
        setAccount(dataProfile || {});

        // Orders
        const resOrders = await fetch("/api/orders");
        const dataOrders = resOrders.ok ? await resOrders.json() : { orders: [] };
        setOrders(dataOrders.orders || []);

        // Wishlist
        const resWishlist = await fetch("/api/wishlist");
        const dataWishlist = resWishlist.ok ? await resWishlist.json() : { products: [] };
        setWishlist(dataWishlist.products || []);

        // Addresses
        const resAddresses = await fetch("/api/addresses");
        const dataAddresses = resAddresses.ok ? await resAddresses.json() : { addresses: [] };
        setAddresses(dataAddresses.addresses || []);
      } catch (err) {
        console.error(err);
        toast.error("⚠️ Please login first!");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // ----------------- Bank Details -----------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const key = e.target.name as keyof Account;
    setAccount({ ...account, [key]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) {
      setEditing(true);
      return;
    }

    setSaving(true);
    try {
      const { bankName, accountNumber, ifsc, branch } = account;

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber, ifsc, branch }),
      });
      const data = await res.json();

      if (res.ok) {
        setAccount(data);
        toast.success("✅ Bank details updated successfully!");
        setEditing(false);
      } else {
        toast.error("⚠️ " + (data.error || "Update failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Something went wrong!");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    deleteCookie("token", { path: "/" });
    toast.success("Signed out successfully ✅");
    router.push("/");
    router.refresh();
  };

  // ----------------- Address -----------------
  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm(addr);
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setAddressForm({});
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const saveAddress = async () => {
    if (!editingAddressId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAddressId, ...addressForm }),
      });
      const data = await res.json();

      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddressId ? data.address : a))
        );
        toast.success("✅ Address updated successfully!");
        cancelEditAddress();
      } else {
        toast.error("⚠️ " + (data.error || "Update failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Something went wrong!");
    } finally {
      setSaving(false);
    }
  };

  // ----------------- Fields -----------------
  const fields = [
    { label: "Bank Name", name: "bankName", icon: <Banknote className="w-5 h-5 text-yellow-500" /> },
    { label: "Account Number", name: "accountNumber", icon: <Banknote className="w-5 h-5 text-yellow-500" /> },
    { label: "IFSC Code", name: "ifsc", icon: <Banknote className="w-5 h-5 text-yellow-500" /> },
    { label: "Branch", name: "branch", icon: <Banknote className="w-5 h-5 text-yellow-500" /> },
  ];

  // ----------------- UI -----------------
  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto mt-12 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          {["bank-details", "orders", "wishlist", "addresses"].map((t) => (
            <button
              key={t}
              className={`px-4 py-2 -mb-px font-medium ${
                tab === t
                  ? "border-b-2 border-yellow-500 text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTab(t as any)}
            >
              {t === "bank-details" ? "Bank Details" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

       {loading ? (
  <div className="flex justify-center items-center py-20">
    <LoadingRing />
  </div>
) : (

          <>
            {/* Bank Details Form */}
            {tab === "bank-details" && (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white shadow-lg rounded-2xl p-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map(({ label, name, icon }) => (
                    <div key={name} className="flex flex-col relative">
                      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-2.5">{icon}</div>
                        <input
                          type="text"
                          name={name}
                          value={account[name as keyof Account] || ""}
                          onChange={handleChange}
                          readOnly={!editing}
                          className={`pl-10 pr-3 py-2 w-full border rounded-lg ${
                            editing
                              ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              : "bg-gray-100 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-600 transition"
                >
                  {editing ? (saving ? "💾 Saving..." : "💾 Save Changes") : "✏️ Edit Bank Details"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </form>
            )}

            {/* Orders */}
            {tab === "orders" && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-gray-500">No orders found.</p>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="border p-4 rounded-lg shadow-sm bg-white">
                      <p className="font-medium">Order ID: {o.id}</p>
                      <p>
                        Status: <span className="font-semibold">{o.status}</span>
                      </p>
                      <p>
                        Ordered At: {mounted ? new Date(o.createdAt).toLocaleString() : "..."}
                      </p>
                      <p>Total: ₹{o.totalAmount}</p>
                      <ul className="mt-2">
                        {o.items.map((item) => (
                          <li key={item.id}>
                            {item.product.name} x {item.quantity} - ₹{item.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}

          {/* Wishlist */}
{tab === "wishlist" && (
  <div className="p-1 sm:p-6">
    {wishlist.length === 0 ? (
      <p className="text-gray-500 text-center">Your wishlist is empty.</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5 sm:gap-0.5">
        {wishlist.map((item) => (
          // Here we use ProductCard, assuming wishlist items have full product data
        <ProductCard
  key={item.id}
  product={{
    id: item.id,
    name: item.name,
    price: item.price,
    mrp: item.price,
    discount: 0,
    description: "",
    category: "Wishlist",
    images: item.images.length ? item.images : ["/placeholder.png"],
    variants: [
      {
        sizes: ["Free"],
        colors: [{ name: "Default", hex: "#111827" }], // <-- must match ProductVariant type
        price: item.price,
        mrp: item.price,
        discount: 0,
        images: item.images.length ? item.images : ["/placeholder.png"],
        stock: 10,
        design: "",
      },
    ],
    colors: [{ name: "Default", hex: "#111827" }], // <-- required
    reviewCount: 0, // <-- required
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }}
/>

        
        ))}
      </div>
    )}
  </div>
)}


            {/* Addresses */}
            {tab === "addresses" && (
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-gray-500">No addresses found.</p>
                ) : (
                  addresses.map((a) => (
                    <div key={a.id} className="border p-4 rounded-lg shadow-sm bg-white space-y-2">
                      {editingAddressId === a.id ? (
                        <>
                          <input
                            type="text"
                            name="name"
                            value={addressForm.name || ""}
                            onChange={handleAddressChange}
                            placeholder="Full Name"
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="phone"
                            value={addressForm.phone || ""}
                            onChange={handleAddressChange}
                            placeholder="Phone"
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="doorNumber"
                            value={addressForm.doorNumber || ""}
                            onChange={handleAddressChange}
                            placeholder="Door No."
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="street"
                            value={addressForm.street || ""}
                            onChange={handleAddressChange}
                            placeholder="Street"
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="city"
                            value={addressForm.city || ""}
                            onChange={handleAddressChange}
                            placeholder="City"
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="state"
                            value={addressForm.state || ""}
                            onChange={handleAddressChange}
                            placeholder="State"
                            className="border p-2 w-full rounded"
                          />
                          <input
                            type="text"
                            name="pincode"
                            value={addressForm.pincode || ""}
                            onChange={handleAddressChange}
                            placeholder="Pincode"
                            className="border p-2 w-full rounded"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveAddress}
                              disabled={saving}
                              className="bg-yellow-500 text-black px-3 py-1 rounded flex items-center gap-1 hover:bg-yellow-600"
                            >
                              <Save className="w-4 h-4" /> Save
                            </button>
                            <button
                              onClick={cancelEditAddress}
                              className="bg-gray-400 text-white px-3 py-1 rounded flex items-center gap-1"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">
                            {a.name} {a.type ? `(${a.type})` : ""}
                          </p>
                          <p>
                            {a.doorNumber}, {a.street}, {a.city}, {a.state} - {a.pincode}
                          </p>
                          <p>Phone: {a.phone}</p>
                          <button
                            onClick={() => startEditAddress(a)}
                            className="mt-2 bg-yellow-500 text-black px-3 py-1 rounded flex items-center gap-1 hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
