"use client";

import { useState } from "react";
import Slider from "react-slick";
import RecentProductCard from "@/components/home/RecentProductCard";

function NextArrow({ onClick, show }: any) {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2
                 bg-white border w-10 h-10 items-center justify-center
                 shadow-sm z-10"
      aria-label="Next"
    >
      →
    </button>
  );
}

function PrevArrow({ onClick, show }: any) {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2
                 bg-white border w-10 h-10 items-center justify-center
                 shadow-sm z-10"
      aria-label="Previous"
    >
      ←
    </button>
  );
}

export default function RecentProductsSlider({ products }: { products: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const DESKTOP_SLIDES = 4;
  const maxSlideIndex = products.length - DESKTOP_SLIDES;

  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: DESKTOP_SLIDES,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,

    beforeChange: (_: number, next: number) => {
      setCurrentSlide(next);
    },

    nextArrow: (
      <NextArrow show={currentSlide < maxSlideIndex} />
    ),
    prevArrow: (
      <PrevArrow show={currentSlide > 0} />
    ),

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          arrows: false, // ❌ no arrows on mobile/tablet
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2.2, // 👈 peek
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1.2, // 👈 strong peek
          arrows: false,
        },
      },
    ],
  };

  return (
    <section className="px-4 py-6">
      <h2 className="text-[22px] font-medium text-gray-900 mb-4">
        New Arrivals
      </h2>

      {/* Peek only on mobile */}
      <div className="relative -mr-4 lg:mr-0">
        <Slider {...settings}>
          {products.map((product) => (
            <div key={product.id} className="pr-3">
              <RecentProductCard product={product} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
