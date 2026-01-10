type SizeVariant = {
  size: string
  stock: number
}

export default function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
}: {
  sizes: SizeVariant[]
  selectedSize: string | null
  onSelect: (size: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {sizes.map((s) => {
        const outOfStock = s.stock === 0

        return (
          <button
            key={s.size}
            disabled={outOfStock}
            onClick={() => onSelect(s.size)}
            className={`relative h-10 border text-sm
              ${selectedSize === s.size ? "border-black" : "border-gray-300"}
              ${outOfStock ? "text-gray-400 cursor-not-allowed" : ""}
            `}
          >
            {s.size}

            {/* 🚫 Slash */}
            {outOfStock && (
              <span className="absolute inset-0">
                <span className="absolute left-1/2 top-0 h-full w-[1.5px] bg-gray-400 rotate-45 origin-top" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
