"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "blocked";
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null); // per-row loading

  const limit = 20; // 20 customers/page

  // Load customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(
          `/api/customers?page=${page}&limit=${limit}&sort=${sort}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setCustomers(data);
      } catch (error) {
        console.error("CUSTOMER FETCH ERROR:", error);
      }
    };

    fetchCustomers();
  }, [page, sort]);

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Block/Unblock handler
  const toggleBlock = async (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation(); // prevent row click navigation
    if (loadingId) return; // simple guard
    setLoadingId(c.id);

    const newBlockedValue = c.status === "active" ? true : false;

    // optimistic UI update
    setCustomers((prev) =>
      prev.map((u) => (u.id === c.id ? { ...u, status: newBlockedValue ? "blocked" : "active" } : u))
    );

    try {
      const res = await fetch("/api/customers/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, blocked: newBlockedValue }),
      });

      const json = await res.json();
      // if server returned success/status we can sync (safe-guard)
      if (json && json.status) {
        setCustomers((prev) => prev.map((u) => (u.id === c.id ? { ...u, status: json.status } : u)));
      }
    } catch (err) {
      console.error("Block/unblock failed:", err);
      // rollback optimistic update on failure
      setCustomers((prev) => prev.map((u) => (u.id === c.id ? { ...u, status: c.status } : u)));
    } finally {
      setLoadingId(null);
    }
  };
  

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-3xl font-semibold mb-6">Customers</h1>
      

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            className="border pl-10 pr-3 py-2 rounded-lg w-full bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sorting */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border px-3 py-2 rounded-lg bg-white"
        >
          <option value="newest">Newest</option>
          <option value="orders">Most Orders</option>
          <option value="spent">Highest Spent</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-left border-b">
              <th className="p-4">Customer</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Orders</th>
              <th className="p-4">Spent</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/admin/customers/${c.id}`)}
                className="border-b hover:bg-gray-50 cursor-pointer transition"
              >
                {/* Avatar + Name */}
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-200 text-yellow-900 flex items-center justify-center font-bold">
                    {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <span className="font-medium">{c.name || "No Name"}</span>
                </td>

                <td className="p-4">{c.email || "—"}</td>
                <td className="p-4">{c.phone || "—"}</td>
                <td className="p-4">{c.totalOrders}</td>

                <td className="p-4 font-semibold">₹{c.totalSpent}</td>

                {/* Status + Block/Unblock button */}
                <td className="p-4 flex items-center gap-3">
                  {c.status === "active" ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      Blocked
                    </span>
                  )}

                  <button
                    onClick={(e) => toggleBlock(e, c)}
                    disabled={loadingId === c.id}
                    className={`px-3 py-1 rounded text-sm ml-2 ${
                      c.status === "active"
                        ? "bg-red-500 text-white"
                        : "bg-emerald-500 text-white"
                    } ${loadingId === c.id ? "opacity-70 cursor-wait" : ""}`}
                  >
                    {loadingId === c.id ? "Please wait..." : c.status === "active" ? "Block" : "Unblock"}
                  </button>
                </td>
              </tr>
            ))}

            {/* If No Results */}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className={`px-4 py-2 rounded-lg border ${page === 1 ? "opacity-50 cursor-not-allowed" : "bg-white"}`}
        >
          Previous
        </button>

        <span className="font-medium">Page {page}</span>

        <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border bg-white">
          Next
        </button>
      </div>
    </div>
  );
}
