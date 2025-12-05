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

interface Review {
  id: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt?: string;
  user?: string | { name?: string } | null;
  userName?: string; // fallback
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

  const [product, setProduct] = useState<ProductWithReviews | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductType[]>([]);
  const [networkError, setNetworkError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement | null>(null);

  // Modal state for Real Images fullscreen slider
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  // ---------------- FETCH PRODUCT ----------------
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
        setProduct(data);

        // fetch similar
        const params2 = new URLSearchParams();
        if ((data as any).subSubCategory) params2.append("subSubCategory", (data as any).subSubCategory);
        else if ((data as any).subCategory) params2.append("subCategory", (data as any).subCategory);
        else if ((data as any).category) params2.append("category", (data as any).category);
        params2.append("exclude", data.id);

        const sim = await fetch(`/api/products/similar?${params2.toString()}`);
        if (sim.ok) setSimilarProducts(await sim.json());
      } catch (err) {
        console.error("Product fetch error:", err);
        setNetworkError("No internet connection.");
        setProduct(null);
      }
    };

    load();
  }, [id]);

  if (networkError) {
    return <div className="p-6 text-center text-red-600 mt-20">{networkError}</div>;
  }

  if (!product) {
    return <p className="p-6 text-center text-gray-500 mt-20">Product not found.</p>;
  }

  // ---------------- Derived / Safe data ----------------
  const images = product.images && product.images.length ? product.images : ["/placeholder.png"];
  const isWishlisted = wishlist.some((p) => p.id === product.id);
  const price = product.price;
  const mrp = product.mrp ?? null;

  // Safe reviews array
  const reviewsList: Review[] = Array.isArray(product.reviews) ? product.reviews : [];

  // Real images array (only images submitted by reviewers). We keep track of origin review for caption if needed.
  const realImageEntries = reviewsList
    .flatMap((r) =>
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

  // Rating breakdown (1..5)
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

  // ---------------- Actions ----------------
  const handleAddToBag = () => {
    if (!selectedSize && product.sizes?.length) {
      toast.error("Please select your size");
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

    toast.success("Added to bag");
    setTimeout(() => setAddingToBag(false), 900);
  };

  const openGalleryAt = (index: number) => {
    setGalleryStartIndex(index);
    setIsGalleryOpen(true);
    // prevent body scroll
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
        {/* IMAGES */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute bottom-6 right-2 z-10">
           {product.rating > 0 ? (
  <div className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg flex items-center gap-1">
    ★ {product.rating.toFixed(1)}
  </div>
) : (
  <div className="bg-black text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
    New
  </div>
)}

          </div>

          <div className="md:hidden mb-4">
            <Swiper slidesPerView={1.2} spaceBetween={10} centeredSlides modules={[Pagination, Scrollbar]}>
              {images.map((img) => (
                <SwiperSlide key={img}>
                  <div className="w-full h-[360px] bg-gray-50 rounded overflow-hidden">
                    <Image src={img} alt={product.name} fill className="object-contain" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-1 h-[700px] overflow-y-auto pr-2">
            {images.map((img) => (
              <div key={img} className="w-full h-[340px] bg-gray-50 rounded overflow-hidden">
                <Image src={img} alt={product.name} fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* INFORMATION */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h1 className="text-lg font-light tracking-tight">{product.name}</h1>

          <div className="flex items-center gap-2">
            {mrp && mrp > price && <span className="line-through text-gray-400 text-sm">Rs.{mrp}</span>}
            <span className="text-gray-900 text-lg font-semibold">Rs.{price}</span>
          </div>

          {/* SIZES */}
          {product.sizes?.length > 0 && (
            <div ref={sizesRef} className={`${sizeError ? "ring-2 ring-red-400 p-2 rounded" : ""}`}>
              <p className="text-gray-700 mb-2">Size</p>
              <div className="grid grid-cols-10 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`border py-2 rounded-md text-sm ${selectedSize === size ? "border-black bg-gray-200" : "border-gray-300"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {product.description && <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>}

         
{/* ⭐ RATING SUMMARY — SHOW ONLY IF reviews exist */}
{totalReviews > 0 && (
  <div className="bg-white p-4 rounded-lg  mt-6">
    <h2 className="text-lg font-semibold mb-3">Ratings</h2>

    <div className="flex items-center gap-4 mb-4">
      <div className="text-3xl font-bold text-green-600">
        ★ {product.rating?.toFixed(1)}
      </div>

      <div className="text-sm text-gray-600">
        {totalReviews} Ratings
        <div className="text-green-700 font-medium">
          ✔ Verified by BSCFASHION
        </div>
      </div>
    </div>

    {/* ⭐ Rating Bars */}
    {ratingBreakdown
     
      .map((item) => {
        const percent = (item.count / totalReviews) * 100;

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


           {/* ---------------- Real Images (Meesho style) ---------------- */}
          {realImageEntries.length > 0 && (
            <div className="mt-2 bg-white p-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Real Images</h3>
                <div className="text-sm text-gray-500">{realImageEntries.length} photos</div>
              </div>

              {/* Horizontal thumbnails row */}
              <div className="flex gap-2 overflow-x-auto pb-2 overflow-hidden">
                {realImageEntries.map((entry, idx) => (
                  <button
                    key={`${entry.img}-${idx}`}
                    onClick={() => openGalleryAt(idx)}
                    className="flex-shrink-0 w-20 h-20 rounded overflow-hidden border"
                    aria-label={`Open photo ${idx + 1}`}
                  >
                    {/* Use plain <img> for simple thumbnails (faster rendering) */}
                    <img src={entry.img} alt={`real-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Small caption / optional */}
              <div className="text-xs text-gray-500 mt-2">Photos from customers who bought this product.</div>
            </div>
          )}


          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => toggleWishlist(product)}
              className="flex-1 py-3 bg-white ring-1 ring-black/10 flex items-center justify-center gap-2"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
              {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            <button
              onClick={handleAddToBag}
              disabled={addingToBag}
              className={`flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-yellow-300 to-yellow-500 ${addingToBag ? "opacity-50" : ""}`}
            >
              <ShoppingBag className="inline w-5 h-5 mr-2" />
              {addingToBag ? "Added!" : "Add to Bag"}
            </button>
          </div>
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
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

      {/* ---------------- Fullscreen gallery modal (Swiper) ---------------- */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-50 text-white text-xl p-2"
            aria-label="Close gallery"
          >
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
