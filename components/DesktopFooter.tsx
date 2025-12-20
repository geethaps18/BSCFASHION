"use client";

import Link from "next/link";

export default function DesktopFooter() {
  return (
    <footer className="hidden lg:block bg-gray-50 border-t mt-24">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-4 gap-12 text-sm text-gray-600">

        {/* BRAND */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-wide">
            BSCFASHION
          </h2>

          <p className="mt-2 font-medium text-gray-800">
            B.S. Channabasappa & Sons
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Since 1938 · Trusted by Generations
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            Discover timeless sarees, men’s wear, kids’ wear, and home essentials —
            <span className="block font-semibold mt-1">
              ಬಟ್ಟೆ ಅಂದರೆ BSC.
            </span>
          </p>
        </div>

        {/* CUSTOMER CARE */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            CUSTOMER CARE
          </h4>
          <ul className="space-y-3">
            <li>
              <Link href="/store" className="hover:text-black">
                Stores & Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-black">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-black">
                Returns
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-black">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-black">
                Track Order
              </Link>
            </li>
          </ul>
        </div>

        {/* POLICIES */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            POLICIES
          </h4>
          <ul className="space-y-3">
            <li>
              <Link href="/privacy-policy" className="hover:text-black">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-and-conditions" className="hover:text-black">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-black">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-black">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* CONTACT INFO */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            CONTACT
          </h4>
          <p>Email: support@bscfashion.com</p>
          <p className="mt-2">Phone: +91 XXXXX XXXXX</p>
          <p className="mt-2">Karnataka, India</p>
        </div>

      </div>

      <div className="border-t py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} B.S. Channabasappa & Sons. All rights reserved.
      </div>
    </footer>
  );
}
