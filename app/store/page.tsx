"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Globe, Search, Tag } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

interface Store {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  mapUrl: string;
  categories: string[]; // ✅ Added categories
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
    <div className="py-8 ">
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col">
      <div className="max-w-6xl mx-auto flex-1">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center mb-6">
         🏬 Our Stores
        </h1>

        {/* Search Bar */}
        <div className="flex items-center max-w-md mx-auto bg-white border rounded-full px-4 py-2 shadow-sm mb-10">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, city or area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 outline-none bg-transparent text-gray-700"
          />
        </div>

        {/* Store Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.length > 0 ? (
            filteredStores.map((store, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold mb-2">{store.name}</h2>
                  <p className="flex items-start text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
                    {store.address}
                  </p>
                  <p className="flex items-center text-gray-600 text-sm mb-1">
                    <Phone className="w-4 h-4 mr-2 text-green-600" />
                    {store.phone !== "NA" ? (
                      <a
                        href={`tel:${store.phone}`}
                        className="hover:underline text-gray-700"
                      >
                        {store.phone}
                      </a>
                    ) : (
                      <span className="text-gray-500">Contact soon</span>
                    )}
                  </p>
                  <p className="flex items-center text-gray-600 text-sm mb-1">
                    <Mail className="w-4 h-4 mr-2 text-green-600" />
                    <a
                      href={`mailto:${store.email}`}
                      className="hover:underline text-gray-700"
                    >
                      {store.email}
                    </a>
                  </p>
                  {store.website && (
                    <p className="flex items-center text-gray-600 text-sm mb-2">
                      <Globe className="w-4 h-4 mr-2 text-green-600" />
                      <Link
                        href={store.website}
                        target="_blank"
                        className="hover:underline"
                      >
                        Visit Website
                      </Link>
                    </p>
                  )}

                  {/* Categories Section */}
                  <div className="mt-3">
                    <p className="flex items-center text-gray-700 font-medium mb-1">
                      <Tag className="w-4 h-4 mr-2 text-green-600" />
                      Available Sections
                    </p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {store.categories.map((cat, i) => (
                        <li key={i}>{cat}</li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={store.mapUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 mt-auto px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No stores found for "{query}". Try searching by city like
              "Davangere", "Belagavi" or "Ichalkaranji".
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
    </div>
  );
}
