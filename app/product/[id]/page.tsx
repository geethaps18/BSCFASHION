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

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const MIN = 1;
  const MAX = 2;
  const [zoom, setZoom] = useState(MIN);
  const [bgPos, setBgPos] = useState("center");

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
        onTouchMove={(e) => setPos(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)}
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
        <Image src={src} alt={alt} fill className="opacity-0" draggable={false} />
      </div>
    </div>
  );
}

// ------------------- Product Detail Page -------------------
export default function ProductDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;

  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [networkError, setNetworkError] = useState(""); // <<< INTERNET ERROR
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToBag, setAddingToBag] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement | null>(null);

  // ------------------- FETCH PRODUCT -------------------
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);

        // INTERNET FAILS → fetch throws error → goes to catch block
        if (!res.ok) {
          setProduct(null);
          return;
        }

        const data: Product = await res.json();
        setProduct({ ...data, reviewCount: data?.reviewCount ?? 0 });

        setSelectedColor(data?.colors?.[0]?.hex ?? null);

        // Fetch similar products
        const params = new URLSearchParams();
        if (data.subSubCategory) params.append("subSubCategory", data.subSubCategory);
        else if (data.subCategory) params.append("subCategory", data.subCategory);
        else if (data.category) params.append("category", data.category);
        params.append("exclude", data.id);

        const sim = await fetch(`/api/products/similar?${params.toString()}`);
        if (sim.ok) setSimilarProducts(await sim.json());
      } catch (err) {
        setNetworkError("No internet connection. Please check your network."); // <<< MESSAGE
        setProduct(null);
      }
    };

    load();
  }, [id]);

  // INTERNET ERROR UI
  if (networkError) {
    return (
      <div className="p-6 text-center text-red-600 text-lg mt-20">
        {networkError}
      </div>
    );
  }

  // PRODUCT NOT FOUND
  if (!product) {
    return (
      <p className="p-6 text-center text-gray-500 mt-20">
        Product not found.
      </p>
    );
  }

  // ------------------- RENDER PRODUCT -------------------
  const images = product.images?.length ? product.images : ["/placeholder.png"];
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  const price = product.price;
  const mrp = product.mrp ?? null;
  const discount =
    product.discount ??
    (mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

  // ------------------- ADD TO BAG -------------------
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
    setTimeout(() => setAddingToBag(false), 1000);
  };

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6 pt-20 md:pt-24">
      <Header productName={product.name} />

      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto mt-4">

        {/* Images */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute bottom-6 right-2 z-10">
            {product.rating ? (
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
            <Swiper slidesPerView={1.5} spaceBetween={10} centeredSlides modules={[Pagination, Scrollbar]} scrollbar={{ draggable: true }}>
              {images.map((img) => (
                <SwiperSlide key={img}>
                  <ZoomImage src={img} alt={product.name} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

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

          {/* Buttons */}
          <div className="flex flex-row sm:flex-col gap-3 mt-4">
            <button
              onClick={() => toggleWishlist(product)}
              className="flex-1 bg-white ring-1 ring-black/10 py-3 flex items-center justify-center gap-2"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
              {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            <button
              onClick={handleAddToBag}
              disabled={addingToBag}
              className={`flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-yellow-300 to-yellow-500 ${
                addingToBag ? "opacity-50" : ""
              }`}
            >
              <ShoppingBag className="inline w-5 h-5 mr-2" />
              {addingToBag ? "Added!" : "Add to Bag"}
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
