"use client";
import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full h-[55vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-start justify-center text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bsc.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl px-6 text-center flex flex-col items-center justify-start mt-2 sm:mt-12 md:mt-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
          BSCFASHION
        </h1>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mt-2">
          Since 1938. Trusted by Generations.
        </h2>
        <p className="mt-3 text-sm sm:text-base md:text-lg max-w-xl">
          Discover timeless sarees, men’s wear, kids’ wear, and home essentials —{" "}
          <span className="font-semibold">ಬಟ್ಟೆ ಅಂದರೆ BSC.</span>
        </p>

        {/* Buttons */}
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <Link
            href="/shop"
            className="bg-white/20 hover:bg-white/30 border border-white text-white px-5 py-2 rounded-full font-semibold text-sm sm:text-base"
          >
            Shop Now
          </Link>
          <Link
            href="/ourstory"
            className="bg-white/20 hover:bg-white/30 border border-white text-white px-5 py-2 rounded-full font-semibold text-sm sm:text-base"
          >
            Our Story
          </Link>
        </div>
      </div>
    </section>
  );
}
