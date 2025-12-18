"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useSite } from "@/components/SiteContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

type AnalyticsResponse = {
  totals: {
    revenueRange: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    topCategory: string;
  };
  revenueSeries: { labels: string[]; values: number[] };
  categorySales: { labels: string[]; values: number[] };
};

const RANGE_PRESETS = [
  { key: "7", label: "Last 7 Days" },
  { key: "30", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
];

export default function BuilderAnalyticsPage() {
  const { siteId } = useSite(); // 🔥 REQUIRED
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [rangeKey, setRangeKey] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;

    setLoading(true);
    fetch(`/api/builder/analytics?siteId=${siteId}&range=${rangeKey}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [siteId, rangeKey]);

  const revenueChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.revenueSeries.labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: data.revenueSeries.values,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.15)",
          fill: true,
          tension: 0.4,
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
          data: data.categorySales.values,
          backgroundColor: ["#22c55e", "#3b82f6", "#f97316"],
        },
      ],
    };
  }, [data]);

if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-10 text-center">No data</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Store Analytics</h1>

        <select
          value={rangeKey}
          onChange={(e) => setRangeKey(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {RANGE_PRESETS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Revenue" value={`₹${data.totals.revenueRange}`} />
        <Stat title="Orders" value={data.totals.totalOrders} />
        <Stat title="Delivered" value={data.totals.deliveredOrders} />
        <Stat title="Top Category" value={data.totals.topCategory} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Revenue Trend">
          <Line data={revenueChart!} />
        </Card>

        <Card title="Category Sales">
          <Doughnut data={categoryChart!} />
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
