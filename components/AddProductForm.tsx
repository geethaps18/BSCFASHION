"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { categories, SubCategory } from "@/data/categories";

type ColorOption = { name: string; hex: string };
type Variant = {
  sizes: string[];
  colors: ColorOption[];
  design?: string;
  price: string;
  mrp: string;
  discount: string;
  stock: string;
  images: File[];
  previews: string[];
};

export default function AddProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SubCategory | null>(categories[0] || null);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [subSubCategory, setSubSubCategory] = useState<SubCategory | null>(null);

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");

  const [productImages, setProductImages] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const productInputRef = useRef<HTMLInputElement>(null);

  const STANDARD_SIZES = ["XS","S","M","L","XL","XXL","XXXL","FREE"];
  const KIDS_SIZES = ["0-3 Months","3-6 Months","6-9 Months","9-12 Months","1-2 Years","2-3 Years","3-4 Years","4-5 Years","5-6 Years","6-7 Years","7-8 Years","8-9 Years","9-10 Years"];
  const currentSizes = category?.name === "Kids" ? KIDS_SIZES : STANDARD_SIZES;

  const COLORS: ColorOption[] = [
    { name: "Red", hex: "#EF4444" }, { name: "Pink", hex: "#EC4899" },
    { name: "Orange", hex: "#F97316" }, { name: "Yellow", hex: "#F59E0B" },
    { name: "Green", hex: "#10B981" }, { name: "Blue", hex: "#3B82F6" },
    { name: "Black", hex: "#111827" }, { name: "White", hex: "#F9FAFB" }
  ];

  const calcDiscount = (mrpVal: string | number, priceVal: string | number) => {
    const m = Number(mrpVal), p = Number(priceVal);
    if (!m || !p || m <= 0 || p >= m) return "";
    return String(Math.round(((m - p) / m) * 100));
  };
  useEffect(() => setDiscount(calcDiscount(mrp, price)), [mrp, price]);

  const handleProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setProductImages(prev => [...prev, ...files]);
    setProductPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeProductImage = (i: number) => {
    setProductImages(prev => prev.filter((_, idx) => idx !== i));
    setProductPreviews(prev => prev.filter((_, idx) => idx !== i));
  };
  const handleVariantImage = (files: File[], idx: number) => {
    const previews = files.map(f => URL.createObjectURL(f));
    setVariants(prev => {
      const copy = [...prev];
      copy[idx].images = [...copy[idx].images, ...files];
      copy[idx].previews = [...copy[idx].previews, ...previews];
      return copy;
    });
  };
  const removeVariantImage = (vIdx: number, iIdx: number) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[vIdx].images = copy[vIdx].images.filter((_, i) => i !== iIdx);
      copy[vIdx].previews = copy[vIdx].previews.filter((_, i) => i !== iIdx);
      return copy;
    });
  };

  const addVariant = () => setVariants(prev => [...prev, { sizes: [], colors: [], design: "", price: "", mrp: "", discount: "", stock: "", images: [], previews: [] }]);
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name required";
    if (!category) newErrors.category = "Category required";
    if (!price || Number(price) <= 0) newErrors.price = "Price must be >0";
    if (!mrp || Number(mrp) <= 0) newErrors.mrp = "MRP must be >0";
    if (!stock || Number(stock) < 0) newErrors.stock = "Stock >=0";
    if (!productImages.length) newErrors.images = "Add product images";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);

      // --- Store category path globally ---
      const categoryPath = [category?.name, subCategory?.name, subSubCategory?.name].filter(Boolean);
      formData.append("categoryPath", JSON.stringify(categoryPath));

      formData.append("price", price);
      formData.append("mrp", mrp);
      formData.append("discount", discount);
      formData.append("stock", stock);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("colors", JSON.stringify(colors.map(c => c.name)));

      productImages.forEach(img => formData.append("images", img));
      formData.append("variants", JSON.stringify(variants.map(v => ({
        sizes: v.sizes,
        colors: v.colors.map(c => c.name),
        design: v.design,
        price: v.price,
        mrp: v.mrp,
        discount: v.discount,
        stock: v.stock
      }))));
      variants.forEach((v, idx) => v.images.forEach(img => formData.append(`variantImages-${idx}`, img)));

      const res = await fetch("/api/products", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Product added!");
        setName(""); setDescription(""); setCategory(categories[0] || null);
        setSubCategory(null); setSubSubCategory(null);
        setPrice(""); setMrp(""); setDiscount(""); setStock("");
        setProductImages([]); setProductPreviews([]); setVariants([]);
        setErrors({}); setSizes([]); setColors([]);
      } else toast.error(data.message || "Failed to add product");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded shadow">

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className={`border p-2 rounded ${errors.name ? "border-red-500" : ""}`} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="border p-2 rounded h-24 resize-none" />

        {/* Category */}
        <select value={category?.name} onChange={e => {
          const cat = categories.find(c => c.name === e.target.value) || null;
          setCategory(cat); setSubCategory(null); setSubSubCategory(null); setSizes([]);
        }} className={`border p-2 rounded ${errors.category ? "border-red-500" : ""}`}>
          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>

        {/* Subcategory */}
        <select value={subCategory?.name || ""} onChange={e => {
          const sub = category?.subCategories?.find(s => s.name === e.target.value) || null;
          setSubCategory(sub); setSubSubCategory(null);
        }} className="border p-2 rounded">
          <option value="">Select Subcategory</option>
          {category?.subCategories?.map(sub => <option key={sub.name} value={sub.name}>{sub.name}</option>)}
        </select>

        {/* Sub-Subcategory */}
        {subCategory?.subCategories && subCategory.subCategories.length > 0 && (
          <select value={subSubCategory?.name || ""} onChange={e => {
            const subSub = subCategory.subCategories?.find(s => s.name === e.target.value) || null;
            setSubSubCategory(subSub);
          }} className="border p-2 rounded">
            <option value="">Select Sub-Subcategory</option>
            {subCategory.subCategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        )}

        {/* Sizes */}
        <div>
          <h3 className="font-semibold mb-1">Sizes</h3>
          <div className="flex flex-wrap gap-2">
            {currentSizes.map(s => (
              <button key={s} type="button" onClick={() => setSizes(prev => prev.includes(s) ? prev.filter(size => size !== s) : [...prev, s])} className={`px-3 py-1 rounded-full border ${sizes.includes(s) ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300"}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <h3 className="font-semibold mb-1">Colors</h3>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button type="button" key={c.name} title={c.name} style={{ backgroundColor: c.hex }} className={`w-8 h-8 rounded-full border-2 ${colors.find(col => col.name === c.name) ? "border-black" : "border-gray-300"}`} onClick={() => {
                const exists = colors.find(col => col.name === c.name);
                setColors(prev => exists ? prev.filter(col => col.name !== c.name) : [...prev, c]);
              }} />
            ))}
          </div>
        </div>

        {/* Price / MRP / Stock */}
        <div className="grid grid-cols-4 gap-2">
          <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="MRP" className={`border p-2 rounded ${errors.mrp ? "border-red-500" : ""}`} />
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className={`border p-2 rounded ${errors.price ? "border-red-500" : ""}`} />
          <input value={discount} readOnly placeholder="Discount %" className="border p-2 rounded bg-gray-100" />
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" className={`border p-2 rounded ${errors.stock ? "border-red-500" : ""}`} />
        </div>

        {/* Product Images */}
        <div className={`border border-dashed p-4 rounded cursor-pointer ${errors.images ? "border-red-500" : ""}`} onClick={() => productInputRef.current?.click()}>
          Click or Drop Images
          <input type="file" multiple hidden ref={productInputRef} onChange={handleProductImages} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {productPreviews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} className="w-full h-32 object-cover rounded" />
              <button type="button" onClick={() => removeProductImage(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={16} /></button>
            </div>
          ))}
        </div>

        {/* Variants */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Variants</h3>
          {variants.map((v, idx) => (
            <div key={idx} className="border p-3 rounded mb-4 relative">
              <button type="button" onClick={() => removeVariant(idx)} className="absolute top-1 right-1 text-red-500">X</button>

              <input value={v.design} onChange={e => {
                const val = e.target.value;
                setVariants(prev => { const copy = [...prev]; copy[idx].design = val; return copy; });
              }} placeholder="Variant Design" className="border p-2 rounded mb-2 w-full" />

              {/* Variant Sizes */}
              <div className="flex flex-wrap gap-2 mb-2">
                {currentSizes.map((size) => {
                  const isSelected = variants[idx].sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setVariants(prev => {
                          const copy = [...prev];
                          const variant = { ...copy[idx] };
                          if (variant.sizes.includes(size)) {
                            variant.sizes = variant.sizes.filter(s => s !== size);
                          } else {
                            variant.sizes = [...variant.sizes, size];
                          }
                          copy[idx] = variant;
                          return copy;
                        })
                      }
                      className={`px-3 py-1 rounded-full border ${isSelected ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300"}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Variant Colors */}
              <div className="flex gap-2 flex-wrap mb-2">
                {COLORS.map(c => (
                  <button type="button" key={c.name} title={c.name} style={{ backgroundColor: c.hex }} className={`w-8 h-8 rounded-full border-2 ${v.colors.find(col => col.name === c.name) ? "border-black" : "border-gray-300"}`} onClick={() => {
                    const exists = v.colors.find(col => col.name === c.name);
                    setVariants(prev => { const copy = [...prev]; copy[idx].colors = exists ? copy[idx].colors.filter(col => col.name !== c.name) : [...copy[idx].colors, c]; return copy; });
                  }} />
                ))}
              </div>

              {/* Variant Price / MRP / Stock */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <input type="number" value={v.mrp} onChange={e => {
                  const val = e.target.value;
                  setVariants(prev => { const copy = [...prev]; copy[idx].mrp = val; copy[idx].discount = calcDiscount(val, copy[idx].price); return copy; });
                }} placeholder="MRP" className="border p-2 rounded" />
                <input type="number" value={v.price} onChange={e => {
                  const val = e.target.value;
                  setVariants(prev => { const copy = [...prev]; copy[idx].price = val; copy[idx].discount = calcDiscount(copy[idx].mrp, val); return copy; });
                }} placeholder="Price" className="border p-2 rounded" />
                <input value={v.discount} readOnly placeholder="Discount %" className="border p-2 rounded bg-gray-100" />
                <input type="number" value={v.stock} onChange={e => {
                  const val = e.target.value;
                  setVariants(prev => { const copy = [...prev]; copy[idx].stock = val; return copy; });
                }} placeholder="Stock" className="border p-2 rounded" />
              </div>

              <input type="file" multiple onChange={e => { if (!e.target.files) return; handleVariantImage(Array.from(e.target.files), idx); }} className="mb-2" />
              <div className="grid grid-cols-3 gap-2">
                {v.previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} className="w-full h-24 object-cover rounded" />
                    <button type="button" onClick={() => removeVariantImage(idx, i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="bg-green-600 text-white px-3 py-2 rounded">+ Add Variant</button>
        </div>

        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded mt-4 flex items-center justify-center gap-2">
          {loading && <Loader2 className="animate-spin" size={16} />}
          Add Product
        </button>
      </form>
    </div>
  );
}
