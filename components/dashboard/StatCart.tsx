import React from "react";

export function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`border rounded-xl p-5 flex items-center gap-4 ${color}`}>
      <div className="p-3 bg-white rounded-full shadow">{icon}</div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
