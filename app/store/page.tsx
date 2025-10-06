"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { FiMapPin, FiPhone, FiMail, FiGlobe, } from "react-icons/fi";
import { AiOutlineTag } from "react-icons/ai";
import { MdStoreMallDirectory } from "react-icons/md";
import { Search } from "lucide-react";
import Header from "@/components/Header";

interface Store {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  mapUrl: string;
  categories: string[];
}

const stores: Store[] = [
  {
    name: "Textile Super Market (Main Store)",
    address:
      "5 6/1, 1189/1, 1196, 1194/2B3, 1 1194/B 15, Kalikadevi Road, Davangere – 577001",
    city: "Davangere",
    phone: "9770808020",
    email: "hello@bschfashion.com",
    mapUrl:
      "https://www.google.com/maps/search/B.S.+Channabasappa+%26+Sons,+Kalikadevi+Road,+Davangere",
    categories: [
      "Sarees",
      "Men’s Wear",
      "Ladies Wear",
      "Kids Wear",
      "Toys",
      "Home Furnishings",
      "Accessories",
    ],
  },
  {
    name: "BSC Exclusive",
    address:
      "Opposite Bapuji Dental College, Vinayaka Nagara, Davangere – 577004",
    city: "Davangere",
    phone: "08192 272180 / 7899777187",
    email: "hello@bschfashion.com",
    mapUrl:
      "https://www.google.com/maps/search/BSC+Exclusive,+Vinayaka+Nagara,+Davangere",
    categories: ["Exclusive Sarees", "Designer Wear", "Ladies Wear"],
  },
  {
    name: "BSC @ P.J. Extension",
    address: "AVK College Road, P.J. Extension, Davangere – 577001",
    city: "Davangere",
    phone:
      "Ladies & Kids: 08192 272175 / 9900077222 | Men’s: 08292 272178 / 9900066222",
    email: "hello@bschfashion.com",
    mapUrl:
      "https://www.google.com/maps/search/BSC+P.J.+Extension,+Davangere",
    categories: ["Ladies Wear", "Kids Wear", "Men’s Wear"],
  },
  {
    name: "BSC The Textile Mall @ Belagavi",
    address: "1st Gate Road, Shukrawar Peth Rd, Tilakwadi, Belagavi – 590006",
    city: "Belagavi",
    phone: "08312007777",
    email: "hello@bschfashion.com",
    mapUrl:
      "https://www.google.com/maps/search/BSC+The+Textile+Mall,+Belagavi",
    categories: [
      "Sarees",
      "Men’s Wear",
      "Ladies Wear",
      "Kids Wear",
      "Toys",
      "Home Furnishings",
      "Accessories",
    ],
  },
  {
    name: "BSC @ Ichalkaranji",
    address:
      "Kapad Market, 10/278, 1st Floor, Ichalkaranji, Kolhapur, Maharashtra – 416115",
    city: "Ichalkaranji",
    phone: "NA",
    email: "hello@bschfashion.com",
    mapUrl:
      "https://www.google.com/maps/search/BSC+Ichalkaranji,+Kolhapur",
    categories: ["Sarees", "Men’s Wear", "Ladies Wear", "Kids Wear"],
  },
];

export default function StoresPage() {
  const [query, setQuery] = useState("");

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(query.toLowerCase()) ||
      store.city.toLowerCase().includes(query.toLowerCase()) ||
      store.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="max-w-6xl mx-auto flex-1 py-16 px-4">
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-serif text-center mb-10 text-gray-900 flex items-center justify-center gap-2">
          <MdStoreMallDirectory className="w-8 h-8 text-gray-900" />
          Our Stores
        </h1>

        {/* Search Bar */}
        <div className="flex items-center max-w-md mx-auto bg-white border border-gray-200 rounded-full px-4 py-2 mb-14 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, city or area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Store Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredStores.length > 0 ? (
            filteredStores.map((store, index) => (
              <div
                key={index}
                className="bg-transparent border border-gray-200 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900">
                    {store.name}
                  </h2>
                  <p className="flex items-start text-gray-700 text-sm mb-2">
                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    {store.address}
                  </p>
                  <p className="flex items-center text-gray-700 text-sm mb-1">
                    <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                    {store.phone !== "NA" ? (
                      <a href={`tel:${store.phone}`} className="hover:underline">
                        {store.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Contact soon</span>
                    )}
                  </p>
                  <p className="flex items-center text-gray-700 text-sm mb-1">
                    <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${store.email}`} className="hover:underline">
                      {store.email}
                    </a>
                  </p>
                  {store.website && (
                    <p className="flex items-center text-gray-700 text-sm mb-2">
                      <FiGlobe className="w-4 h-4 mr-2 text-gray-400" />
                      <Link href={store.website} target="_blank" className="hover:underline">
                        Visit Website
                      </Link>
                    </p>
                  )}

                  {/* Categories */}
                  <div className="mt-4">
                    <p className="flex items-center text-gray-900 font-medium mb-2">
                      <AiOutlineTag className="w-4 h-4 mr-2 text-gray-400" />
                      Available Sections
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {store.categories.map((cat, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-800 text-xs sm:text-sm px-2 py-1"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Luxury Map Button */}
                  <Link
                    href={store.mapUrl}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 text-sm font-semibold bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 text-gray-900 rounded-md shadow-lg hover:shadow-xl transition"
                  >
                    <FiMapPin className="w-5 h-5" />
                    View on Map
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-700 col-span-full">
              No stores found for "{query}". Try searching by city like
              "Davangere", "Belagavi" or "Ichalkaranji".
            </p>
          )}
        </div>
      </div>
      <Header/>
      <Footer />
    </div>
  );
}
