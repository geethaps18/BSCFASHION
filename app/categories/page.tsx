"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { categories, SubCategory } from "@/data/categories";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

// Recursive function to find category path by slug segments
function findCategoryPath(
  segments: string[],
  cats: SubCategory[]
): { current?: SubCategory; path: SubCategory[] } {
  let currentCats = cats;
  const path: SubCategory[] = [];
  let current: SubCategory | undefined;

  for (const seg of segments) {
    current = currentCats.find(
      (c) => c.name.toLowerCase().replace(/\s+/g, "-") === seg
    );
    if (!current) break;
    path.push(current);
    currentCats = current.subCategories;
  }

  return { current, path };
}

// Generate full path slug for a category given its parent path
function getCategorySlug(path: SubCategory[], sub?: SubCategory) {
  const segments = [...path.map((p) => p.name.toLowerCase().replace(/\s+/g, "-"))];
  if (sub) segments.push(sub.name.toLowerCase().replace(/\s+/g, "-"));
  return `/categories/${segments.join("/")}`;
}

// Generate unique key for subcategory
function getCategoryId(sub: SubCategory, parentPath: SubCategory[]): string {
  return [...parentPath.map(p => p.name), sub.name].join("-").toLowerCase().replace(/\s+/g, "-");
}

// Recursive rendering of subcategories
function renderSubItems(subs: SubCategory[], parentPath: SubCategory[]): JSX.Element[] {
  return subs.flatMap((sub) => [
    <div key={getCategoryId(sub, parentPath)} className="flex flex-col items-center text-center group">
      <Link href={getCategorySlug(parentPath, sub)} className="flex flex-col items-center">
        <div className="w-20 h-20 overflow-hidden rounded-lg shadow-sm border">
          <Image
            src={sub.image}
            alt={sub.name}
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <span className="mt-2 text-sm text-gray-600">{sub.name}</span>
      </Link>
    </div>,
    // Render sub-subcategories recursively at same grid level
    ...renderSubItems(sub.subCategories, [...parentPath, sub])
  ]);
}

export default function CategoriesPage() {
  const pathname = usePathname();
  const slugSegments = pathname.replace(/^\/categories\/?/, "").split("/").filter(Boolean);

  const initialMain = slugSegments.length > 0
    ? slugSegments[0].replace(/-/g, " ").toLowerCase()
    : categories[0].name.toLowerCase();

  const [activeMain, setActiveMain] = useState(
    categories.find((c) => c.name.toLowerCase() === initialMain)?.name || categories[0].name
  );

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);

  const handleMainClick = (mainCat: string) => {
    setActiveMain(mainCat);
    const section = sectionRefs.current[mainCat];
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const rightPanel = rightPanelRef.current;
    if (!rightPanel) return;

    const handleScroll = () => {
      let currentActive = activeMain;
      for (const cat of categories) {
        const section = sectionRefs.current[cat.name];
        if (section) {
          const { top } = section.getBoundingClientRect();
          const rightTop = rightPanel.getBoundingClientRect().top;
          if (top - rightTop <= 100) currentActive = cat.name;
        }
      }

      if (rightPanel.scrollTop + rightPanel.clientHeight >= rightPanel.scrollHeight - 5) {
        currentActive = categories[categories.length - 1].name;
      }

      if (currentActive !== activeMain) {
        setActiveMain(currentActive);
        const leftPanel = leftPanelRef.current;
        const activeItem = leftPanel?.querySelector<HTMLLIElement>(
          `li[data-cat="${currentActive}"]`
        );
        activeItem?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    rightPanel.addEventListener("scroll", handleScroll);
    return () => rightPanel.removeEventListener("scroll", handleScroll);
  }, [activeMain]);

  const { path } = findCategoryPath(slugSegments, categories);

  return (
    <div className="flex min-h-screen bg-white pt-16 pb-20">
      {/* Left Panel */}
      <div
        ref={leftPanelRef}
        className="w-1/4 border-r bg-gray-50 overflow-y-auto h-[calc(100vh-4rem-5rem)]"
      >
        <ul className="grid grid-cols-1 gap-6 p-4">
          {categories.map((cat) => (
            <li
              key={cat.name}
              data-cat={cat.name}
              onClick={() => handleMainClick(cat.name)}
              onMouseEnter={() => handleMainClick(cat.name)}
              className={`flex flex-col items-center cursor-pointer text-xs font-medium transition ${
                activeMain === cat.name
                  ? "text-yellow-600"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-lg overflow-hidden border shadow-sm mb-1 transition ${
                  activeMain === cat.name
                    ? "ring-2 ring-yellow-500"
                    : "hover:ring-1 hover:ring-gray-300"
                }`}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-center">{cat.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Panel */}
      <div
        ref={rightPanelRef}
        className="w-3/4 overflow-y-auto p-4 space-y-8 h-[calc(100vh-4rem-5rem)]"
      >
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-500">
          <Link href="/categories" className="hover:text-green-600">Categories</Link>
          {path.map((p, idx) => (
            <span key={getCategoryId(p, path.slice(0, idx))}>
              {" > "}
              {idx === path.length - 1 ? (
                <span className="font-semibold text-gray-800">{p.name}</span>
              ) : (
                <Link
                  href={`/categories/${path.slice(0, idx + 1).map((s) => s.name.toLowerCase().replace(/\s+/g, "-")).join("/")}`}
                  className="hover:text-green-600"
                >
                  {p.name}
                </Link>
              )}
            </span>
          ))}
        </div>

        {categories.map((cat) => {
          const isActive = activeMain === cat.name;
          return (
            <div
              key={cat.name}
              ref={(el) => { sectionRefs.current[cat.name] = el; }}
              className={`space-y-4 scroll-mt-20 rounded-lg p-3 transition ${
                isActive ? "bg-yellow-50 border border-yellow-200" : ""
              }`}
            >
              <h2 className={`text-lg font-semibold border-b pb-1 ${isActive ? "text-yellow-700" : "text-gray-800"}`}>
                {cat.name}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {renderSubItems(cat.subCategories, [cat])}
              </div>
            </div>
          );
        })}
        <Header/>
        <Footer />
      </div>
    </div>
  );
}
