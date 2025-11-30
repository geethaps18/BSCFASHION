export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";

export interface Address {
  type: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  doorNumber?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string;
  images?: string[];
  price: number;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  size?: string | null;
}

export interface Order {
  id: string;
  user?: { name?: string; email?: string };
  address?: Address;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMode: string;
}
