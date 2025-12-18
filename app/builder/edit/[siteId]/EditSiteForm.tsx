"use client";

import { useState } from "react";

export default function EditSiteForm({
  siteId,
  name: initialName,
  tagline: initialTagline,
}: {
  siteId: string;
  name: string;
  tagline: string;
}) {
  const [name, setName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    await fetch(`/api/sites/${siteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagline }),
    });

    setSaving(false);
    alert("Website updated successfully ✅");
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Edit Website</h1>

      <input
        className="w-full border p-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Website name"
      />

      <input
        className="w-full border p-2"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Tagline"
      />

      <p className="text-sm text-gray-500">
        Products load automatically with infinite scroll.
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
