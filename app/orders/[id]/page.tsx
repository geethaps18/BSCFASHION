"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Header from "@/components/Header";
import { Truck, Home } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { Items } from "openai/resources/conversations/items";
import LoadingRing from "@/components/LoadingRing";

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  quantity: number;
  size?: string;
  
}

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}
interface ProductWithReviews {
  id: string;            // order item id
  productId: string;     // REAL PRODUCT ID (IMPORTANT!)
  name: string;
  size?: string;
  quantity: number;
  price: number;
  description?: string;

  product?: {
    id?: string;
    name?: string;
    images?: string[];
    price?: number;
    description?: string;
  };

  reviews?: Review[];
}


interface Order {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;    // NEW
  deliveredAt?: string;  // NEW
  items: ProductWithReviews[];
  totalAmount: number;
  address?: Address;
}


interface ProductCardProps {
  product: ProductWithReviews;
  orderStatus: string;
  currentUserId: string;
  onSubmitReview: (
    productId: string,
    rating: number,
    comment?: string,
    images?: File[]
  ) => void;
}

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-100 text-blue-800" },
  OUT_FOR_DELIVERY: {
    text: "Out for Delivery",
    color: "bg-purple-100 text-purple-800",
  },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id;

  // Replace with actual user ID from auth
  const currentUserId = "me";

  const { data: adminOrders } = useSWR<Order[]>( "/api/admin/order", fetcher, { refreshInterval: 5000 });

  // Fetch order
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        if (data.order) setOrder(data.order);
        else toast.error("Order not found");
      } catch (err) {
        console.error(err);
        toast.error("Error fetching order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Live order status update
  useEffect(() => {
    if (order && adminOrders) {
      const adminOrder = adminOrders.find((o) => o.id === order.id);
      if (adminOrder && adminOrder.status !== order.status) {
        setOrder({ ...order, status: adminOrder.status });
      }
    }
  }, [adminOrders, order]);

 

  // Handle review submission and update global order state
  const handleSubmitReview = async (
    productId: string,
    rating: number,
    comment?: string,
    images?: File[]
  ) => {
    try {
      const imageBase64: string[] = [];
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1]);
            reader.onerror = (err) => reject(err);
          });
          imageBase64.push(base64);
        }
      }

      const res = await fetch(`/api/orders/${order!.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment, images: imageBase64 }),
      });

      if (!res.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted!");

      // Update global order state so review form disappears immediately
      setOrder((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((item) => {
          if (item.id === productId) {
            const newReview: Review = {
              id: Math.random().toString(36).substr(2, 9),
              userId: currentUserId,
              rating,
              comment,
              images: imageBase64.map((b64) => `data:image/jpeg;base64,${b64}`),
              createdAt: new Date().toISOString(),
            };
            return {
              ...item,
              reviews: item.reviews ? [newReview, ...item.reviews] : [newReview],
            };
          }
          return item;
        });
        return { ...prev, items: updatedItems };
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review");
    }
  };

if (loading)
  return (
    <div className="flex justify-center items-center py-20">
      <LoadingRing />
    </div>
  );


  const steps = [
  { key: "PENDING", label: "Order Placed", ts: order.createdAt },
  { key: "CONFIRMED", label: "Confirmed", ts: (order as any).confirmedAt },
  { key: "SHIPPED", label: "Shipped", ts: (order as any).shippedAt },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", ts: (order as any).outForDeliveryAt },
  { key: "DELIVERED", label: "Delivered", ts: order.deliveredAt },
];

const currentIndex = steps.findIndex(s => s.key === order.status);



  const calculateEstimatedDelivery = () => {
  if (!order) return "";

  const createdDate = new Date(order.createdAt);
  const estimatedDate = new Date(createdDate);

  // If delivered → show delivered date
  if (order.status === "DELIVERED") {
    const deliveredDate = order.deliveredAt
      ? new Date(order.deliveredAt)
      : new Date(order.updatedAt); // fallback

    return `Delivered on ${deliveredDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }

  // If NOT delivered → estimate based on status
  switch (order.status) {
    case "PENDING":
      estimatedDate.setDate(createdDate.getDate() + 4);
      break;
    case "SHIPPED":
      estimatedDate.setDate(createdDate.getDate() + 2);
      break;
    case "OUT_FOR_DELIVERY":
      estimatedDate.setDate(createdDate.getDate() + 1);
      break;
    default:
      estimatedDate.setDate(createdDate.getDate() + 5);
  }

  // Avoid Sunday delivery → move to Monday
  if (estimatedDate.getDay() === 0) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
  }

  return `Estimated Delivery: ${estimatedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster />
      <main className="flex-1 max-w-4xl w-full mx-auto pt-[80px] pb-[140px] px-4 space-y-6">
        {/* Order Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500">Order ID: {order.id}</div>
            <div
              className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${
                STATUS_TEXT[order.status]?.color || "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_TEXT[order.status]?.text || order.status}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex justify-between items-center text-center mb-4 relative">
  {steps.map((step, idx) => {
    const isCompleted = idx <= currentIndex;

    return (
      <div key={idx} className="flex flex-col items-center w-1/5 relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center
            ${isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          {idx === 2 ? <Truck size={16} /> : idx === 4 ? <Home size={16} /> : "✓"}
        </div>

        {idx !== steps.length - 1 && (
          <div
            className={`absolute top-3 left-1/2 w-full h-[2px] -z-10
              ${idx < currentIndex ? "bg-green-500" : "bg-gray-200"}`}
          />
        )}

        <span className="text-xs mt-1">{step.label}</span>

        {step.ts && (
          <span className="text-[10px] text-gray-500">
            {new Date(step.ts).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    );
  })}
</div>


        {/* Estimated Delivery */}
        <div className="bg-white p-4 border border-gray-200 rounded">
          <div className="text-sm text-gray-700">
           {calculateEstimatedDelivery()}

          </div>
        </div>

        {/* Products & Reviews */}
        <div className="flex flex-col gap-6">
          {order.items.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              orderStatus={order.status}
              currentUserId={currentUserId}
              onSubmitReview={handleSubmitReview}
            />
          ))}
        </div>

        {/* Delivery Address */}
        {order.address && (
          <div className="bg-white p-4 border border-gray-200 rounded">
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            <p>{order.address.name}</p>
            <p>
              {order.address.street}, {order.address.city}, {order.address.state},{" "}
              {order.address.zip}
            </p>
            <p>Phone: {order.address.phone}</p>
          </div>
        )}

        {/* Price Summary */}
        <div className="bg-white p-4 border border-gray-200 rounded">
          <div className="flex justify-between text-gray-700 mb-2">
            <span>Total Amount</span>
            <span className="font-medium">₹{order.totalAmount}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------------- Product Card Component ----------------

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  orderStatus,
  currentUserId,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);

  // Compute review status
  const hasReviewed = useMemo(() => {
    const reviewedProducts = JSON.parse(
      localStorage.getItem("reviewedProducts") || "[]"
    );
    return (
      product.reviews?.some((r) => r.userId === currentUserId) ||
      reviewedProducts.includes(product.id)
    );
  }, [product.reviews, product.id, currentUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (rating === 0) return toast.error("Please select a rating");

    await onSubmitReview(product.id, rating, comment, images);

    const reviewedProducts = JSON.parse(
      localStorage.getItem("reviewedProducts") || "[]"
    );
    if (!reviewedProducts.includes(product.id)) {
      reviewedProducts.push(product.id);
      localStorage.setItem("reviewedProducts", JSON.stringify(reviewedProducts));
    }

    setRating(0);
    setComment("");
    setImages([]);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md flex flex-col gap-4">

      {/* PRODUCT HEADER */}
     <Link
  href={`/product/${product.productId}`}
  className="flex gap-4 items-center hover:bg-gray-50 p-2 rounded cursor-pointer"
>

        <div className="flex-shrink-0 w-28 h-28 flex justify-center items-center">
       <img
  src={
    product.product?.images?.[0] ||   // full product image
    (product as any).image ||         // fallback stored in order item (IMPORTANT FIX)
    "/placeholder.png"
  }
  alt={product.product?.name || product.name}
  className="rounded border bg-gray-50 object-contain w-full h-full"
/>


        </div>

        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-700">{product.name}</h2>

          {product.description && (
            <p className="text-xs text-gray-500">{product.description}</p>
          )}

          <div className="text-xs text-gray-400 mt-1 flex gap-4">
            {product.size && <span>Size: {product.size}</span>}
            <span>Qty: {product.quantity}</span>
          </div>

          <div className="text-sm font-medium text-gray-700 mt-2">
            ₹{product.price * product.quantity}
          </div>
        </div>
      </Link>

      {/* EXISTING REVIEWS */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          <h4 className="font-semibold text-gray-700 text-sm mb-1">Reviews:</h4>
          {product.reviews.map((r) => (
            <div key={r.id} className="mb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-sm ${
                      s <= r.rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-xs text-gray-400 ml-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>

              {r.comment && (
                <p className="text-xs text-gray-600">{r.comment}</p>
              )}

              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 mt-1 overflow-x-auto">
                  {r.images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      width={60}
                      height={60}
                      alt="review image"
                      className="rounded border bg-gray-50 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REVIEW FORM */}
      {orderStatus === "DELIVERED" && !hasReviewed && (
        <div className="mt-2 border-t border-gray-200 pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-xl ${
                  star <= rating ? "text-yellow-500" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a review..."
            className="border border-gray-300 rounded p-2 text-sm w-full"
          />

          <button
            onClick={handleSubmit}
            className="py-2 bg-green-600 text-white rounded text-sm mt-1 hover:bg-green-700"
          >
            Submit Review
          </button>
        </div>
      )}
    </div>
  );
};


