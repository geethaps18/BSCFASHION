"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiCheck, FiChevronLeft } from "react-icons/fi";
import { ArrowBigLeft, ArrowLeft } from "lucide-react";

export default function CheckoutStepper() {
  const pathname = usePathname();
  const router = useRouter();

  const steps = [
    { label: "Bag", path: "/bag", section: "SHOPPING BAG" },
    { label: "address", path: "/checkout/address", section: "ADDRESS" },
    { label: "Payment", path: "/checkout/payment", section: "PAYMENT METHOD" },
  ];

  const activeIndex = steps.findIndex((step) => pathname.startsWith(step.path));

  return (
    <div className="sticky top-0 z-20 bg-white shadow-md">
      {/* Section Title with Back Arrow */}
      <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 font-semibold text-base sm:text-lg border-b border-gray-200 bg-white">
        <button
          onClick={() => router.back()}
          className="mr-2 p-1 rounded hover:bg-gray-100 transition"
        >
          <ArrowLeft className="text-gray-600 text-lg sm:text-xl" />
        </button>
        {activeIndex >= 0 ? steps[activeIndex].section : ""}
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center px-2 sm:px-4 py-3 relative">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;

          return (
            <div
              key={step.path}
              className="flex-1 flex flex-col items-center relative min-w-0"
            >
              {/* Mobile connecting line */}
              {index !== steps.length - 1 && (
                <div className="absolute top-3 left-1/2 w-full h-0.5 z-0 sm:hidden">
                  <div
                    className={`absolute top-0 left-0 h-0.5 ${
                      index < activeIndex ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                    style={{ width: "100%" }}
                  ></div>
                </div>
              )}

              {/* Circle */}
              <button
                onClick={() =>
                  index === 0 ? router.back() : router.push(step.path)
                }
                className={`w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center rounded-full z-10 border-2 transition-colors duration-200
                  ${isCompleted ? "bg-yellow-400 border-yellow-400 text-white" : ""}
                  ${isActive ? "border-yellow-400 text-yellow-600 font-semibold" : ""}
                  ${!isActive && !isCompleted ? "border-gray-300 text-gray-400" : ""}
                `}
              >
                {isCompleted ? <FiCheck className="text-white font-bold" /> : index + 1}
              </button>

              {/* Label */}
              <span
                className={`mt-1 sm:mt-2 text-[8px] xs:text-[9px] sm:text-xs text-center truncate w-full min-w-0 ${
                  isActive
                    ? "text-yellow-600 font-semibold"
                    : isCompleted
                    ? "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                {step.label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
