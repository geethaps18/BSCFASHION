"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function EditSiteForm({ site }: { site: any }) {
  const [name, setName] = useState(site.name);
  const [tagline, setTagline] = useState(site.tagline || "");
  const [color, setColor] = useState(site.color || "#000000");
  const [limit, setLimit] = useState(
    site.section?.find((s: any) => s.type === "products")?.limit || 8
  );

  const handleSave = async () => {
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        tagline,
        color,
        limit,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Website updated");
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Site Name</label>
        <input
          className="border p-2 w-full rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tagline</label>
        <input
          className="border p-2 w-full rounded"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Theme Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Products to show
        </label>
        <select
          className="border p-2 rounded"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={12}>12</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );
}
