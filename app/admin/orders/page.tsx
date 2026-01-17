// app/admin/orders/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  FileDown,
  Search as SearchIcon,
  Filter as FilterIcon,
  CheckCircle,
  Truck,
  Home,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  id: string;
  name: string;
  brandName?:string;
  quantity?: number;
  price?: number;
  size?: string;
  color?: string;
  image?: string;
  product?: { images?: string[] };   // ⭐ ADD THIS
};


type Order = {
  id: string;
  status: string;
  totalAmount?: number;
  paymentMode?: string;
  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  user?: { name?: string; phone?: string; email?: string } | null;
  address?: any;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | string>("All");
  const [limit, setLimit] = useState<number>(15);
  const [refreshToggle, setRefreshToggle] = useState(false);
  
const getShipping = (amount: number) => (amount < 1000 ? 100 : 0);

  const DB_TO_LABEL: Record<string, string> = {
    PENDING: "Order Placed",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
  };
  const LABEL_TO_DB = Object.fromEntries(
    Object.entries(DB_TO_LABEL).map(([k, v]) => [v, k])
  );
  const NEXT_STATUS_DB: Record<string, string | null> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
    DELIVERED: null,
  };

  const iconsByDB: Record<string, React.ReactElement> = {
    PENDING: <Package size={16} className="text-blue-500" />,
    CONFIRMED: <CheckCircle size={16} className="text-green-600" />,
    SHIPPED: <Truck size={16} className="text-orange-500" />,
    OUT_FOR_DELIVERY: <Home size={16} className="text-purple-600" />,
    DELIVERED: <CheckCircle size={16} className="text-green-700" />,
  };

  const colorsByDB: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-orange-100 text-orange-700",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // Expecting data.orders as array; adapt if different
      const arr = Array.isArray(data.orders) ? data.orders : data;
      setOrders(
  arr.map((o: any) => ({
    ...o,
    status: String(o.status || "PENDING"),

    // ⭐ Ensure timestamps exist in UI
    createdAt: o.createdAt ?? null,
    confirmedAt: o.confirmedAt ?? null,
    shippedAt: o.shippedAt ?? null,
    outForDeliveryAt: o.outForDeliveryAt ?? null,
    deliveredAt: o.deliveredAt ?? null,
  }))
);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToggle]);

  const moveToNext = async (orderId: string, currentDbStatus: string) => {
    const next = NEXT_STATUS_DB[currentDbStatus];
    if (!next) return;
    // optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
    );
    const t = toast.loading("Updating...");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      toast.success("Status updated", { id: t });
      setRefreshToggle((v) => !v);
    } catch (err) {
      console.error(err);
      toast.error("Could not update", { id: t });
      setRefreshToggle((v) => !v);
    }
  };

  // Generic blob downloader
  const downloadBlob = async (res: Response, filename: string) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Download failed");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadLabel = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/orders/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, bw: true }),
      });
      await downloadBlob(res, `label-${orderId}.pdf`);
      toast.success("Label downloaded");
    } catch (err: any) {
      toast.error(err.message || "Label download failed");
    }
  };

  const downloadInvoice = async (order: Order) => {
    try {
      const address =
        typeof order.address === "object"
          ? `${order.address.doorNumber || ""}, ${order.address.street || ""}${
              order.address.landmark ? ", " + order.address.landmark : ""
            }, ${order.address.city || ""}, ${order.address.state || ""} - ${
              order.address.pincode || ""
            }`
          : order.address || "";

      const products = order.items.map((p) => ({
        name: p.name,
        brandName: p.brandName ?? "BSCFASHION",
        qty: p.quantity,
        price: p.price,
      }));

      const body = {
        orderId: order.id,
        userName: order.address?.name || order.user?.name || "Customer",
        phone: order.address?.phone || order.user?.phone || "",
        email: order.address?.email || order.user?.email || "",
        address,
        products,
        total: order.totalAmount,
        paymentMode: order.paymentMode,
        bw: false,
      };

      const res = await fetch("/api/orders/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await downloadBlob(res, `invoice-${order.id}.pdf`);
      toast.success("Invoice downloaded");
    } catch (err: any) {
      toast.error(err.message || "Invoice download failed");
    }
  };

  const filteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (statusFilter === "All") return true;
        const db = LABEL_TO_DB[statusFilter] ?? statusFilter;
        return o.status === db;
      })
      .filter((o) => {
        if (!s) return true;
        if (o.id?.toLowerCase?.().includes(s)) return true;
        if (o.user?.name?.toLowerCase?.().includes(s)) return true;
        if (o.user?.phone?.toLowerCase?.().includes(s)) return true;
        if (Array.isArray(o.items) && o.items.some((it) => (it.name ?? "").toLowerCase().includes(s)))
          return true;
        return false;
      })
      .slice(0, limit);
  }, [orders, search, statusFilter, limit]);

  const formatTS = (ts?: string | null) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const steps = [
    { key: "PENDING", label: "Order Placed", tsKey: "createdAt" },
    { key: "CONFIRMED", label: "Confirmed", tsKey: "confirmedAt" },
    { key: "SHIPPED", label: "Shipped", tsKey: "shippedAt" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", tsKey: "outForDeliveryAt" },
    { key: "DELIVERED", label: "Delivered", tsKey: "deliveredAt" },
  ];

  
 if (loading) {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
    </div>
  );
}


  return (
    <div className="p-6 space-y-6">
   <div className="flex items-center justify-between">
  <h1 className="text-3xl font-semibold">Orders</h1>

  {/* ✅ EXPORT CSV BUTTON */}
  <button
    onClick={() => window.open("/api/admin/orders/export")}
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
  >
    <FileDown size={16} />
    Export CSV
  </button>
</div>


      <div className="flex gap-3 items-center">
        <div className="flex items-center bg-white shadow border px-3 py-2 rounded-lg flex-1">
          <SearchIcon size={18} className="text-gray-500" />
          <input
            placeholder="Search by Order ID, Name, Phone, Product..."
            className="ml-3 w-full outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-white shadow border px-3 py-2 rounded-lg">
          <FilterIcon size={18} className="text-gray-500 mr-2" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {Object.values(DB_TO_LABEL).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.map((order) => {
          const dbStatus = order.status;
          const label = DB_TO_LABEL[dbStatus] ?? dbStatus;
          const statusColor = colorsByDB[dbStatus] ?? "bg-gray-100";
          const nextDb = NEXT_STATUS_DB[dbStatus];
const allPacked =
  Array.isArray(order.items) &&
  order.items.length > 0 &&
  order.items.every((it: any) => {
    // ✅ Our own products are considered packed by default
    if ((it.brandName ?? "").toUpperCase() === "BSCFASHION") {
      return true;
    }

    // ❗ Marketplace sellers must explicitly pack
    return it.packed === true;
  });


          // Determine completed index for timeline highlight
          const completedIndex = steps.findIndex((s) => {
            if (s.key === "PENDING") return true; // always
            // map tsKey -> actual value
            const val = (s.tsKey === "createdAt" ? order.createdAt : (order as any)[s.tsKey]);
            return Boolean(val);
          });

          return (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow border space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">
                    Order ID: <span className="text-gray-600">{order.id}</span>
                  </h2>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                    {label}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      downloadLabel(order.id);
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    <FileDown size={16} /> Label
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      downloadInvoice(order);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <FileDown size={16} /> Invoice
                  </button>
                </div>
              </div>

              

              {/* compact timeline */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {steps.map((s, idx) => {
  const timestampValue =
    s.tsKey === "createdAt"
      ? order.createdAt
      : (order as any)[s.tsKey];

  const isDone = timestampValue ? true : idx === 0;
  const isActive = dbStatus === s.key;

  return (
    <div key={s.key} className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            isDone ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {iconsByDB[s.key] || <span className="text-xs">•</span>}
        </div>

        <div className="min-w-0">
          <div
            className={`text-xs ${
              isActive ? "font-semibold text-gray-800" : "text-gray-500"
            }`}
          >
            {s.label}
          </div>

          {/* ⭐ NOW WE USE timestampValue HERE */}
          <div className="text-[11px] text-gray-400">
            {formatTS(timestampValue)}
          </div>
        </div>
      </div>

      {/* connector */}
      {idx < steps.length - 1 && (
        <div
          className={`h-[2px] mt-2 ${
            isDone ? "bg-green-500" : "bg-gray-200"
          }`}
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
})}

                </div>
              </div>
<div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700">
  <div className="flex justify-between">
    <div>
      <div className="font-medium">
        {order.address?.name ?? order.user?.name ?? "Customer"}
      </div>

      <div className="text-xs text-gray-500">
        {order.address?.phone ?? order.user?.phone ?? "-"}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        Payment: <b>{order.paymentMode ?? "-"}</b>
      </div>

      {/* ⭐ ADD THIS */}
 <div className="text-xs text-gray-600 mt-1 leading-5">
  <b>Address:</b><br />

  {/* Name */}
  {order.address?.name}

  {/* Type Badge */}
  {order.address?.type && (
    <span className="inline-block ml-2 text-[11px] bg-yellow-200 text-gray-800 px-2 py-0.5 rounded">
      {order.address.type}
    </span>
  )}
  <br />

  {/* Phone */}
  Phone: {order.address?.phone}<br />

  {/* Email */}
  {order.address?.email && (
    <>
      Email: {order.address.email}<br />
    </>
  )}

  {/* Address Line 1 */}
  {order.address?.doorNumber && `${order.address.doorNumber}, `}
  {order.address?.street && `${order.address.street}`}<br />

  {/* Address Line 2 */}
  {order.address?.landmark && `${order.address.landmark}, `}

  {/* City, State, Pin */}
  {order.address?.city}, {order.address?.state} - {order.address?.pincode}
</div>

</div>

    <div className="text-right text-sm">
      <div className="text-gray-500">Placed</div>
      <div className="font-medium">{formatTS(order.createdAt)}</div>
    </div>
  </div>
</div>

{/* Seller Packing Status */}
<div className="mt-2">
  {allPacked ? (
    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
      Packed by Seller
    </span>
  ) : (
    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
      Waiting for Seller to Pack
    </span>
  )}
</div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Products</h3>
                <div className="space-y-2">
                 {order.items?.map((it) => (
  <div
    key={it.id}
    className="flex justify-between border p-2 rounded-lg bg-gray-50 text-sm"
  >
    <div className="flex items-center gap-3">
      {/* Product Image with fallback */}
      <img
        src={
          it.image ||
          it.product?.images?.[0] ||
          "/no-image.png"
        }
        alt={it.name}
        className="w-14 h-14 object-cover rounded border bg-gray-100"
      />
        
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">
  {it.brandName ?? "BSCFASHION"}
</div>
        <div className="font-medium truncate" style={{ maxWidth: 200 }}>
          {it.name}
        </div>
        
        <div className="text-xs text-gray-500">
          Qty: {it.quantity ?? 1}
        </div>

        {it.size && (
          <div className="text-xs text-gray-500">
            Size: {it.size}
          </div>
        )}
        {it.color && (
  <div className="text-xs text-gray-500">
    Color: {it.color}
  </div>
)}
      </div>
    </div>

    <div className="font-semibold text-gray-700">₹{it.price ?? "-"}</div>
  </div>
))}


                </div>
               {(() => {
  const base = order.totalAmount ?? 0;
  const shipping = getShipping(base);
  const finalTotal = base + shipping;

  return (
    <p className="text-right text-sm font-semibold mt-2">
      Total: ₹{finalTotal}
    </p>
  );
})()}

              </div>

              {/* Move to next */}
              {nextDb && allPacked && (

                <div className="mt-2 flex justify-end">
                 {nextDb && (
  <button
    disabled={!allPacked}
    onClick={() => moveToNext(order.id, order.status)}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
      ${
        allPacked
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
  >
    Move to {DB_TO_LABEL[nextDb]}
    <ArrowRight size={14} />
  </button>
)}

                </div>
              )}
            </div>
          );
        })}

        {limit < orders.length && (
          <div className="text-center">
            <button onClick={() => setLimit((l) => l + 15)} className="mx-auto block mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black">
              Load More Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
