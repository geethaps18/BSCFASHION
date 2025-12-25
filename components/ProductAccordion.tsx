"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface Props {
  title: string;
  items?: string[];
  content?: string;
}

export default function ProductAccordion({
  title,
  items = [],
  content,
}: Props) {
  // 🔥 Vuori behavior
  const [open, setOpen] = useState(title === "Product Description");

  const hasContent = (items && items.length > 0) || content;
  if (!hasContent) return null;

  return (
    <div className="py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900 tracking-wide">
          {title}
        </h3>

        {open ? (
          <Minus className="h-4 w-4 text-gray-700" />
        ) : (
          <Plus className="h-4 w-4 text-gray-700" />
        )}
      </button>

      {open && (
        <div className="mt-3 text-sm text-gray-600 space-y-2">
          {content && (
            <p className="whitespace-pre-line leading-relaxed">
              {content}
            </p>
          )}

          {items.map((item, idx) => (
            <p key={idx}>• {item}</p>
          ))}
        </div>
      )}
    </div>
  );
}
