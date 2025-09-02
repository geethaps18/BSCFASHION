"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        className="rounded-xl overflow-hidden"
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative group">
              <Image
                src={img}
                alt={`${name}-${idx}`}
                width={500}
                height={500}
                className="object-cover w-full h-[500px] transform transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
