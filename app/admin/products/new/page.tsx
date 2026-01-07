"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { categories, SubCategory } from "@/data/categories";
import { COLOR_OPTIONS } from "@/data/colors";

/*
  Tailwind-UI style, tabbed Add Product form
  - Tabs: Basic, Media, Pricing, Inventory, Variants, Review
  - Uses FormData POST to /api/products
  - Image previews, drag & drop, variant management
*/

type ColorOption = { name: string; hex: string };
type Variant = {
  id: string;
  size?: string;
  color?: string;
  price: string;
  stock: string;
  images: File[];
  previews: string[];
};
type ProductFormMode = "add" | "edit";

type ProductFormProps = {
  mode: ProductFormMode;
  productId?: string;
};



export default function ProductFormTabbed({
  mode = "add",
  productId,
}: {
  mode?: "add" | "edit";
  productId?: string;
}) {

  const [activeTab, setActiveTab] = useState<number>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fit, setFit] = useState("");
const [fabricCare, setFabricCare] = useState("");
const [features, setFeatures] = useState("");

  const [category, setCategory] = useState<SubCategory | null>(categories[0] || null);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [subSubCategory, setSubSubCategory] = useState<SubCategory | null>(null);


const [selectedColors, setSelectedColors] =
  useState<ColorOption[]>(COLOR_OPTIONS);


  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");


  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Sizes + Colors constants
  const STANDARD_SIZES = ["XS","S","M","L","XL","XXL","FREE"];
  const KIDS_SIZES = ["0-3M","3-6M","6-9M","9-12M","1-2Y","2-3Y","3-4Y"];
  const currentSizes = category?.name === "Kids" ? KIDS_SIZES : STANDARD_SIZES;
  const [customColor, setCustomColor] = useState({
  name: "",
  hex: "#000000",
});



useEffect(() => {
  if (mode !== "edit" || !productId) return;

  (async () => {
    const res = await fetch(`/api/admin/products/${productId}`);
    const data = await res.json();

    setName(data.name ?? "");
    setDescription(data.description ?? "");
    setPrice(String(data.price ?? ""));
    setMrp(String(data.mrp ?? ""));
    setDiscount(String(data.discount ?? ""));

    setFit((data.fit ?? []).join("\n"));
    setFabricCare((data.fabricCare ?? []).join("\n"));
    setFeatures((data.features ?? []).join("\n"));

    // categoryPath → category / sub / subSub
    const [c, sc, ssc] = data.categoryPath || [];
    const cat = categories.find(x => x.name === c) || null;
    setCategory(cat);
    setSubCategory(cat?.subCategories?.find(x => x.name === sc) || null);
    setSubSubCategory(
      cat?.subCategories
        ?.find(x => x.name === sc)
        ?.subCategories?.find(x => x.name === ssc) || null
    );

    setProductPreviews(data.images || []);

    setVariants(
      (data.variants || []).map((v:any) => ({
        id: crypto.randomUUID(),
        size: v.size,
        color: v.color,
        price: String(v.price),
        stock: String(v.stock),
        images: [],
        previews: v.images || [],
      }))
    );
  })();
}, [mode, productId]);


  useEffect(() => {
    const d = calcDiscount(mrp, price);
    setDiscount(d);
  }, [mrp, price]);

  function calcDiscount(m: string, p: string) {
    const mm = Number(m); const pp = Number(p);
    if (!mm || !pp || mm <= 0 || pp >= mm) return "";
    return String(Math.round(((mm - pp) / mm) * 100));
  }

  // File handlers (product)
  function onFilesPicked(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setProductFiles(prev => [...prev, ...arr]);
    setProductPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
  }
  function removeProductImage(idx: number) {
    setProductFiles(prev => prev.filter((_, i) => i !== idx));
    setProductPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  // Variant helpers
function newVariant(): Variant {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    size: "",
    color: "",
    price: "",
    stock: "",
    images: [],
    previews: [],
  };
}

  function addVariant() { setVariants(v => [...v, newVariant()]); }
  function removeVariant(i:number) { setVariants(v => v.filter((_, idx) => idx !== i)); }
  function handleVariantFiles(files: FileList | null, idx:number) {
    if (!files) return;
    const arr = Array.from(files);
    setVariants(prev => {
      const copy = [...prev];
      copy[idx].images = [...copy[idx].images, ...arr];
      copy[idx].previews = [...copy[idx].previews, ...arr.map(a => URL.createObjectURL(a))];
      return copy;
    });
  }
  function removeVariantImage(vIdx:number, iIdx:number) {
    setVariants(prev => {
      const copy = [...prev];
      copy[vIdx].images = copy[vIdx].images.filter((_, i) => i !== iIdx);
      copy[vIdx].previews = copy[vIdx].previews.filter((_, i) => i !== iIdx);
      return copy;
    });
  }

  // Basic validation per tab
  function validateBasic() {
    const err: Record<string,string> = {};
    if (!name.trim()) err.name = "Product name required";
    setErrors(err);
    return Object.keys(err).length === 0;
  }
  function validateMedia() {
    const err: Record<string,string> = {};
    if (productFiles.length === 0) err.images = "Add at least one image";
    setErrors(err);
    return Object.keys(err).length === 0;
  }
  function validatePricing() {
    const err: Record<string,string> = {};
    if (!price || Number(price) <= 0) err.price = "Valid price required";
    if (!mrp || Number(mrp) <= 0) err.mrp = "Valid MRP required";
    setErrors(err);
    return Object.keys(err).length === 0;
  }


  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (selectedColors.length === 0) {
  toast.error("Add at least one color");
  return;
}

for (const v of variants) {
  if (!v.size || !v.color || v.stock === "") {
    toast.error("Each size must have color and stock");
    return;
  }
}
// ✅ Auto-assign color if only one color exists
if (selectedColors.length === 1) {
  const onlyColor = selectedColors[0].name;

  setVariants(prev =>
    prev.map(v => ({
      ...v,
      color: v.color || onlyColor,
    }))
  );
}
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "product");

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.media; // { id, url, publicId }
};


    // final validation
    if (!validateBasic() || !validateMedia() || !validatePricing() ) { toast.error("Fix errors"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("description", description);
      const catPath = [category?.name, subCategory?.name, subSubCategory?.name].filter(Boolean);
      form.append("categoryPath", JSON.stringify(catPath));
      form.append("price", String(price));
      form.append("mrp", String(mrp));
      form.append("discount", String(discount));
     
   form.append(
  "variants",
  JSON.stringify(
    variants.map(v => ({
      size: v.size,
      color: v.color,   // ✅ THIS WAS MISSING
      price: Number(v.price),
      stock: Number(v.stock),
    }))
  )
);

variants.forEach((v, i) => {
  v.images.forEach(file => {
    form.append(`variantImages_${i}`, file);
  });
});

      
      form.append(
  "fit",
  JSON.stringify(
    fit.split("\n").map(v => v.trim()).filter(Boolean)
  )
);

form.append(
  "fabricCare",
  JSON.stringify(
    fabricCare.split("\n").map(v => v.trim()).filter(Boolean)
  )
);

form.append(
  "features",
  JSON.stringify(
    features.split("\n").map(v => v.trim()).filter(Boolean)
  )
);

      productFiles.forEach(f => form.append("images", f));
      

      const url =
  mode === "edit"
    ? `/api/admin/products/${productId}`
    : `/api/products`;

const method = mode === "edit" ? "PUT" : "POST";

const res = await fetch(url, {
  method,
  body: form,
});

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed');
      toast.success(
  mode === "add" ? "Product added" : "Product updated"
);

      // reset
      setName(''); setDescription(''); setCategory(categories[0] || null); setSubCategory(null); setSubSubCategory(null);
    
      setProductFiles([]); setProductPreviews([]); setVariants([]);
      setActiveTab(0);
    } catch (err:any) {
      console.error(err);
      toast.error(err.message || 'Server error');
    } finally { setLoading(false); }
  }

const Tabs = ["Basic","Media","Pricing","Variants","Review"];


  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Add Product</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab(t => Math.max(0, t-1))} className="p-2 rounded border hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <button onClick={() => setActiveTab(t => Math.min(Tabs.length-1, t+1))} className="p-2 rounded border hover:bg-gray-50"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {/* Tab list */}
        <div className="border-b">
          <nav className="-mb-px flex" aria-label="Tabs">
            {Tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-medium -mb-px ${activeTab===i ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic */}
          {activeTab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium">Product Name</span>
                  <input value={name} onChange={e=>setName(e.target.value)} className={`mt-1 block w-full rounded border px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-200'}`} />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Description</span>
                  <textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2 h-36" />
                </label>
                <label className="block">
  <span className="text-sm font-medium">Fit (one point per line)</span>
  <textarea
    value={fit}
    onChange={(e) => setFit(e.target.value)}
    className="mt-1 block w-full rounded border px-3 py-2 h-24"
    placeholder="Relaxed fit from chest through bottom
Model is 6'2 wearing size L"
  />
</label>

<label className="block">
  <span className="text-sm font-medium">Fabric & Care (one point per line)</span>
  <textarea
    value={fabricCare}
    onChange={(e) => setFabricCare(e.target.value)}
    className="mt-1 block w-full rounded border px-3 py-2 h-24"
    placeholder="66% Organic Cotton, 34% Polyester
Machine wash cold
Do not bleach"
  />
</label>

<label className="block">
  <span className="text-sm font-medium">Product Features (one point per line)</span>
  <textarea
    value={features}
    onChange={(e) => setFeatures(e.target.value)}
    className="mt-1 block w-full rounded border px-3 py-2 h-24"
    placeholder="4-way stretch
Breathable fabric
Soft brushed interior"
  />
</label>


                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select value={category?.name} onChange={e=>{ const c = categories.find(c=>c.name===e.target.value) || null; setCategory(c); setSubCategory(null); setSubSubCategory(null); }} className="mt-1 block w-full rounded border px-3 py-2">
                      {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Subcategory</label>
                    <select value={subCategory?.name||''} onChange={e=>{ const s = category?.subCategories?.find(s=>s.name===e.target.value) || null; setSubCategory(s); setSubSubCategory(null); }} className="mt-1 block w-full rounded border px-3 py-2">
                      <option value="">Select</option>
                      {category?.subCategories?.map(s=> <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Sub-Sub</label>
                    <select value={subSubCategory?.name||''} onChange={e=>{ const ss = subCategory?.subCategories?.find(s=>s.name===e.target.value)||null; setSubSubCategory(ss); }} className="mt-1 block w-full rounded border px-3 py-2">
                      <option value="">Select</option>
                      {subCategory?.subCategories?.map(s=> <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

              </div>

              <aside className="p-4 border rounded bg-gray-50">
                <p className="text-sm text-gray-600">Quick help</p>
                <ul className="mt-2 text-sm space-y-1">
                  <li>- Use a descriptive name</li>
                  <li>- Add main image in Media tab</li>
                  <li>- Fill price & stock</li>
                </ul>
              </aside>
            </div>
          )}

          {/* Media */}
          {activeTab === 1 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Upload Product Images</h3>
                <div className="text-sm text-gray-500">Drag & drop or click</div>
              </div>

              <div onClick={()=>fileRef.current?.click()} className={`relative border-2 border-dashed rounded p-6 text-center cursor-pointer ${errors.images ? 'border-red-400' : 'border-gray-200'}`}>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e=>onFilesPicked(e.target.files)} />
                <p className="text-sm text-gray-600">Click here to select images or drag files</p>
                <p className="text-xs text-gray-400 mt-2">Recommended: 1000×1000px, JPG/PNG</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {productPreviews.map((src, i) => (
                  <div key={i} className="relative group rounded overflow-hidden border">
                    <img src={src} alt={`preview-${i}`} className="w-full h-40 object-cover" />
                    <button type="button" onClick={()=>removeProductImage(i)} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={16} /></button>
                  </div>
                ))}
                {productPreviews.length === 0 && (<div className="col-span-full text-center text-gray-500 py-6">No images added</div>)}
              </div>

              {errors.images && <p className="text-sm text-red-600 mt-2">{errors.images}</p>}
            </div>
          )}

          {/* Pricing */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">MRP</label>
                <input type="number" value={mrp} onChange={e=>setMrp(e.target.value)} className={`mt-1 block w-full rounded border px-3 py-2 ${errors.mrp ? 'border-red-500' : 'border-gray-200'}`} />
                {errors.mrp && <p className="text-sm text-red-600">{errors.mrp}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Price</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className={`mt-1 block w-full rounded border px-3 py-2 ${errors.price ? 'border-red-500' : 'border-gray-200'}`} />
                {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Discount</label>
                <input value={discount} readOnly className="mt-1 block w-full rounded border px-3 py-2 bg-gray-50" />
              </div>

              
            </div>
          )}

      

          {/* Variants */}
         {activeTab === 3 && (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">Variants</h3>
      <button
  type="button"
  onClick={addVariant}
  className="flex items-center gap-2 px-3 py-2 rounded bg-black text-white"
>
  <Plus size={16} />
  Add Variant
</button>
    </div>




          <div className="border rounded p-3 space-y-2">
  <p className="text-sm font-medium">Add Custom Color</p>

  <input
    placeholder="Color name (e.g. Wine Red)"
    value={customColor.name}
    onChange={(e) =>
      setCustomColor({ ...customColor, name: e.target.value })
    }
    className="border px-3 py-2 w-full"
  />

  <input
    type="color"
    value={customColor.hex}
    onChange={(e) =>
      setCustomColor({ ...customColor, hex: e.target.value })
    }
    className="w-16 h-10"
  />
  

 <button
  type="button"
  onClick={() => {
    if (!customColor.name) return;

    if (selectedColors.some(c => c.name === customColor.name)) {
      toast.error("Color already added");
      return;
    }

    setSelectedColors(prev => [...prev, customColor]);
    setCustomColor({ name: "", hex: "#000000" });
  }}
  className="px-3 py-1 bg-black text-white rounded"
>
  Add Color
</button>

</div>



    <div className="space-y-4">
      {variants.map((v, idx) => (
        <div key={v.id} className="border rounded p-3 space-y-3">
          <div className="flex justify-between">
            <strong>Variant #{idx + 1}</strong>
          
          </div>

         <select
  value={v.size}
  onChange={(e) => {
    const copy = [...variants];
    copy[idx].size = e.target.value;
    setVariants(copy);
  }}
  className="border rounded px-3 py-2 w-full"
>
  <option value="">Select Size</option>
  {currentSizes.map((size) => (
    <option key={size} value={size}>
      {size}
    </option>
  ))}
</select>

 <select
  value={v.color}
  onChange={(e) => {
    const copy = [...variants];
    copy[idx].color = e.target.value;
    setVariants(copy);
  }}
  className="border rounded px-3 py-2 w-full"
>
  <option value="">Select Color</option>

  {selectedColors.map((c) => (
    <option key={c.name} value={c.name}>
      {c.name}
    </option>
  ))}
</select>


          <input
            placeholder="Variant Price"
            value={v.price}
            onChange={(e) => {
              const copy = [...variants];
              copy[idx].price = e.target.value;
              setVariants(copy);
            }}
            className="border rounded px-3 py-2 w-full"
          />

          <input
            placeholder="Variant Stock"
            value={v.stock}
            onChange={(e) => {
              const copy = [...variants];
              copy[idx].stock = e.target.value;
              setVariants(copy);
            }}
            className="border rounded px-3 py-2 w-full"
          />

          <input
            type="file"
            multiple
            onChange={(e) => handleVariantFiles(e.target.files, idx)}
          />

          <div className="grid grid-cols-4 gap-2">
            {v.previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} className="h-24 w-full object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeVariantImage(idx, i)}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {variants.length === 0 && (
        <p className="text-gray-500 text-sm">No variants added yet.</p>
      )}
    </div>
  </div>
)}



          {/* Review */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <div className="border rounded p-4 bg-gray-50">
                <p><strong>Name:</strong> {name || '—'}</p>
                <p><strong>Category:</strong> {category?.name || '—'}</p>
                <p><strong>Price:</strong> ₹{price || '—'}</p>
             
                <p><strong>Images:</strong> {productPreviews.length} files</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={()=>setActiveTab( (t) => Math.max(0, t-1) )} className="px-4 py-2 rounded border">Back</button>
                <button type="button" onClick={()=>handleSubmit()} disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white flex items-center gap-2">
                  {loading && <Loader2 className="animate-spin" size={16} />} Submit Product
                </button>
              </div>
            </div>
          )}

          {/* footer nav */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Step {activeTab+1} / {Tabs.length}</div>
            <div className="flex items-center gap-2">
              {activeTab > 0 && <button type="button" onClick={()=>setActiveTab(t=>t-1)} className="px-3 py-2 rounded border">Previous</button>}
              {activeTab < Tabs.length-1 && <button type="button" onClick={()=>{
                // try validate current tab before moving forward
                let ok = true;
                if (activeTab === 0) ok = validateBasic();
                if (activeTab === 1) ok = validateMedia();
                if (activeTab === 2) ok = validatePricing();
               
                if (ok) setActiveTab(t=>t+1);
                else toast.error('Fix errors before continuing');
              }} className="px-3 py-2 rounded bg-indigo-600 text-white">Next</button>}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
