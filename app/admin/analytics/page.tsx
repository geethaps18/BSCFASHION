"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

/* ---------------- Types ---------------- */
type AnalyticsResponse = {
  totals: {
    revenueToday: number;
    revenueRange: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    newCustomersInRange: number;
    topCategory: string;
  };
  revenueSeries: { labels: string[]; values: number[] }; // last N days
  categorySales: { labels: string[]; values: number[] };
  customerGrowth: { labels: string[]; values: number[] }; // new customers per day
  bestProducts: { name: string; sold: number; revenue: number }[];
};

const RANGE_PRESETS = [
  { key: "today", label: "Today", days: 1 },
  { key: "7", label: "Last 7 Days", days: 7 },
  { key: "30", label: "Last 30 Days", days: 30 },
  { key: "month", label: "This Month", days: null },
  { key: "custom", label: "Custom" },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [rangeKey, setRangeKey] = useState<string>("30");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (opts?: { start?: string; end?: string; range?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (opts?.range) qs.set("range", opts.range);
      if (opts?.start) qs.set("start", opts.start);
      if (opts?.end) qs.set("end", opts.end);

      const res = await fetch(`/api/admin/analytics?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json: AnalyticsResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fetch error");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchAnalytics({ range: rangeKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle preset change
  useEffect(() => {
    if (rangeKey === "custom") return;
    setCustomStart("");
    setCustomEnd("");
    fetchAnalytics({ range: rangeKey });
  }, [rangeKey]);

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return setError("Select both start and end dates.");
    fetchAnalytics({ start: customStart, end: customEnd });
  };

  // Chart datasets
  const revenueChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.revenueSeries.labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: data.revenueSeries.values,
          fill: true,
          tension: 0.35,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.12)",
        },
      ],
    };
  }, [data]);

  const categoryChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.categorySales.labels,
      datasets: [
        {
          label: "Sales",
          data: data.categorySales.values,
          backgroundColor: ["#f97316", "#10b981", "#3b82f6", "#ef4444", "#a78bfa", "#f973b1"],
        },
      ],
    };
  }, [data]);

  const customersChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.customerGrowth.labels,
      datasets: [
        {
          label: "New Customers",
          data: data.customerGrowth.values,
          backgroundColor: "#06b6d4",
        },
      ],
    };
  }, [data]);

  // Exports
  const exportCSV = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Date,Revenue,NewCustomers");
    for (let i = 0; i < data.revenueSeries.labels.length; i++) {
      const date = data.revenueSeries.labels[i];
      const revenue = data.revenueSeries.values[i] ?? 0;
      const customers = data.customerGrowth.values[i] ?? 0;
      rows.push(`${date},${revenue},${customers}`);
    }
    // add categories
    rows.push("");
    rows.push("Category,Sales");
    data.categorySales.labels.forEach((lbl, idx) => {
      rows.push(`${lbl},${data.categorySales.values[idx] ?? 0}`);
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("BSCFASHION - Analytics Report", 10, 14);
    doc.setFontSize(11);
    doc.text(`Range: ${rangeKey === "custom" ? `${customStart} → ${customEnd}` : rangeKey}`, 10, 22);

    // small table: totals
    let y = 32;
    doc.setFontSize(10);
    const totals = data.totals;
    doc.text(`Revenue (range): ₹${totals.revenueRange}`, 10, y);
    doc.text(`Total Orders: ${totals.totalOrders}`, 70, y);
    doc.text(`Delivered: ${totals.deliveredOrders}`, 130, y);
    doc.text(`Pending: ${totals.pendingOrders}`, 190, y);
    doc.text(`New Customers: ${totals.newCustomersInRange}`, 260, y);

    y += 8;
    doc.setFontSize(12);
    doc.text("Top Selling Products", 10, y);
    y += 6;
    doc.setFontSize(10);
    data.bestProducts.slice(0, 10).forEach((p, i) => {
      doc.text(`${i+1}. ${p.name} — Sold: ${p.sold} • Revenue: ₹${p.revenue}`, 10, y);
      y += 6;
      if (y > 180) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`analytics-report-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Basic AI insights (simple heuristics)
  const insights = useMemo(() => {
    if (!data) return [];
    const items: string[] = [];
    const { revenueToday, revenueRange, totalOrders, deliveredOrders, pendingOrders, totalCustomers } = data.totals;

    if (revenueToday > 0) items.push(`Revenue today is ₹${revenueToday.toLocaleString()}.`);
    else items.push("No revenue recorded today.");

    // growth heuristic
    const recent = data.revenueSeries.values.slice(-7);
    const weekAvg = recent.reduce((s, v) => s + v, 0) / Math.max(1, recent.length);
    if (weekAvg > 0) {
      items.push(`7-day average revenue ~ ₹${Math.round(weekAvg).toLocaleString()}.`);
    }

    const deliveredPct = totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    items.push(`${deliveredPct}% of orders in the range are delivered.`);

    if (data.categorySales.values.length) {
      const idx = data.categorySales.values.indexOf(Math.max(...data.categorySales.values));
      items.push(`Top category: ${data.categorySales.labels[idx] || data.totals.topCategory}.`);
    }

    items.push(`New customers in range: ${data.totals.newCustomersInRange}.`);

    return items;
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of revenue, categories and customer growth</p>
        </div>

        <div className="flex gap-2">
          <select
            className="border px-3 py-2 rounded"
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value)}
          >
            {RANGE_PRESETS.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>

          {rangeKey === "custom" && (
            <>
              <input value={customStart} onChange={(e) => setCustomStart(e.target.value)} type="date" className="border px-3 py-2 rounded" />
              <input value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} type="date" className="border px-3 py-2 rounded" />
              <button onClick={applyCustomRange} className="bg-blue-600 text-white px-4 py-2 rounded">Apply</button>
            </>
          )}

          <button onClick={exportCSV} className="bg-gray-800 text-white px-4 py-2 rounded">Export CSV</button>
          <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
        </div>
      </div>

     {loading && (
  <div className="flex justify-center items-center py-10">
    <div className="h-10 w-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
  </div>
)}

      {error && <div className="text-red-600">{error}</div>}
      {!loading && data && (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card title="Revenue (range)" value={`₹${data.totals.revenueRange}`} />
            <Card title="Revenue Today" value={`₹${data.totals.revenueToday}`} />
            <Card title="Total Orders" value={data.totals.totalOrders} />
            <Card title="Delivered Orders" value={data.totals.deliveredOrders} />
            <Card title="Pending Orders" value={data.totals.pendingOrders} />
            <Card title="Total Customers" value={data.totals.totalCustomers} />
            <Card title="New Customers" value={data.totals.newCustomersInRange} />
            <Card title="Top Category" value={data.totals.topCategory} />
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="text-lg font-semibold mb-3">Revenue - last period</h2>
              {revenueChart && <Line data={revenueChart} options={{ animation: { duration: 700 } }} />}
            </div>

            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="text-lg font-semibold mb-3">Category Sales</h2>
              {categoryChart && <Doughnut data={categoryChart} options={{ animation: { duration: 700 } }} />}
            </div>

            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="text-lg font-semibold mb-3">Customer Growth</h2>
              {customersChart && <Bar data={customersChart} options={{ animation: { duration: 700 } }} />}
            </div>

            
         

          {/* AI insights */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold">Insights</h3>
            <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
              {insights.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          </div>
          
        </>
        
      )}
    </div>
    
  );
}

/* ---------- small components ---------- */

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl shadow bg-white border">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
