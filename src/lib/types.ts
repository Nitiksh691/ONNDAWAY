export type UserRole = "user" | "delivery" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  college: string;
  year: string;
  phone: string;
  image?: string;
  gender?: string;
  role: UserRole;
  createdAt: string;
  orderCount?: number;
}

export interface CustomizationOption {
  name: string;
  price: number;
}

export interface CustomizationCategory {
  name: string;
  options: CustomizationOption[];
  required?: boolean;
  multiple?: boolean;
}

export interface SelectedCustomization {
  category: string;
  option: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  orderCount: number;
  available: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  isBanner?: boolean;
  sortOrder?: number;
  isLaunchingSoon?: boolean;
  originalPrice?: number;
  section?: string;
  customizationCategories?: CustomizationCategory[];
  createdAt?: string;
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
  selectedCustomizations?: SelectedCustomization[];
  unitPrice?: number;
  /** Full readable summary: customizations + special notes (stored on orders). */
  lineDetails?: string;
}

export type OrderStatus = "payment_pending" | "placed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: CartItem[];
  location: string;
  locationNotes?: string;
  latitude?: number | null;
  longitude?: number | null;
  total: number;
  couponCode?: string;
  discount?: number;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  paymentMethod: "COD" | "RAZORPAY";
  paymentInitializationStatus?: "PENDING" | "SUCCESS" | "FAILED";
  razorpayOrderId?: string;
  paymentAttempts?: { attemptId: string; status: string; method: string; createdAt: string }[];
  scheduledTime?: string;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryOtp?: string;
  messages?: { sender: "user" | "delivery"; text: string; timestamp: string }[];
  rating?: number;
  review?: string;
  feedback?: string;
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
