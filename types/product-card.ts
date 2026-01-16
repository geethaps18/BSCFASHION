export interface ProductVariantCard {
  id: string;
  size: string;
  stock: number;
  price: number;
}

export type ProductCardProduct = {
  id: string;
  name: string;
  price: number;
  mrp?: number | null;
  discount?: number | null;
  images: string[];
  brandName?: string; // 🔥 FINAL DISPLAY VALUE
  variants?: {
    size?: string | null;
    stock?: number | null;
  }[];
  rating?: number;
  reviewCount?: number;
};

