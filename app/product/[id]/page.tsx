"use client";


import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Scrollbar, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import "swiper/css/navigation";
import { ShoppingBag, Heart, Share2 } from "lucide-react";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/BagContext";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Product as ProductType } from "@/types/product";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import LoadingRing from "@/components/LoadingRing";
import Link from "next/link";
import ProductAccordion from "@/components/ProductAccordion";
import { COLOR_OPTIONS } from "@/data/colors";
import { Zoom } from "swiper/modules";
import "swiper/css/zoom";


const productCache = new Map<string, ProductWithReviews>();


/** --------------------------
 * ZoomImage component (click to zoom + move-to-pan)
 * --------------------------- */
function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const MIN = 1;
  const MAX = 2;
  const [zoom, setZoom] = useState<number>(MIN);
  const [bgPos, setBgPos] = useState<string>("center");

  const toggleZoom = () => {
    setZoom((prev) => (prev === MIN ? MAX : MIN));
    if (zoom !== MIN) setBgPos("center");
  };

  const setPos = (x: number, y: number, el: HTMLDivElement) => {
    if (zoom === MIN) return;
    const rect = el.getBoundingClientRect();
    const rx = ((x - rect.left) / rect.width) * 100;
    const ry = ((y - rect.top) / rect.height) * 100;
    setBgPos(`${rx}% ${ry}%`);
  };

  return (
    <div className="relative w-full ">
      <div
        onClick={toggleZoom}
        onMouseMove={(e) => setPos(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) =>
        
        setPos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)

        }
        className={`w-full aspect-[3/4] select-none  ${
          zoom === MIN ? "cursor-zoom-in" : "cursor-move"
        }`}
       style={{
  backgroundImage: `url(${src})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: zoom === MIN ? "center" : bgPos,
  backgroundSize: zoom === MIN ? "cover" : `${zoom * 140}%`,
}}

      >
        {/* Invisible Image keeps layout/resolution stable for Next/Image optimization */}
        <Image src={src} alt={alt} fill className="opacity-0" draggable={false} />
      </div>
    </div>
  );
}
type GalleryItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string };


/** ---- Types ---- */
interface Review {
  id: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt?: string;
  // Prisma include gives user.name; or your API may return userName
  user?: { name?: string | null } | string | null;
  userName?: string | null;
}

type ProductWithReviews = {
  id: string;
  name: string;
  description: string;

  brandName?: string;
  category?: string;

  images: string[];
  video?: string | null;

  price: number;
  mrp?: number | null;
  discount?: number | null;

  stock?: number;

  rating?: number;
  reviewCount?: number;

  sizes: string[];

 variants: {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  stock?: number;
  images?: string[];
}[];


  reviews?: Review[];

  fit?: string[];
  fabricCare?: string[];
  features?: string[];
};

export default function ProductDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;


  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();


 const [product, setProduct] = useState<ProductWithReviews | null>(() => {
  if (id && productCache.has(id)) {
    return productCache.get(id)!;
  }
  return null;
});

  const [similarProducts, setSimilarProducts] = useState<ProductType[]>([]);
  const [networkError, setNetworkError] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
 const variants = React.useMemo(
  () => product?.variants ?? [],
  [product]
);

  
  // Gallery modal state for Real Images fullscreen slider
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(true);
  const visibleSimilarProducts = similarProducts.slice(0, 8);
const infoRef = useRef<HTMLDivElement | null>(null);
const [showStickyDesktopBar, setShowStickyDesktopBar] = useState(false);
const [selectedVariant, setSelectedVariant] = useState<{
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  stock?: number;
  images?: string[];
} | null>(null);
// ✅ Effective price (variant overrides base)
const effectivePrice =
  selectedVariant?.price ?? product?.price ?? 0;


const [activeIndex, setActiveIndex] = useState(0);

const getColorHex = (name: string) =>
  COLOR_OPTIONS.find(c => c.name === name)?.hex ?? "#ccc";



useEffect(() => {
  if (!selectedColor || !variants.length) return;

  // If size already selected → match BOTH
  if (selectedSize) {
    const v = variants.find(
      v =>
        v.color === selectedColor &&
        v.size === selectedSize &&
        (v.stock ?? 0) > 0
    );
    if (v) {
      setSelectedVariant(v);
      return;
    }
  }

  // Otherwise fallback → first available variant of that color
  const fallback = variants.find(
    v => v.color === selectedColor && (v.stock ?? 0) > 0
  );
  if (fallback) {
    setSelectedVariant(fallback);
  }
}, [selectedColor, selectedSize, variants]);



useEffect(() => {
  if (product) {
    console.log("VIDEO URL 👉", product.video);
  }
}, [product]);


useEffect(() => {
  if (!product?.category) return;

  const loadSimilar = async () => {
    try {
      const res = await fetch(
        `/api/products?category=${encodeURIComponent(product.category)}&limit=8`
      );
      if (!res.ok) return;

      const data = await res.json();

      // ❗ exclude current product
      const filtered = data.products.filter(
        (p: ProductType) => p.id !== product.id
      );

      setSimilarProducts(filtered);
    } catch (err) {
      console.error("Failed to load similar products", err);
    }
  };

  loadSimilar();
}, [product]);

  // ---------------- FETCH PRODUCT ----------------

  // 🛑 Prevent scroll resetting when coming back
useEffect(() => {
  window.history.scrollRestoration = "manual";
}, []);
// Auto-select One Size if product has no sizes
useEffect(() => {
  if (product && (!product.sizes || product.sizes.length === 0)) {
    setSelectedSize("One Size");
  }
}, [product]);

useEffect(() => {
  window.scrollTo({ top: 0, behavior: "instant" });
}, [id]);
useEffect(() => {
  const handleScroll = () => {
    if (!infoRef.current) return;

    const rect = infoRef.current.getBoundingClientRect();

    // when product info scrolls out of view
    setShowStickyDesktopBar(rect.bottom < 0);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);




 useEffect(() => {
  if (!id) return;

  if (productCache.has(id)) {
    return; // already set from initial state
  }

  const load = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) return;

      const data = (await res.json()) as ProductWithReviews;

      const finalProduct = {
        ...data,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        rating: data.rating ?? 0,
        reviewCount: data.reviewCount ?? 0,
      };

      productCache.set(id, finalProduct);
      setProduct(finalProduct);
    } catch (err) {
      console.error(err);
    }
  };

  load();
}, [id]);


  
useEffect(() => {
  if (!product) return;

  const saved = sessionStorage.getItem(`pdp-${product.id}`);
  if (!saved) return;

  try {
    const { color, size, variantId } = JSON.parse(saved);

    if (color) setSelectedColor(color);
    if (size) setSelectedSize(size);

    if (variantId) {
      const v = product.variants.find(v => v.id === variantId);
      if (v) setSelectedVariant(v);
    }
  } catch {}
}, [product]);




// ✅ useMemo MUST be here (before any return)
// ---------------- Derived / Safe data ----------------
const cleanImages = (arr?: string[]) =>
  (arr ?? []).filter(
    (img) => typeof img === "string" && img.trim().length > 0
  );
const imagesBySelectedColor = React.useMemo(() => {
  if (!selectedColor) return [];

  return variants
    .filter(v => v.color === selectedColor)
    .flatMap(v => v.images ?? []);
}, [selectedColor, variants]);

// ✅ MOVE THIS UP — BEFORE ANY RETURN
const galleryItems = React.useMemo<GalleryItem[]>(() => {
  if (!product) return [];

 const images =
  selectedVariant && cleanImages(selectedVariant.images).length > 0
    ? cleanImages(selectedVariant.images)
    : cleanImages(product.images);


  const items: GalleryItem[] = [];

  if (images.length > 0) {
    items.push({ type: "image", src: images[0] });
  }

  if (product.video && product.video.trim().length > 0) {
    items.push({ type: "video", src: product.video });
  }

  images.slice(1).forEach((img) => {
    items.push({ type: "image", src: img });
  });

  return items.length > 0
    ? items
    : [{ type: "image", src: "/placeholder.png" }];
}, [product, selectedVariant]);
const getVariantPriceBySize = (size: string) => {
  const v = variants.find(
    v =>
      v.size === size &&
      (!selectedColor || v.color === selectedColor)
  );

  return v?.price ?? null;
};


// ✅ NOW the early return is SAFE
if (!product) {
  return (
    <div className="flex justify-center items-center h-[60vh]">
      <LoadingRing />
    </div>
  );
}


// ✅ Product-level out of stock (ALL variants = 0)
const isProductOutOfStock =
  variants.length > 0 &&
  variants.every(v => (v.stock ?? 0) <= 0);

// ✅ Selected variant out of stock
const isSelectedVariantOutOfStock =
  !!selectedVariant && (selectedVariant.stock ?? 0) <= 0;

// ✅ Final Add-to-Bag disable flag (Vuori logic)
const disableAddToBag =
  isProductOutOfStock || isSelectedVariantOutOfStock;



  const isWishlisted = wishlist.some((p) => p.id === product.id);

const price = effectivePrice;

  const mrp = product.mrp ?? null;
const discount =
  mrp && mrp > price
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;


  // Reviews safe
  const reviewsList: Review[] = Array.isArray(product.reviews) ? product.reviews : [];

  // Real images array (only images submitted by reviewers)
  const realImageEntries = reviewsList.flatMap((r) =>
    (r.images || []).map((img) => ({
      img,
      reviewId: r.id,
      reviewer:
        typeof r.user === "string"
          ? r.user
          : (r.user && (r.user as any).name) || r.userName || "BSCFashion User",
      createdAt: r.createdAt,
    }))
  );

  // Rating breakdown in 5 → 1 order (user requested 5 first)
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviewsList.filter((r) => Math.round(r.rating) === star).length;
    return { star, count };
  });

  const totalReviews = reviewsList.length;

  const ratingLabels: Record<number, string> = {
    5: "Excellent",
    4: "Very Good",
    3: "Good",
    2: "Average",
    1: "Poor",
  };

  const handleWishlistClick = () => {
  const token = getCookie("token");

  if (!token) {
    router.push("/login?redirect=product");
    return;
  }

 toggleWishlist({
  id: product.id,
  name: product.name,
  images: product.images,
    price: effectivePrice,
});

 
};
const handleAddToBagWithLoginCheck = () => {
  const token = getCookie("token");

  if (!token) {
    router.push("/login?redirect=bag");
    return;
  }

  handleAddToBag();
};


const sizes = Array.from(
  new Set(variants.map(v => v.size).filter(Boolean))
) as string[];


  const colors = Array.from(
  new Set(
    variants
      .filter(v => (v.stock ?? 0) > 0)
      .map(v => v.color)
      .filter(Boolean)
  )
) as string[];


const getVariantBySize = (size: string) =>
  variants.find(
    v =>
      v.size === size &&
      (!selectedColor || v.color === selectedColor)
  ) ?? null;

const getVariant = (size: string, color: string | null) =>
  variants.find(
    v =>
      v.size === size &&
      (!color || v.color === color)
  ) ?? null;


const isSizeOutOfStock = (size: string) => {
  const v = getVariantBySize(size);
  return !v || (v.stock ?? 0) <= 0;
};

const getImagesForBag = () => {
  if (
    selectedVariant &&
    Array.isArray(selectedVariant.images) &&
    selectedVariant.images.length > 0
  ) {
    return selectedVariant.images; // ✅ variant images
  }

  return product.images; // ✅ fallback to main product images
};

const handleAddToBag = () => {
  // ❌ Variant missing
  if (!selectedVariant) {
    toast.error("Please select color");
    return;
  }

  // ❌ Size NOT selected (CRITICAL)
  if (product.sizes?.length > 0 && !selectedSize) {
    setSizeError(true);
    toast.error("Please select size");
    return;
  }

  setAddingToBag(true);

 if (!selectedVariant) {
  toast.error("Please select color and size");
  return;
}

const finalImages =
  selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : product.images;

addToCart(
  {
    id: product.id,
    name: product.name,
    price: effectivePrice, // base fallback only
    images: finalImages,
    availableSizes: product.sizes,
  },
  effectivePrice,          // ✅ PRICE ARG
  selectedSize!,
  selectedColor,
  selectedVariant.id,
  finalImages
);
;



  router.push("/bag");
};




  const openGalleryAt = (index: number) => {
    setGalleryStartIndex(index);
    setIsGalleryOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    document.body.style.overflow = "";
  };
console.log(product.fit, product.fabricCare, product.features);

  // ---------------- UI ----------------
  return (
  <div className="min-h-screen bg-white pt-20 md:pt-24">


   <Header productName={product.name} />
   

{showStickyDesktopBar && (
 <div
  className={`hidden md:flex fixed left-0 right-0 z-40
  top-[72px]
  backdrop-blur-md bg-white/90
  border-b border-black/10
  transition-all duration-300 ease-out
  ${showStickyDesktopBar
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-4 pointer-events-none"}
  `}
>

    <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 py-3">

      {/* LEFT: IMAGE + INFO */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-14 relative rounded overflow-hidden border">
         <Image
  src={
    selectedVariant?.images?.[0] ||
    product.images?.[0] ||
    "/placeholder.png"
  }
  alt={product.name}
  fill
  className="object-cover"
/>

        </div>

        <div className="leading-tight">
          <p className="text-sm font-medium line-clamp-1">
            {product.name}
          </p>
          <p className="text-sm text-gray-700">
            Rs.{price}
          </p>
        </div>
      </div>

      {/* RIGHT: BUTTON */}
      <button
        onClick={handleAddToBagWithLoginCheck}
        disabled={addingToBag}
        className="px-6 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500"
      >
        {addingToBag ? "Added!" : "Add to Bag"}
      </button>

    </div>
  </div>
)}



   <div className="flex flex-col md:flex-row w-full mt-4">

        {/* Images */}
     <div className="w-full md:w-[67%] relative md:mx-0 overflow-hidden">



          

      {/* Mobile Swiper */}
<div className="relative md:hidden">
  <Swiper
     modules={[Zoom, Pagination]}
    zoom={{ maxRatio: 3 }}
    pagination={{ type: "progressbar" }}
    slidesPerView={1}
    className="bscfashion-swiper"
  >

  {galleryItems.map((item, idx) => (
    <SwiperSlide key={idx}>
      {item.type === "video" ? (
        <video
          src={item.src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="w-full aspect-[3/4] object-cover"
        />
      ) : (
        
        <img
          src={item.src}
          alt=""
          className="w-full aspect-[3/4] object-cover"
        />
      )}
    </SwiperSlide>
  ))}
</Swiper>

  <div className="mt-2 h-[px] w-full bg-black/20">
  <div
    className="h-full bg-black transition-all duration-300"
    style={{
      width: `${((activeIndex + 1) / galleryItems.length) * 100}%`,
    }}
  />
</div>


</div>





<div className="hidden md:grid grid-cols-2 gap-[2px]">
  {galleryItems.map((item, idx) =>
    item.type === "video" ? (
  <div key={idx} className="relative">
    <video
      src={item.src}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      className="w-full aspect-[3/4] object-cover"
    />

    {/* ▶ Video badge */}
    <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
      ▶ Video
    </div>
  </div>
) : (
  <ZoomImage key={idx} src={item.src} alt={product.name} />
)
  )}
</div>



        </div>

        {/* Information */}
        
   <div className="flex flex-col gap-4 w-full md:w-[33%] px-6">


          <div ref={infoRef}>
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-light tracking-tight">{product.name}</h1>
              <Share2 className="h-5 w-5 text-gray-700" />
            </div>

            <div className="flex items-center gap-2 mt-1">
            {mrp && mrp > price ? (
  <span className="line-through text-gray-400 text-sm">
    Rs.{mrp}
  </span>
) : (
  <span className="text-green-600 text-xs font-semibold">
    Best Price
  </span>
)}

              <span className="text-gray-900">Rs.{price}</span>
              {discount > 0 && (
                <span className="text-yellow-600 text-xs font-semibold">{discount}% OFF</span>
              )}
            </div>
          </div>

      <div className="space-y-1 p-1">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    {product.brandName ?? "BSCFASHION"}
  </p>
</div>

{colors.length > 0 && (
  <div className="mt-3">
    <p className="text-sm font-medium text-gray-700 mb-2">
      Color {selectedColor && `: ${selectedColor}`}
    </p>

    <div className="flex flex-wrap gap-2">
      {colors.map(color => (
        <button
          key={color}
          onClick={() => {
            setSelectedColor(color);
            setSelectedSize(null);
            setSelectedVariant(null);
          }}
          className={`
            h-8 w-8 rounded-full border
            flex items-center justify-center
            ${selectedColor === color
              ? "ring-2 ring-black"
              : "ring-1 ring-gray-300"}
          `}
          title={color}
        >
          <span
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: getColorHex(color) }}

          />
        </button>
      ))}
    </div>
  </div>
)}


    <div
  ref={sizesRef}
  className={`${sizeError ? "ring-1 ring-red-400 rounded-md p-2" : ""}`}
>
  <p className="text-gray-700 mb-2 text-sm font-medium">Size</p>

  {product.sizes && product.sizes.length > 0 ? (
    <div className="flex flex-wrap gap-2">
  {sizes.map((size) => {
    const variant = getVariantBySize(size);
    const outOfStock = !variant || (variant.stock ?? 0) <= 0;

    return (
   <button
  key={size}
  disabled={outOfStock}
  onClick={() => {
    if (outOfStock) return;

    setSelectedSize(size);
    setSelectedVariant(variant);
    setSizeError(false);
  }}
  className={`
    min-w-[56px] px-3 py-2
    flex flex-col items-center justify-center
    border transition
    ${
      selectedSize === size
        ? "border-gray-900 text-gray-900"
        : "border-gray-300 text-gray-600 hover:border-gray-500"
    }
    ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""}
  `}
>
  <span className="text-sm font-medium">{size}</span>

  {/* ✅ Variant price under size */}
  {(() => {
    const vPrice = getVariantPriceBySize(size);

    if (!vPrice) return null;

    return (
      <span className="text-xs text-gray-500 mt-0.5">
        ₹{vPrice}
      </span>
    );
  })()}
</button>

    );
  })}
</div>

  ) : (
   <button
  onClick={() => {
    setSelectedSize("One Size");
    setSizeError(false);
  }}
  className={`
    min-w-[80px] h-10 px-4
    text-sm font-medium
    border transition
    ${
      selectedSize === "One Size"
        ? "border-gray-900 text-gray-900"
        : "border-gray-300 text-gray-600 hover:border-gray-500"
    }
  `}
>
  One Size
</button>

  )}

  {sizeError && (
    <p className="text-red-500 text-xs mt-1">Please select your size</p>
  )}
</div>




       




          {/* ⭐ RATING SUMMARY — show only when reviews exist */}
          {totalReviews > 0 && (
            <div className="mt-6 bg-white p-4 rounded-lg ">
              <h2 className="text-lg font-semibold mb-3">Ratings & Reviews</h2>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-xl font-bold text-green-600">★ {product.rating?.toFixed(1)}</div>
                <div className="text-sm text-gray-600">
                  {totalReviews} Ratings
                  <div className="text-green-700 font-medium">✔ Verified by BSCFASHION Users</div>
                </div>
              </div>

             {ratingBreakdown.map((item) => {
  const percent = totalReviews > 0 ? (item.count / totalReviews) * 100 : 0;

  return (
    <div key={item.star} className="flex items-center gap-3 mb-2">
      <span className="w-20 font-medium text-gray-700">
        {ratingLabels[item.star]}
      </span>

      <div className="flex-1 bg-gray-200 h-2 rounded">
        <div
          className="bg-green-500 h-full rounded"
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <span className="text-sm w-10 text-right text-gray-600">
        {item.count}
      </span>
    </div>
  );
})}
</div>
          )}


         

{/* ----------------- OUT OF STOCK UI ----------------- */}
<div className="hidden md:flex flex-col gap-3 mt-4">
{isProductOutOfStock ? (
  <button
    onClick={async () => {
      const token = getCookie("token");
      if (!token) {
        router.push("/login?redirect=product");
        return;
      }

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("We will notify you when it's back in stock!");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    }}
    className="w-full py-3 mt-4 font-semibold bg-black text-white rounded-md"
  >
    🔔 Remind Me
  </button>
) : (
  <div className="flex flex-col gap-3 mt-4">
    <button
      onClick={handleWishlistClick}
      className="flex-1 bg-white ring-1 ring-black/10 py-3 flex items-center justify-center gap-2 rounded-md"
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
      {isWishlisted ? "Wishlisted" : "Wishlist"}
    </button>

    <button
      onClick={handleAddToBagWithLoginCheck}
      disabled={addingToBag}
      className="flex-1 py-3 text-sm font-semibold rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500"
    >
      <ShoppingBag className="inline w-5 h-5 mr-2" />
      {addingToBag ? "Added!" : "Add to Bag"}
    </button>
  </div>
)}

    
  
  
  
</div>
<div className="mt-6 divide-y">
  <ProductAccordion
    title="Product Description"
    content={product.description}
  />

  <ProductAccordion
    title="Fit"
    items={product.fit ?? []}
  />

  <ProductAccordion
    title="Fabric & Care"
    items={product.fabricCare ?? []}
  />

  <ProductAccordion
    title="Product Features"
    items={product.features ?? []}
  />
</div>



<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex gap-2 p-3 z-50">
  {isProductOutOfStock ? (
    <button
      onClick={async () => {
        const token = getCookie("token");
        if (!token) {
          router.push("/login?redirect=product");
          return;
        }

        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });

        toast.success("We will notify you when it's back in stock!");
      }}
      className="w-full py-3 text-sm font-semibold bg-black text-white rounded-md"
    >
      🔔 Remind Me
    </button>
  ) : (
    <>
      <button
        onClick={handleWishlistClick}
        className="w-1/2 bg-white ring-1 ring-black/10 py-3 flex items-center justify-center gap-2 rounded-md"
      >
        <Heart
          className={`h-5 w-5 ${
            isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"
          }`}
        />
        Wishlist
      </button>

      <button
        onClick={handleAddToBagWithLoginCheck}
        disabled={addingToBag}
        className="w-1/2 py-3 text-sm font-semibold rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500"
      >
        <ShoppingBag className="inline w-5 h-5 mr-2" />
        Add to Bag
      </button>
    </>
  )}
</div>

</div>
</div>


      {/* Similar products */}
      {similarProducts.length > 0 && (
        <div className="mt-10 max-w-6xl mx-auto">
          <h2 className="text-lg font-medium mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-0.5 gap-y-6">
            {similarProducts.map((p) => (
            <ProductCard
  key={p.id}
  product={{
    ...p,
    brandName: p.brandName || "BSCFASHION",
  }}
/>

            ))}
          </div>
        </div>
      )}
<div className="flex justify-center mt-6">
<Link
  href={`/categories/${product.category}`}
  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
>
  View more similar products
  <span className="text-base">→</span>
</Link>

</div>




      {/* Fullscreen gallery modal (Swiper) for real images */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" role="dialog" aria-modal="true">
          <button onClick={closeGallery} className="absolute top-4 right-4 z-50 text-white text-xl p-2" aria-label="Close gallery">
            ✕
          </button>

          <div className="w-full max-w-4xl h-[80vh]">
            <Swiper
              initialSlide={galleryStartIndex}
              spaceBetween={10}
              slidesPerView={1}
              modules={[Pagination, Navigation]}
              navigation
              pagination={{ clickable: true }}
            >
              {realImageEntries.map((entry, idx) => (
                <SwiperSlide key={`${entry.img}-${idx}`}>
                  <div className="w-full h-[80vh] flex items-center justify-center">
                    <img src={entry.img} alt={`photo-${idx}`} className="max-h-[80vh] object-contain" />
                  </div>
                  <div className="text-sm text-white/90 text-center mt-2">
                    {entry.reviewer} {entry.createdAt ? `• ${new Date(entry.createdAt).toLocaleDateString("en-IN")}` : ""}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}
