// types/product.ts
export interface Product {
  id: string;
  name: string;
  mrp:number;
  discount:number;
  description?: string;
  price: number;
  category?: string; // optional
  images?: string[]; // <-- array of image URLs
}
