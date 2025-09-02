"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
  // ----------------------
  // Main product state
  // ----------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [baseMRP, setBaseMRP] = useState("");
  const [baseDiscount, setBaseDiscount] = useState("");
  const [baseStock, setBaseStock] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  // ----------------------
  // Variants state
  // ----------------------
  const [variants, setVariants] = useState<Variant[]>([]);

  // ----------------------
  // Loading & errors
  // ----------------------
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const productInputRef = useRef<HTMLInputElement>(null);

  const CATEGORIES = ["Men", "Women", "Kids", "Home", "Toys", "Western", "Groom", "Bridal", "Festive-kids", "Heritage sarees", "Jewellery"];
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE"];
  const COLORS: ColorOption[] = [
    { name: "Red", hex: "#EF4444" }, { name: "Pink", hex: "#EC4899" }, { name: "Rose", hex: "#FF007F" },
    { name: "Orange", hex: "#F97316" }, { name: "Peach", hex: "#FDBA74" }, { name: "Yellow", hex: "#F59E0B" },
    { name: "Lime", hex: "#84CC16" }, { name: "Green", hex: "#10B981" }, { name: "Teal", hex: "#0D9488" },
    { name: "Cyan", hex: "#06B6D4" }, { name: "Sky Blue", hex: "#0EA5E9" }, { name: "Blue", hex: "#3B82F6" },
    { name: "Indigo", hex: "#4F46E5" }, { name: "Violet", hex: "#7C3AED" }, { name: "Purple", hex: "#8B5CF6" },
    { name: "Magenta", hex: "#D946EF" }, { name: "Brown", hex: "#A0522D" }, { name: "Maroon", hex: "#800000" },
    { name: "Olive", hex: "#6B8E23" }, { name: "Grey", hex: "#6B7280" }, { name: "Silver", hex: "#C0C0C0" },
    { name: "Black", hex: "#111827" }, { name: "White", hex: "#F9FAFB" }, { name: "Beige", hex: "#F5F5DC" },
    { name: "Chocolate", hex: "#D2691E" }, { name: "Mint", hex: "#98FF98" }, { name: "Turquoise", hex: "#40E0D0" },
    { name: "Coral", hex: "#FF7F50" }, { name: "Salmon", hex: "#FA8072" }, { name: "Wine", hex: "#722F37" },
    { name: "Peacock Blue", hex: "#1B4F72" }, { name: "Mustard", hex: "#FFDB58" }, { name: "Khaki", hex: "#F0E68C" },
  ];

  // ----------------------
  // Handle main product images
  // ----------------------
  const handleProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setProductImages(prev => [...prev, ...files]);
    setProductPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setProductPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ----------------------
  // Handle variant images
  // ----------------------
  const handleVariantImage = (files: File[], variantIndex: number) => {
    const previews = files.map(f => URL.createObjectURL(f));
    setVariants(prev => {
      const copy = [...prev];
      copy[variantIndex].images = [...copy[variantIndex].images, ...files];
      copy[variantIndex].previews = [...copy[variantIndex].previews, ...previews];
      return copy;
    });
  };
  const removeVariantImage = (variantIndex: number, imgIndex: number) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[variantIndex].images = copy[variantIndex].images.filter((_, i) => i !== imgIndex);
      copy[variantIndex].previews = copy[variantIndex].previews.filter((_, i) => i !== imgIndex);
      return copy;
    });
  };

  // ----------------------
  // Add / Remove variant
  // ----------------------
  const addVariant = () => setVariants(prev => [...prev, { sizes: [], colors: [], design: "", price: "", mrp: "", discount: "", stock: "", images: [], previews: [] }]);
  const removeVariant = (idx: number) => setVariants(prev => prev.filter((_, i) => i !== idx));

  // ----------------------
  // Discount auto-calculation
  // ----------------------
  useEffect(() => {
    if (baseMRP && basePrice) {
      const mrpNum = Number(baseMRP);
      const priceNum = Number(basePrice);
      setBaseDiscount(mrpNum >= priceNum ? ((mrpNum - priceNum)/mrpNum*100).toFixed(0) : "");
    }
  }, [baseMRP, basePrice]);

  const calculateVariantDiscount = (index: number) => {
    const v = variants[index];
    if (v.mrp && v.price) {
      const mrpNum = Number(v.mrp);
      const priceNum = Number(v.price);
      setVariants(prev => {
        const copy = [...prev];
        copy[index].discount = (mrpNum >= priceNum ? ((mrpNum - priceNum)/mrpNum*100).toFixed(0) : "");
        return copy;
      });
    }
  };

  // ----------------------
  // Validation
  // ----------------------
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name required";
    if (!category) newErrors.category = "Category required";
    if (!sizes.length) newErrors.sizes = "Select at least one size";
    if (!colors.length) newErrors.colors = "Select at least one color";
    if (!basePrice || Number(basePrice)<=0) newErrors.basePrice = "Price must be >0";
    if (!baseMRP || Number(baseMRP)<=0) newErrors.baseMRP = "MRP must be >0";
    if (!baseStock || Number(baseStock)<0) newErrors.baseStock = "Stock >=0";
    if (!productImages.length) newErrors.productImages = "Add product images";
    if (!variants.length) newErrors.variants = "Add at least one variant";

    variants.forEach((v,i)=>{
      if (!v.sizes.length) newErrors[`variant-${i}-sizes`] = "Select size";
      if (!v.colors.length) newErrors[`variant-${i}-colors`] = "Select color";
      if (!v.price || Number(v.price)<=0) newErrors[`variant-${i}-price`] = "Price >0";
      if (!v.mrp || Number(v.mrp)<=0) newErrors[`variant-${i}-mrp`] = "MRP >0";
      if (!v.stock || Number(v.stock)<0) newErrors[`variant-${i}-stock`] = "Stock >=0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length===0;
  };

  // ----------------------
  // Submit handler
  // ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("colors", JSON.stringify(colors));
      formData.append("basePrice", basePrice);
      formData.append("baseMRP", baseMRP);
      formData.append("baseDiscount", baseDiscount);
      formData.append("baseStock", baseStock);
      productImages.forEach(img=>formData.append("images", img));

      variants.forEach((v, idx)=>{
        formData.append(`variants[${idx}]`, JSON.stringify({
          sizes: v.sizes,
          colors: v.colors,
          design: v.design,
          price: v.price,
          mrp: v.mrp,
          discount: v.discount,
          stock: v.stock
        }));
        v.images.forEach(img=>formData.append(`variants[${idx}][images][]`, img));
      });

      const res = await fetch("/api/products", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        toast.success("Product added successfully!");
        // reset
        setName(""); setDescription(""); setCategory("Men"); setSubCategory("");
        setSizes([]); setColors([]);
        setBasePrice(""); setBaseMRP(""); setBaseDiscount(""); setBaseStock("");
        setProductImages([]); setProductPreviews([]);
        setVariants([]); setErrors({});
      } else toast.error(data.message || "Failed to add product");

    } catch(err) {
      console.error(err);
      toast.error("Something went wrong while uploading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl font-bold">Add Product</h2>

        {/* Name / Category / SubCategory */}
        <input type="text" placeholder="Product Name" value={name} onChange={e=>setName(e.target.value)} className={`border p-2 rounded ${errors.name ? "border-red-500" : ""}`}/>
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        <select value={category} onChange={e=>setCategory(e.target.value)} className={`border p-2 rounded ${errors.category ? "border-red-500" : ""}`}>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>

        <input type="text" placeholder="Sub Category" value={subCategory} onChange={e=>setSubCategory(e.target.value)} className="border p-2 rounded"/>
        <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className="border p-2 rounded h-24 resize-none"/>

        {/* Sizes */}
        <select multiple value={sizes} onChange={e=>setSizes(Array.from(e.target.selectedOptions, opt=>opt.value))} className={`border p-2 rounded h-24 ${errors.sizes ? "border-red-500" : ""}`}>
          {SIZES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {errors.sizes && <p className="text-red-500 text-sm">{errors.sizes}</p>}

        {/* Colors */}
        <div className="flex gap-2 flex-wrap mt-2">
          {COLORS.map(c=>(
            <button key={c.name} type="button" title={c.name} style={{backgroundColor:c.hex}} className={`w-8 h-8 rounded-full border-2 ${colors.find(col=>col.name===c.name)?"border-black":"border-gray-300"}`} onClick={()=>{
              setColors(prev=>{
                const exists = prev.find(col=>col.name===c.name);
                if(exists) return prev.filter(col=>col.name!==c.name);
                return [...prev,c];
              })
            }}/>
          ))}
        </div>
        {errors.colors && <p className="text-red-500 text-sm">{errors.colors}</p>}

        {/* Price / MRP / Discount / Stock */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <input type="number" placeholder="Base MRP" value={baseMRP} onChange={e=>setBaseMRP(e.target.value)} className={`border p-2 rounded ${errors.baseMRP?"border-red-500":""}`}/>
          <input type="number" placeholder="Base Price" value={basePrice} onChange={e=>setBasePrice(e.target.value)} className={`border p-2 rounded ${errors.basePrice?"border-red-500":""}`}/>
          <input type="text" placeholder="Base Discount %" value={baseDiscount} readOnly className="border p-2 rounded bg-gray-100"/>
          <input type="number" placeholder="Base Stock" value={baseStock} onChange={e=>setBaseStock(e.target.value)} className={`border p-2 rounded ${errors.baseStock?"border-red-500":""}`}/>
        </div>

        {/* Product Images */}
        <div className={`border border-dashed p-4 rounded cursor-pointer flex flex-col items-center mt-2 ${errors.productImages?"border-red-500":""}`} onClick={()=>productInputRef.current?.click()}>
          Click or Drag & Drop Images
          <input type="file" accept="image/*" multiple ref={productInputRef} onChange={handleProductImages} className="hidden"/>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {productPreviews.map((src,i)=>(
            <div key={i} className="relative group">
              <img src={src} className="w-full h-32 object-cover rounded"/>
              <button type="button" onClick={()=>removeProductImage(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={16}/></button>
            </div>
          ))}
        </div>

        {/* Variants */}
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Variants</h3>
          {variants.map((v,idx)=>(
            <div key={idx} className="border p-4 rounded mb-4 relative">
              <button type="button" onClick={()=>removeVariant(idx)} className="absolute top-1 right-1 text-red-500 font-bold">X</button>

              {/* Variant Sizes */}
              <select multiple value={v.sizes} onChange={e=>{
                const newSizes = Array.from(e.target.selectedOptions, opt=>opt.value);
                setVariants(prev=>{ const copy=[...prev]; copy[idx].sizes=newSizes; return copy; });
              }} className="border p-2 rounded h-20 w-full mb-2">
                {SIZES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>

              {/* Variant Colors */}
              <div className="flex gap-2 flex-wrap mt-2 mb-2">
                {COLORS.map(c=>(
                  <button key={c.name} type="button" title={c.name} style={{backgroundColor:c.hex}} className={`w-8 h-8 rounded-full border-2 ${v.colors.find(col=>col.name===c.name)?"border-black":"border-gray-300"}`} onClick={()=>{
                    setVariants(prev=>{
                      const copy=[...prev];
                      const exists = copy[idx].colors.find(col=>col.name===c.name);
                      if(exists) copy[idx].colors = copy[idx].colors.filter(col=>col.name!==c.name);
                      else copy[idx].colors.push(c);
                      return copy;
                    })
                  }}/>
                ))}
              </div>

              {/* Design / Price / MRP / Discount / Stock */}
              <input type="text" placeholder="Design (optional)" value={v.design} onChange={e=>{ const val=e.target.value; setVariants(prev=>{ const copy=[...prev]; copy[idx].design=val; return copy; }); }} className="border p-2 rounded mb-2 w-full"/>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <input type="number" placeholder="MRP" value={v.mrp} onChange={e=>{ const val=e.target.value; setVariants(prev=>{ const copy=[...prev]; copy[idx].mrp=val; return copy; }); calculateVariantDiscount(idx); }} className="border p-2 rounded"/>
                <input type="number" placeholder="Price" value={v.price} onChange={e=>{ const val=e.target.value; setVariants(prev=>{ const copy=[...prev]; copy[idx].price=val; return copy; }); calculateVariantDiscount(idx); }} className="border p-2 rounded"/>
                <input type="text" placeholder="Discount %" value={v.discount} readOnly className="border p-2 rounded bg-gray-100"/>
                <input type="number" placeholder="Stock" value={v.stock} onChange={e=>{ const val=e.target.value; setVariants(prev=>{ const copy=[...prev]; copy[idx].stock=val; return copy; }); }} className="border p-2 rounded"/>
              </div>

              {/* Variant Images */}
              <div className="flex flex-col gap-2">
                <input type="file" multiple onChange={e=>{ if(!e.target.files) return; handleVariantImage(Array.from(e.target.files), idx); }} />
                <div className="grid grid-cols-3 gap-2">
                  {v.previews.map((src,i)=><div key={i} className="relative group"><img src={src} className="w-full h-24 object-cover rounded"/><button type="button" onClick={()=>removeVariantImage(idx,i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={16}/></button></div>)}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Add Variant</button>
        </div>

        <button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center">
          {loading && <Loader2 className="animate-spin mr-2 w-5 h-5"/>} {loading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
