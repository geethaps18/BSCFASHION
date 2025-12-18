"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

function OurStory() {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* Header */}
      <Header />

      {/* Page Content */}
      <div className="flex-grow">

        {/* Logo */}
        <div className="w-full flex justify-center mt-16">
          <Image
            src="/images/logo.png"
            alt="BSC Fashion Logo"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center py-4">Our Story</h1>

        {/* Story Content */}
        <p className="text-sm px-6 leading-relaxed text-gray-700 pb-20">

          B.S. Channabasappa & sons, established in 1938, is one of the most trusted
          brands for clothing in Karnataka.

          <br /><br />

          B.S. Nanjundappa, the founder, started selling clothes with a strict moral
          code. He believed that the customer is God, and they have to be given the
          best. This policy stuck with B.S.C. He named the store after his son
          B.S. Channabasappa, who followed in his father’s footsteps.

          <br /><br />

          Both of them believed in ethics and morals in business. As a result,
          B.S. Channabasappa & Sons developed generations of loyal customers. It became
          a tradition to shop for weddings at B.S.C. — there are generations of marriages
          shopped here.

          <br /><br />

          B.S.C. now has over 100,000 sq ft of stores and is one of the biggest clothing
          businesses in Karnataka.

          <br /><br />

          <strong>Third Generation & Fourth Generation</strong>

          <br /><br />

          B.C. Umapthy joined young and helped build the legacy along with his father
          and grandfather.

          <br /><br />

          B.C. Chandrashekar worked passionately to make B.S.C a household name in Karnataka.

          <br /><br />

          B.C. Shivakumar expanded the men’s clothing section and introduced several new
          clothing categories.

          <br /><br />

          <strong>Fourth Generation:</strong>

          <br /><br />

          B.U.C. Shekar led the introduction of readymade clothing and modernized various
          sections.

          <br /><br />

          B.C. Vivek and B.S. Mrunal continue the legacy while adopting modern business
          ideas — always prioritizing customer satisfaction and quality.

          <br /><br />

          By 2022, B.S.C expanded into four branches, three of which are in Davangere.

          <br /><br />

          <strong>USP:</strong>  
          Wide variety of products under one roof, high quality at the best prices.
        </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default OurStory;
