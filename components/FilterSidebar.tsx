"use client";

export default function FilterSidebar() {
  return (
    <div className="sticky top-[96px] bg-white border rounded-lg p-4 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          FILTERS
        </h3>
        <button className="text-xs text-blue-600 hover:underline">
          CLEAR ALL
        </button>
      </div>

      {/* CATEGORY */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3">
          CATEGORY
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            Saree
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            Men
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            Kids
          </li>
        </ul>
      </div>

      <hr />

      {/* PRICE */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3">
          PRICE
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            Under ₹999
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            ₹1000 – ₹2999
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            ₹3000+
          </li>
        </ul>
      </div>

      <hr />

      {/* DISCOUNT */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3">
          DISCOUNT
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            10% & above
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            30% & above
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" />
            50% & above
          </li>
        </ul>
      </div>

    </div>
  );
}
