export interface ColorOption {
  name: string;
  hex: string;
}

//export interface ProductVariant {
  //sizes: string[];
  //colors: ColorOption[];
  //price: number;
  //mrp?: number;
  //discount?: number;
  //images: string[];
  //stock: number;
  //design?: string;
  
  export type ProductVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  stock?: number;
  images?: string[];
};


export interface Product {
  id: string;
  name: string;
  brandName?:string;
  siteId: string;  
  description?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  price: number;
  mrp?: number;
  discount?: number;
  
  images: string[];

  sizes?: string[];
  //variants?: ProductVariant[];
  createdAt: string;   // API
  rating?: number;
  reviewCount: number; 
  reviews?: Review[];
  
 
}
export interface Review {
  id?: string;           // Review ID
  name?: string;         // User name
  rating: number;        // 1-5
  comment?: string;      // Optional comment
  images?: string[];     // Optional images array
  createdAt:string;
  userName:string;
}

