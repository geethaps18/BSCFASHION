export interface ProductVariantCard {
  id: string;
  size: string;
  stock: number;
  price: number;
}

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number;

  mrp?: number;          // ✅ make optional
  discount?: number;

  images: string[];

  sizes?: string[];      // legacy fallback
  variants?: {
    id: string;
    size: string;
    stock: number;
  }[];

  brandName?: string;
  rating?: number;
  reviewCount?: number;


}
