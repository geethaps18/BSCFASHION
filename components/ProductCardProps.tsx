import React from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-200">
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="p-4 flex flex-col justify-between h-40">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          <p className="text-sm text-gray-600 mt-2">
            {product.description?.substring(0, 60)}...
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-green-600 font-bold text-lg">₹{product.price}</span>
          <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
