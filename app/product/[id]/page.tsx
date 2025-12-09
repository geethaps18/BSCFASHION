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
    <div className="relative w-full overflow-hidden shadow-lg">
      <div
        onClick={toggleZoom}
        onMouseMove={(e) => setPos(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) =>
        
        setPos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)

        }
        className={`w-full h-[400px] md:h-[360px] bg-gray-50 select-none ${
          zoom === MIN ? "cursor-zoom-in" : "cursor-move"
        }`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: zoom === MIN ? "center" : bgPos,
          backgroundSize: zoom === MIN ? "contain" : `${zoom * 100}%`,
        }}
      >
        {/* Invisible Image keeps layout/resolution stable for Next/Image optimization */}
        <Image src={src} alt={alt} fill className="opacity-0" draggable={false} />
      </div>
    </div>
  );
}

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

type ProductWithReviews = ProductType & {
  reviews?: Review[];
  rating?: number;
  reviewCount?: number;
};

export default function ProductDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;

  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  const [product, setProduct] = useState<ProductWithReviews | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductType[]>([]);
  const [networkError, setNetworkError] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement | null>(null);

  // Gallery modal state for Real Images fullscreen slider
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(true);


  // ---------------- FETCH PRODUCT ----------------

  // 🛑 Prevent scroll resetting when coming back
useEffect(() => {
  window.history.scrollRestoration = "manual";
}, []);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          setProduct(null);
          return;
        }

        const data = (await res.json()) as ProductWithReviews;
        // ensure fields exist
        setProduct({
          ...data,
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          rating: data.rating ?? 0,
          reviewCount: data.reviewCount ?? (data.reviews ? data.reviews.length : 0),
        });


        // Fetch similar products
        const params2 = new URLSearchParams();
        if ((data as any).subSubCategory) params2.append("subSubCategory", (data as any).subSubCategory);
        else if ((data as any).subCategory) params2.append("subCategory", (data as any).subCategory);
        else if ((data as any).category) params2.append("category", (data as any).category);
        params2.append("exclude", data.id);

        const sim = await fetch(`/api/products/similar?${params2.toString()}`);
        if (sim.ok) setSimilarProducts(await sim.json());
      } catch (err) {
        console.error("Product fetch error:", err);
        setNetworkError("No internet connection. Please check your network.");
        setProduct(null);
      }
    };

    load();
  }, [id]);

  if (networkError) {
    return (
      <div className="p-6 text-center text-red-600 text-lg mt-20">
        {networkError}
      </div>
    );
  }



if (!product) {
  return (
    <div className="flex justify-center items-center h-[60vh]">
      <LoadingRing />
    </div>
  );
}


  // ---------------- Derived / Safe data ----------------
  const images = product.images?.length ? product.images : ["/placeholder.png"];
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  const price = product.price;
  const mrp = product.mrp ?? null;
  const discount =
    product.discount ??
    (mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

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

  toggleWishlist(product);
 
};
const handleAddToBagWithLoginCheck = () => {
  const token = getCookie("token");

  if (!token) {
    router.push("/login?redirect=bag");
    return;
  }

  handleAddToBag();
};



  // ---------------- Actions ----------------
  const handleAddToBag = () => {
    if (!selectedSize && product.sizes?.length) {
     
      setSizeError(true);
      return;
    }

    setAddingToBag(true);
    addToCart(
      {
        id: product.id,
        name: product.name,
        price,
        images: product.images,
        availableSizes: product.sizes,
      },
      selectedSize ?? undefined
    );

    
    setTimeout(() => setAddingToBag(false), 1000);
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

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6 pt-20 md:pt-24">
      <Header productName={product.name} />

      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto mt-4">
        {/* Images */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute bottom-6 right-2 z-10">
            {product.rating && product.rating > 0 ? (
              <div className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                ★ {product.rating.toFixed(1)}
              </div>
            ) : (
              <div className="bg-black text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                New
              </div>
            )}
          </div>

          {/* Mobile: Swiper slides (swipe only) */}
          <div className="md:hidden mb-4">
            <Swiper
              slidesPerView={1.2}
              spaceBetween={10}
              centeredSlides
              modules={[Pagination, Scrollbar]}
              scrollbar={{ draggable: true }}
            >
              {images.map((img) => (
                <SwiperSlide key={img}>
                  <div className="w-full h-[360px] bg-gray-50 rounded overflow-hidden">
                    {/* mobile still uses zoom on tap inside ZoomImage */}
                    <ZoomImage src={img} alt={product.name} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop: two-column zoom grid (same as your original UI) */}
          <div className="hidden md:grid grid-cols-2 gap-1 max-h-[700px] overflow-y-auto pr-2">
            {images.map((img) => (
              <ZoomImage key={img} src={img} alt={product.name} />
            ))}
          </div>
        </div>

        {/* Information */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <div>
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-light tracking-tight">{product.name}</h1>
              <Share2 className="h-5 w-5 text-gray-700" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              {mrp && mrp > price && (
                <span className="line-through text-gray-400 text-sm">Rs.{mrp}</span>
              )}
              <span className="text-gray-900">Rs.{price}</span>
              {discount > 0 && (
                <span className="text-yellow-600 text-xs font-semibold">{discount}% OFF</span>
              )}
            </div>
          </div>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div ref={sizesRef} className={`${sizeError ? "ring-2 ring-red-400 rounded-md p-2" : ""}`}>
              <p className="text-gray-700 mb-2">Size</p>
              <div className="grid grid-cols-10 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`border py-2 rounded-md text-sm ${
                      selectedSize === size ? "border-black bg-gray-200" : "border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && <p className="text-red-500 text-xs mt-1">Please select your size</p>}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          )}

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

         

     {/* Desktop Buttons (Hidden on Mobile) */}
<div className="hidden md:flex flex-col gap-3 mt-4">
  <button
    onClick={handleWishlistClick}
    className="flex-1 bg-white ring-1 ring-black/10 py-3 flex items-center justify-center gap-2"
  >
    <Heart className={`h-5 w-5 ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
    {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
  </button>

  <button
    onClick={handleAddToBagWithLoginCheck}
    disabled={addingToBag}
    className={`flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-yellow-300 to-yellow-500 ${
      addingToBag ? "opacity-50" : ""
    }`}
  >
    <ShoppingBag className="inline w-5 h-5 mr-2" />
    {addingToBag ? "Added!" : "Add to Bag"}
  </button>
</div>

{/* MOBILE FIXED BUTTON BAR */}
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white  flex gap-2 p-3 z-50">
  <button
    onClick={handleWishlistClick}
    className="w-1/2 bg-white ring-1 ring-black/10 py-3 flex items-center justify-center gap-2 rounded-md"
  >
    <Heart className={`h-5 w-5 ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
    {isWishlisted ? "Wishlisted" : "Wishlist"}
  </button>

  <button
    onClick={handleAddToBagWithLoginCheck}
    disabled={addingToBag}
    className={`w-1/2 py-3 text-sm font-semibold rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500 ${
      addingToBag ? "opacity-50" : ""
    }`}
  >
    <ShoppingBag className="inline w-5 h-5 mr-2" />
    {addingToBag ? "Added!" : "Add to Bag"}
  </button>
</div>
</div>
</div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <div className="mt-10 max-w-6xl mx-auto">
          <h2 className="text-lg font-medium mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

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
