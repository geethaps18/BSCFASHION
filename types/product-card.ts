export interface ProductCardProduct {
  id: string;
  name: string | null;
  images: string[];
  price: number;
  mrp?: number | null;
  discount?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  sizes?: string[];
  brandName?: string;
}
