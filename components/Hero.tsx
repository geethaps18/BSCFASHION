"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Slider from "react-slick";

export default function Hero() {
  const router = useRouter();

  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4500,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: false,
  };

  const slides = [
    { src: "/images/slide1.png", href: "/categories/saree" },
    { src: "/images/slide2.png", href: "/categories/western" },
    { src: "/images/slide3.png", href: "/categories/men" },
    { src: "/images/slide4.png", href: "/categories" },
  ];

  return (
    <section
      className="
        w-full overflow-hidden
        min-h-auto
        md:min-h-[calc(100vh-96px)]
      "
    >
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full cursor-pointer hover:opacity-95 transition"
            onClick={() => router.push(slide.href)}
          >
            <Image
              src={slide.src}
              alt={`BSC Hero Slide ${index + 1}`}
              width={1920}
              height={920}
              priority={index === 0}
              className="w-full h-auto object-contain block"
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}
