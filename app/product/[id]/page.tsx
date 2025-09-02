"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { ShoppingBag, Heart, Share2 } from "lucide-react";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/BagContext";

// ---------------------- Types ----------------------
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // stored as Float in Prisma
  mrp?: number | null;
  discount?: number | null;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  createdAt: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  images?: string[];
  color?: string | null;
  size?: string | null;
  quantity: number;
}

// ---------------------- Zoom Image ----------------------
function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const MIN = 1;
  const MAX = 2;
  const [zoom, setZoom] = useState<number>(MIN);
  const [bgPos, setBgPos] = useState<string>("center");

  const toggleZoom = () => {
    setZoom(zoom === MIN ? MAX : MIN);
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
    <div className="relative w-full">
      <div
        onClick={toggleZoom}
        onMouseMove={(e) => updatePositionFromPoint(e.clientX, e.clientY, e.currentTarget)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          updatePositionFromPoint(t.clientX, t.clientY, e.currentTarget);
        }}
        onMouseLeave={() => zoom === MIN && setBgPos("center")}
        className={`relative w-full h-[400px] md:h-[340px] rounded-xl bg-gray-50 overflow-hidden select-none ${
          zoom === MIN ? "cursor-zoom-in" : "cursor-move touch-none"
        }`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: zoom === MIN ? "center" : bgPos,
          backgroundSize: zoom === MIN ? "contain" : `${zoom * 100}%`,
        }}
      >
        <Image src={src} alt={alt} fill className="object-contain opacity-0" draggable={false} />
      </div>
    </div>
  );
}

// ---------------------- Page ----------------------
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isSignedIn } = useUser();
  const { wishlist: wishlistContext, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);

  // ✅ Fetch product directly from /api/products/[id]
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();

        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          mrp: data.mrp ? Number(data.mrp) : null,
          discount: data.discount ?? null,
          images: data.images || [],
          colors: data.colors || [],
          sizes: data.sizes || [],
          createdAt: data.createdAt || new Date().toISOString(),
        });

        setSelectedColor(data.colors?.[0] || null);
        setSelectedSize(data.sizes?.[0] || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ---------------------- Handlers ----------------------
  const handleAddToBag = async () => {
    if (!isSignedIn || !user?.id || !product) {
      toast.error("Please login first!");
      return;
    }
    setAddingToBag(true);

    const item: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      color: selectedColor,
      size: selectedSize,
      quantity: 1,
    };

    addToCart(item);

    try {
      const res = await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          color: selectedColor,
          size: selectedSize,
        }),
      });
      const data = await res.json();
      if (data.success) toast.success("Added to bag");
      else toast.error("Failed to add to bag");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setTimeout(() => setAddingToBag(false), 2000);
    }
  };

  const handleShare = () => {
    if (!product) return;
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };

  // ---------------------- UI ----------------------
  if (loading) return <p className="p-6 text-center text-gray-500">Loading...</p>;
  if (!product) return <p className="p-6 text-center text-gray-500">Not found</p>;

  const images = product.images?.length ? product.images : ["/placeholder.png"];
  const isWishlisted = wishlistContext.some((p) => p.id === product.id);

  const priceNum = product.price;
  const mrpNum = product.mrp ?? null;
  const discount =
    product.discount ??
    (mrpNum && priceNum && mrpNum > priceNum
      ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
      : 0);

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
        {/* LEFT */}
        <div className="w-full md:w-1/2">
          {/* Mobile Swiper */}
          <div className="md:hidden">
            <Swiper
              slidesPerView={1.5}
              spaceBetween={10}
              centeredSlides
              modules={[Pagination, Scrollbar]}
              scrollbar={{ draggable: true }}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <ZoomImage src={img} alt={`${product.name} ${idx + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 gap-0.5 max-h-[700px] overflow-y-auto pr-2">
            {images.map((img, idx) => (
              <ZoomImage key={idx} src={img} alt={`${product.name} ${idx + 1}`} />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          {/* Product Name + Price */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
              <button onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm">NEW ARRIVAL</p>
            <div className="flex items-center gap-2 mt-1">
              {mrpNum && mrpNum > priceNum && (
                <span className="text-gray-400 line-through text-xs md:text-sm">
                  ₹{mrpNum.toLocaleString("en-IN")}
                </span>
              )}
              <span className="font-bold text-xl text-emerald-700">
                ₹{priceNum.toLocaleString("en-IN")}
              </span>
              {discount > 0 && <span className="text-red-500">({discount}% OFF)</span>}
            </div>
          </div>

          {/* Colors */}
          {product.colors?.length ? (
            <div>
              <p className="font-medium text-gray-700 mb-2">Color:</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition ${
                      selectedColor === color ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <span className="text-white text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Sizes */}
          {product.sizes?.length ? (
            <div>
              <p className="font-medium text-gray-700 mb-2">Size:</p>
              <div className="grid grid-cols-4 gap-2 max-w-full">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`border rounded-md py-2 text-sm transition ${
                      selectedSize === size ? "border-gray-900 bg-gray-100" : "border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Description */}
          {product.description && <p className="mt-2 text-gray-600">{product.description}</p>}

          {/* CTA Buttons */}
          <div className="flex flex-row sm:flex-col gap-3 mt-4 w-full">
            <button
              onClick={handleWishlistToggle}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white ring-1 ring-black/10 transition text-sm font-medium"
            >
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-700"
                }`}
              />
              <span>{isWishlisted ? "Added!" : "Add to Wishlist"}</span>
            </button>

            <button
              onClick={handleAddToBag}
              disabled={addingToBag}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-white text-sm transition bg-[#2B2B2B] hover:bg-[#1E1E1E]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{addingToBag ? "Added!" : "Add to bag"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
