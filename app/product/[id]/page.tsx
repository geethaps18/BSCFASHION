"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { ShoppingBag, Heart, Share2 } from "lucide-react";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/BagContext";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";

// ------------------- Zoom Image Component -------------------
function ZoomImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const MIN = 1;
  const MAX = 2;
  const [zoom, setZoom] = useState<number>(MIN);
  const [bgPos, setBgPos] = useState<string>("center");

  const toggleZoom = () => {
    setZoom((prev) => (prev === MIN ? MAX : MIN));
    if (zoom !== MIN) setBgPos("center");
  };

  const updatePositionFromPoint = (x: number, y: number, el: HTMLDivElement) => {
    if (zoom === MIN) return;
    const rect = el.getBoundingClientRect();
    const rx = ((x - rect.left) / rect.width) * 100;
    const ry = ((y - rect.top) / rect.height) * 100;
    setBgPos(`${Math.max(0, Math.min(100, rx))}% ${Math.max(0, Math.min(100, ry))}%`);
  };

  return (
    <div className="relative w-full overflow-hidden shadow-lg">
      <div
        onClick={toggleZoom}
        onMouseMove={(e) => updatePositionFromPoint(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) =>
          updatePositionFromPoint(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)
        }
        onMouseLeave={() => zoom === MIN && setBgPos("center")}
        className={`w-full h-[400px] md:h-[360px] bg-gray-50 select-none ${
          zoom === MIN ? "cursor-zoom-in" : "cursor-move touch-none"
        }`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: zoom === MIN ? "center" : bgPos,
          backgroundSize: zoom === MIN ? "contain" : `${zoom * 100}%`,
          transition: "background-size 0.3s ease",
        }}
      >
        <Image src={src} alt={alt} fill className="object-contain opacity-0" draggable={false} />
      </div>
    </div>
  );
}

// ------------------- Product Detail Page -------------------
export default function ProductDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;

  const { wishlist: wishlistContext, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement | null>(null);

  // ------------------- Fetch Product & Similar Products -------------------
  useEffect(() => {
    if (!id) return;

    const fetchProductAndSimilar = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data: Product = await res.json();
        setProduct({ ...data, reviewCount: data?.reviewCount ?? 0 });

        // Set default color
        setSelectedColor(data?.colors?.[0]?.hex ?? null);
        setSelectedSize(null);

        // Fetch similar products dynamically
        const params = new URLSearchParams();
        if (data.subSubCategory) params.append("subSubCategory", data.subSubCategory);
        else if (data.subCategory) params.append("subCategory", data.subCategory);
        else if (data.category) params.append("category", data.category);
        if (data.id) params.append("exclude", data.id);

        const simRes = await fetch(`/api/products/similar?${params.toString()}`);
        if (!simRes.ok) throw new Error("Failed to fetch similar products");
        const simData: Product[] = await simRes.json();
        setSimilarProducts(simData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch product or similar products");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndSimilar();
  }, [id]);

  // ------------------- Reset size error -------------------
  useEffect(() => {
    if (selectedSize) setSizeError(false);
  }, [selectedSize]);

  // ------------------- Add to Bag -------------------
  const handleAddToBag = () => {
    if (!product) return;

    if (product.sizes?.length && !selectedSize) {
      toast.error("Please select your size before adding to bag!");
      setSizeError(true);
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setAddingToBag(true);
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        availableSizes: product.sizes,
      },
      selectedSize ?? undefined
    );

    toast.success("Added to bag");
    setTimeout(() => setAddingToBag(false), 1200);
  };

  // ------------------- Share -------------------
  const handleShare = () => {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this product: ${product.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // ------------------- Wishlist -------------------
  const handleWishlistToggle = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };

  if (!product)
    return <p className="p-6 text-center text-gray-500">Please check your internet connection</p>;

  const images = product.images?.length ? product.images : ["/placeholder.png"];
  const isWishlisted = wishlistContext.some((p) => p.id === product.id);
  const priceNum = product.price;
  const mrpNum = product.mrp ?? null;
  const discount =
    product.discount ?? (mrpNum && mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0);

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6 pt-20 md:pt-24">
      <Header productName={product.name} />

      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full mt-4">
        {/* LEFT: Images */}
        <div className="w-full md:w-1/2 relative">
          {/* Rating badge shows only once — top-right */}
          {product.rating && product.rating > 0 && (
            <div
              className={`absolute bottom-6 right-2 z-10 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg flex items-center gap-1 ${
                product.rating < 3 ? "bg-yellow-500" : "bg-green-600"
              }`}
            >
              <span>★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Swiper for mobile */}
          <div className="md:hidden mb-4">
            <Swiper
              slidesPerView={1.5}
              spaceBetween={10}
              centeredSlides
              modules={[Pagination, Scrollbar]}
              scrollbar={{ draggable: true }}
            >
              {images.map((img) => (
                <SwiperSlide key={img}>
                  <ZoomImage src={img} alt={product.name} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Grid for desktop */}
          <div className="hidden md:grid grid-cols-2 gap-1 max-h-[700px] overflow-y-auto pr-2">
            {images.map((img) => (
              <ZoomImage key={img} src={img} alt={product.name} />
            ))}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          {/* Name & Price */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <h1 className="line-clamp-1 text-[#111111] text-lg md:text-base font-light tracking-tight">
                {product.name}
              </h1>
              <button onClick={handleShare}>
                <Share2 className="h-5 w-5 text-gray-700 hover:text-gray-900 transition" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {mrpNum && mrpNum > priceNum && (
                <span className="text-gray-400 line-through text-sm md:text-base">
                  Rs.{mrpNum.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-gray-900 text-sm md:text-base">
                Rs. {priceNum.toLocaleString("en-IN")}
              </span>
              {discount > 0 && (
                <span className="text-[#CDAF5A] text-xs md:text-sm font-semibold">{discount}% OFF</span>
              )}
            </div>
          </div>

          {/* Colors */}
          {product.colors?.length && (
            <div>
              <p className="text-gray-700 mb-2">Color:</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      selectedColor === color.hex ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selectedColor === color.hex && <span className="text-white text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length && (
            <div ref={sizesRef} className={`${sizeError ? "ring-2 ring-rose-400 rounded-md p-2" : ""}`}>
              <p className="text-gray-700 mb-2">Size</p>
              <div className="grid grid-cols-10 gap-2 max-w-full">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`border rounded-md py-2 text-sm transition ${
                      selectedSize === size ? "border-gray-900 bg-gray-100" : "border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && <p className="text-rose-500 text-xs mt-1">Please select your size</p>}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="mt-2 text-gray-600 leading-relaxed text-sm md:text-base">{product.description}</p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-row sm:flex-col gap-3 mt-4 w-full">
            <button
              onClick={handleWishlistToggle}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white ring-1 ring-black/10 transition text-sm font-medium hover:ring-gray-400"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-700"}`} />
              <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
            </button>

            <button
              onClick={handleAddToBag}
              disabled={addingToBag}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-gray-900 text-sm font-semibold transition bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 ${
                addingToBag ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{addingToBag ? "Added!" : "Add to Bag"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------- Similar Products ------------------- */}
      {similarProducts.length > 0 && (
        <div className="mt-10 max-w-6xl mx-auto">
          <h2 className="text-gray-800 text-lg md:text-xl font-medium mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-2 md:grid-cols-4">
            {similarProducts.map((p, index) => (
              <ProductCard key={p.id ?? index} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
