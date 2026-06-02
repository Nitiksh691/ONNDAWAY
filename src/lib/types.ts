export type UserRole = "user" | "delivery" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  college: string;
  year: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  orderCount?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "coffee" | "snacks" | "meals" | "drinks" | "desserts";
  orderCount: number;
  available: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  isBanner?: boolean;
  originalPrice?: number;
  section?: string;
  createdAt?: string;
}

export interface CartItem {
  cartItemId: string; // Unique ID for each cart item instance
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export type OrderStatus = "placed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: CartItem[];
  location: string;
  total: number;
  couponCode?: string;
  discount?: number;
  status: OrderStatus;
  confirmed?: boolean;
  scheduledTime?: string;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryOtp?: string;
  messages?: { sender: "user" | "delivery"; text: string; timestamp: string }[];
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "flat";
  firstOrderOnly: boolean;
  active: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Rating {
  orderId: string;
  userId: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface DeliveryPerson {
  uid: string;
  name: string;
  phone: string;
  email: string;
  activeOrders: string[];
}

export const CAMPUS_LOCATIONS = [
  "Main Gate",
  "Library Block",
  "Engineering Block A",
  "Engineering Block B",
  "Science Block",
  "Hostel Block 1",
  "Hostel Block 2",
  "Sports Complex",
  "Cafeteria",
  "Admin Block",
  "Auditorium",
];

export const COLLEGES = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "BITS Pilani",
  "NIT Trichy",
  "NIT Warangal",
  "VIT Vellore",
  "Manipal Institute",
  "Christ University",
  "Amity University",
  "Other (Type below)",
];

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "PG / Masters", "PhD"];
