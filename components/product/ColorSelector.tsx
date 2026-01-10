type ColorVariant = {
  color: string
  hex: string
  stock: number
}

export default function ColorSelector({
  colors,
  selectedColor,
  onSelect,
}: {
  colors: ColorVariant[]
  selectedColor: string | null
  onSelect: (color: string) => void
}) {
  return (
    <div className="flex gap-3">
      {colors.map((c) => {
        const outOfStock = c.stock === 0

        return (
          <button
            key={c.color}
            disabled={outOfStock}
            onClick={() => onSelect(c.color)}
            className={`relative h-9 w-9 rounded-full border
              ${selectedColor === c.color ? "ring-2 ring-black" : ""}
              ${outOfStock ? "opacity-40 cursor-not-allowed" : ""}
            `}
            style={{ backgroundColor: c.hex }}
          >
            {/* 🚫 Slash overlay */}
            {outOfStock && (
              <span className="absolute inset-0 pointer-events-none">
                <span className="absolute left-1/2 top-0 h-full w-[1.5px] bg-black rotate-45 origin-top" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
