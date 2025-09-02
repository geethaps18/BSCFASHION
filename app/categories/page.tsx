import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

const categories = [
  { name: "Men", image: "/images/men.png" },
  { name: "Women", image: "/images/saree.png" },
  { name: "Western", image: "/images/western.png" },
  { name: "Kids", image: "/images/kids.png" },
  { name: "Home", image: "/images/home.png" },
  { name: "Toys", image: "/images/toys.png" },
  { name: "Groom Collection", image: "/images/groom.png" },
  { name: "Bridal Collection", image: "/images/bridal.png" },
  { name: "Festive Kids", image: "/images/festive-kids.png" },
  { name: "Heritage Sarees", image: "/images/heritage.png" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Categories
      </h1>
<Footer/>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/categories/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="group relative block rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
          >
            {/* Full background image */}
            <div className="relative w-full h-35 sm:h-66 md:h-56 lg:h-64">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Overlay with category name */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition">
              <span className="text-white text-lg font-semibold text-center">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
