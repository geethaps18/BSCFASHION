"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import Link from "next/link";
import { getCookie } from "cookies-next";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiHome,
  FiBriefcase,
  FiMapPin,
} from "react-icons/fi";
import CheckoutStepper from "@/components/CheckoutStepper";

// ------------------- Interfaces -------------------
interface Address {
  id: string;
  type: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  email:string;
  doorNumber?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

interface BagItem {
  id: string;
  quantity: number;
  size?: string;
  product: {
    id?: string;
    name?: string;
    images?: string[];
    image?: string;
    price?: number;
    mrp?: number;
    variants?: { images?: string[]; size?: string; price?: number }[];
    [k: string]: any;
  };
}

interface PincodeSuggestion {
  Pincode: string;
  Name: string;
  District: string;
  State: string;
}

// ------------------- Component -------------------
export default function CheckoutAddressInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addressLoading, setAddressLoading] = useState(true);


  // --- totals passed from BagPage ---
  const subtotal = Number(searchParams?.get("subtotal") ?? "0");
  const shipping = Number(searchParams?.get("shipping") ?? "0");
  const discount = Number(searchParams?.get("discount") ?? "0");
  const total = Number(searchParams?.get("total") ?? "0");
  const totalCount = Number(searchParams?.get("totalCount") ?? "0");

  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [pincodeError, setPincodeError] = useState<string>("");

  const [newAddress, setNewAddress] = useState({
    type: "Home",
    name: "",
    phone: "",
    doorNumber: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    email: "",

  });

  const [pincodeSuggestions, setPincodeSuggestions] = useState<PincodeSuggestion[]>([]);

  const typeOptions = [
    { label: "Home", icon: <FiHome /> },
    { label: "Work", icon: <FiBriefcase /> },
    { label: "Other", icon: <FiMapPin /> },
  ];

  // ------------------- Fetch Bag + Addresses Together -------------------
  useEffect(() => {
    const token = getCookie("token");
    if (!token || typeof token !== "string") return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const uid = payload.userId;
      setUserId(uid);

      // fetch bag + addresses at the same time
      Promise.all([
        fetch("/api/bag").then((r) => r.json()),
        fetch(`/api/addresses?userId=${uid}`).then((r) => r.json()),
      ])
        .then(([bagData, addrData]) => {
          // normalize bag
          let items: any[] = [];
          if (Array.isArray(bagData)) items = bagData;
          else if (Array.isArray(bagData.items)) items = bagData.items;
          else if (Array.isArray(bagData.data)) items = bagData.data;

          const normalized: BagItem[] = items.map((it: any) => ({
            id: it.id ?? it._id ?? `${it.product?.id || "p"}-${it.size ?? "d"}`,
            quantity: Number(it.quantity ?? 1),
            size: it.size ?? it.sizes?.[0] ?? it.product?.selectedSize,
            product: it.product ?? {},
          }));
          setBagItems(normalized);

          // normalize addresses
          let list: Address[] = [];
          if (addrData && addrData.success) list = addrData.addresses || [];
          else if (Array.isArray(addrData)) list = addrData;

          setAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddress(defaultAddr);
          }
        })
        .catch((err) => {
          console.error("Fetch error", err);
          setBagItems([]);
          setAddresses([]);
        });
    } catch {
      setUserId(null);
    }
  }, []);

  // ------------------- Helpers -------------------
  const calcTotalFromBag = () =>
    bagItems.reduce((acc, item) => {
      const price = Number(item.product?.price ?? item.product?.mrp ?? 0) || 0;
      const qty = Number(item.quantity ?? 1) || 1;
      return acc + price * qty;
    }, 0);

  const getProductImage = (item: BagItem) => {
    const p = item.product || {};
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    if (p.image) return p.image;
    if (Array.isArray(p.variants) && p.variants.length) {
      const v = p.variants.find((v: any) => Array.isArray(v.images) && v.images.length);
      if (v?.images?.length) return v.images[0];
    }
    return "/placeholder.png";
  };
const validatePincode = async (pin: string) => {
  if (!/^\d{6}$/.test(pin)) {
    setPincodeError("Pincode must be 6 digits");
    setNewAddress(prev => ({ ...prev, city: "", state: "" }));
    return;
  }

  try {
    const res = await fetch(`/api/pincode?pin=${pin}`);
    const json = await res.json();
    const data = json.data;

    if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
      const po = data[0].PostOffice[0];
      setNewAddress(prev => ({ ...prev, city: po.District, state: po.State }));
      setPincodeError("");
    } else {
      setPincodeError("Unable to validate pincode");
      setNewAddress(prev => ({ ...prev, city: "", state: "" }));
    }
  } catch (err) {
    console.error("Pincode API error", err);
    setPincodeError("Unable to validate pincode");
    setNewAddress(prev => ({ ...prev, city: "", state: "" }));
  }
};



const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setNewAddress(prev => ({ ...prev, [name]: value }));
};


  const handleSelectSuggestion = (s: PincodeSuggestion) => {
    setNewAddress(prev => ({ ...prev, city: s.District, state: s.State, pincode: s.Pincode }));
    setPincodeSuggestions([]);
    setPincodeError("");
  };

  const resetForm = () => {
    setNewAddress({
      type: "Home",
      name: "",
      phone: "",
      doorNumber: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      email:"",
    });
    setEditingId(null);
    setIsDefault(false);
    setFormVisible(false);
    setPincodeSuggestions([]);
    setPincodeError("");
  };

  const handleSaveAddress = async () => {
    if (!userId) return;
    if (pincodeError) return toast.error("Please fix the pincode");
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await fetch("/api/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, userId, isDefault, id: editingId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Address updated!" : "Address added!");
        resetForm();
        setShowAddressModal(false);
        const updatedRes = await fetch(`/api/addresses?userId=${userId}`);
        const updatedData = await updatedRes.json();
        let list: Address[] = updatedData?.addresses || updatedData || [];
        setAddresses(list);
        const defaultAddr = list.find(a => a.isDefault) || list[0];
        setSelectedAddress(defaultAddr || null);
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Address deleted!");
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        if (selectedAddress?.id === id) setSelectedAddress(updated[0] || null);
      } else toast.error(data.error || "Failed to delete address");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleEdit = (addr: Address) => {
    setNewAddress({
      type: addr.type ?? "Home",
      name: addr.name ?? "",
      phone: addr.phone ?? "",
      doorNumber: addr.doorNumber ?? "",
      street: addr.street ?? "",
      landmark: addr.landmark ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      pincode: addr.pincode ?? "",
      email:addr.email??"",
    });
    setEditingId(addr.id);
    setIsDefault(Boolean(addr.isDefault));
    setFormVisible(true);
  };

  const handleContinue = () => {
    if (!selectedAddress) return toast.error("Please select an address");
    router.push(
      `/checkout/payment?total=${calcTotalFromBag()}&addressId=${selectedAddress.id}`
    );
  };

   if (!userId)
    return (
      <div className="mt-20 text-center">
        <p className="text-gray-700 mb-4">Please login to continue</p>
        <Link
          href="/login"
          className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-500"
        >
          Login
        </Link>
      </div>
    );
return (
    <div className="flex flex-col  pt-0">
      <CheckoutStepper />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 relative grid md:grid-cols-3 gap-6">

      <div className="md:col-span-40 space-y-6">
{/* LEFT: Selected Address */}
<div className="md:col-span-2">
  {selectedAddress ? (
    <div className="border p-3 rounded flex justify-between items-start bg-white">
      <div className="flex flex-col gap-2">
        {/* Type + Icon */}
        <div className="flex items-center gap-2">
          {selectedAddress.type === "Home" && <FiHome className="text-gray-600" />}
          {selectedAddress.type === "Work" && <FiBriefcase className="text-gray-600" />}
          {selectedAddress.type === "Other" && <FiMapPin className="text-gray-600" />}
          <span className="font-medium">{selectedAddress.type}</span>
          {selectedAddress.isDefault && (
            <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded">
              DEFAULT
            </span>
          )}
        </div>

        {/* Name + Phone */}
        <p className="text-sm font-medium text-gray-800">
          {selectedAddress.name} 
          </p>
          <p className="text-sm font-medium text-gray-80">
          Phone : {selectedAddress.phone}
       
              <p className="text-sm font-medium text-gray-80">
          Email : {selectedAddress.email}
          </p>
             </p>
        

        {/* Full Address */}
        <p className="text-sm text-gray-700">
         {selectedAddress.doorNumber}, {selectedAddress.street}{" "}
          {selectedAddress.landmark ? `, ${selectedAddress.landmark}` : ""}, {selectedAddress.city},{" "}
          {selectedAddress.state} - {selectedAddress.pincode}
        </p>
      </div>

      {/* Change Button */}
      <button
        onClick={() => setShowAddressModal(true)}
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded transition"
      >
        CHANGE
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowAddressModal(true)}
      className="mt-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded text-black font-medium"
    >
      Add Address
    </button>
  )}
</div>


      
{/* RIGHT: Order Summary */}
<div className="space-y-2">
  <h3 className="font-bold text-lg">Order Summary ({totalCount} items)</h3>
<div className="max-w-5xl mx-auto p-4 sm:p-6 p relative flex flex-col lg:flex-row gap-6">

  {/* LEFT: Product Cards */}
  <div className="flex-1 space-y-1 lg:pr-4">
    {bagItems.length === 0 ? (
      <p className="text-sm text-gray-600">Your bag is empty</p>
    ) : (
      bagItems.map((item) => (
        <div
          key={item.id}
          className="border rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition"
        >
          <img
            src={getProductImage(item)}
            alt={item.product?.name}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1 text-sm text-gray-700">
            Delivery by{" "}
            <span className="font-medium">
              {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
                "en-IN",
                { weekday: "short", month: "short", day: "numeric" }
              )}
            </span>
          </div>
        </div>
      ))
    )}
  </div>

  {/* RIGHT: Price Details + Button */}
  <div className="lg:w-100 flex-shrink-0 space-y-4">
    <div className="border rounded p-4 ">
      <h3 className="font-bold mb-3">Price Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
        <div className="flex justify-between"><span>Delivery</span><span className="text-green-600">₹{shipping.toFixed(0)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span className="text-red-600">-₹{discount.toFixed(0)}</span></div>
        <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
      </div>
    </div>

    {/* Desktop Button */}
    <div className="hidden lg:block">
      <Link
        href={{
          pathname: "/checkout/payment",
          query: { subtotal, shipping, discount, total, totalCount, addressId: selectedAddress?.id, },
        }}
      >
        <button
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-3 hover:shadow-lg transition">
          Continue Payment
        </button>
      </Link>
    </div>
  </div>
</div>

{/* Mobile Bottom Button (stays fixed) */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50 flex lg:hidden">
  <div className="flex-1 text-center py-4 font-semibold text-lg text-gray-900 border-r">
    ₹{total}
  </div>
  <Link
    href={{
      pathname: "/checkout/payment",
      query: { shipping, discount, total, totalCount, addressId: selectedAddress?.id, },
    }}
    className="flex-1"
  >
    
    <button 
    onClick={handleContinue}
    className="w-full h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-4 shadow-lg hover:shadow-xl transition">
      Continue Payment
    </button>
  </Link>
</div>
</div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded p-4 relative">
            <h2 className="font-bold text-lg mb-3">Select Delivery Address</h2>

            {!formVisible && (
              <div className="space-y-3 max-h-72 overflow-auto">
{addresses.map(addr => {
  const isSelected = selectedAddress?.id === addr.id || (!selectedAddress && addr.isDefault);

  return (
    <label
      key={addr.id}
      className={`border p-3 rounded block cursor-pointer flex justify-between items-start gap-2 ${
        isSelected ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
      }`}
      onClick={() => {
        setSelectedAddress(addr);
        setShowAddressModal(false);
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {/* Type Badge with Icon */}
          {addr.type === "Home" && <FiHome className="text-gray-600" />}
          {addr.type === "Work" && <FiBriefcase className="text-gray-600" />}
          {addr.type === "Other" && <FiMapPin className="text-gray-600" />}
          <span className="font-medium">{addr.type}</span>
          {addr.isDefault && (
            <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded">
              DEFAULT
            </span>
          )}
        </div>
        <p className="text-sm mt-1">
          {addr.name} ({addr.phone})<br />
          {addr.doorNumber}, {addr.street} {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
        </p>
      </div>

      {/* Edit/Delete Buttons */}
      <div className="flex flex-col gap-2">
        <FiEdit2
          className="text-blue-500 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
        />
        <FiTrash2
          className="text-red-500 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
        />
      </div>
    </label>
  );
})}



                
              </div>
            )}

            {!formVisible && (
              <button onClick={() => setFormVisible(true)} className="mt-3 w-full border-2 border-dashed border-gray-300 py-2 rounded flex items-center justify-center gap-2">
                <FiPlus /> Add New Address
              </button>
            )}



            {formVisible && (
              <div className="border p-3 rounded space-y-2 mt-4">
                <h3 className="font-medium">{editingId ? "Edit Address" : "Add New Address"}</h3>

                {["name","phone","email","doorNumber","street","landmark","pincode"].map(field => (
                  <div key={field}>
                    
                    <input
                      name={field}
                      placeholder={field.replace(/([A-Z])/g," $1").replace(/^./, str=>str.toUpperCase())}
                      value={(newAddress as any)[field]}
                      onChange={handleInputChange}
                      onBlur={() => validatePincode(newAddress.pincode)}
                      className="w-full border p-2 rounded"
                    />
                    {field==="pincode" && pincodeError && <p className="text-red-500 text-sm mt-1">{pincodeError}</p>}
                  </div>
                ))}

                <div className="relative">
                  <input name="city" placeholder="City / Village" value={newAddress.city} onChange={handleInputChange} className="w-full border p-2 rounded"/>
                  {pincodeSuggestions.length>0 && (
                    <ul className="absolute z-50 bg-white border w-full mt-1 max-h-48 overflow-auto rounded shadow-lg">
                      {pincodeSuggestions.map((s,idx)=>(

                        <li key={idx} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={()=>handleSelectSuggestion(s)}>
                          {s.Name} - {s.District}, {s.State} ({s.Pincode})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <input name="state" placeholder="State" value={newAddress.state} disabled className="w-full border p-2 rounded" />

                <div className="flex gap-2 mt-2">
                  {typeOptions.map(opt => (
                    <div key={opt.label} onClick={()=>setNewAddress(prev=>({...prev,type:opt.label as "Home"|"Work"|"Other"}))} className={`flex-1 flex items-center justify-center gap-1 p-2 border rounded cursor-pointer ${newAddress.type===opt.label?"border-yellow-400 bg-yellow-50":"border-gray-300"}`}>
                      {opt.icon} <span>{opt.label}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 mt-1">
                  <input type="checkbox" checked={isDefault} onChange={()=>setIsDefault(!isDefault)}/> Set as default
                </label>

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={handleSaveAddress} disabled={!!pincodeError} className={`flex-1 py-2 rounded font-medium ${pincodeError?"bg-gray-400 text-white cursor-not-allowed":"bg-yellow-400 hover:bg-yellow-500 text-black"}`}>
                    {editingId?"Update Address":"Save Address"}
                  </button>
                  <button type="button" onClick={()=>{resetForm(); setFormVisible(false);}} className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600">Cancel</button>
                </div>
              </div>
            )}

            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={()=>{setShowAddressModal(false); resetForm();}}>✕</button>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  
  );
}

