export type FoodType = 'VEG' | 'NON_VEG' | 'VEGAN';
export type TasteProfile = 'SWEET' | 'SPICY' | 'SALTY' | 'SOUR';
export type OriginType = 'INDIAN' | 'INTERNATIONAL';

export type OrderStatus =
  | 'ORDER_RECEIVED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type CouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';
export type SnackpointTransactionType = 'EARN' | 'REDEEM' | 'PENDING_EARN';
export type SnackpointTransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type NotificationType = 'INFO' | 'ORDER' | 'SNACKPOINTS' | 'COUPON' | 'ADMIN_MESSAGE' | 'OFFER';
export type AdminMessageType = 'INCORRECT_DETAILS' | 'INCORRECT_MOBILE' | 'INCORRECT_ROOM' | 'CUSTOM';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category;
  price: number;
  originalPrice: number | null;
  discount: number;
  imageUrl: string;
  stock: number;
  available: boolean;
  brand: string | null;
  rating: number;
  foodType: FoodType;
  taste: TasteProfile;
  origin: OriginType;
  tags: string;
  isTrending: boolean;
  isHalfPrice: boolean;
  earnSnackpoints: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  hostel: string;
  roomNumber: string;
  deliveryNote: string | null;
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  couponId: string | null;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  freeDeliveryApplied: boolean;
  deliveryThresholdAtOrder: number;
  snackpointsEarned: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  block: string | null;
  roomNumber: string | null;
  availableSnackpoints: number;
  pendingSnackpoints: number;
  totalEarned: number;
  totalRedeemed: number;
  createdAt: string;
  updatedAt: string;
}

export interface SnackpointTransaction {
  id: string;
  customerId: string;
  orderId: string | null;
  points: number;
  type: SnackpointTransactionType;
  status: SnackpointTransactionStatus;
  description: string;
  createdAt: string;
  order?: Order;
}

export interface Coupon {
  id: string;
  customerId: string;
  pointsSpent: number;
  value: number;
  status: CouponStatus;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedOrderId: string | null;
}

export interface SnackNotification {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface AdminMessage {
  id: string;
  customerId: string;
  orderId: string | null;
  adminUser: string;
  message: string;
  messageType: AdminMessageType;
  read: boolean;
  createdAt: string;
  customer?: Customer;
  order?: Order;
}

export interface StoreSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  active: boolean;
  createdAt: string;
}

export interface DeliverySettings {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  annexDeliveryEnabled: boolean;
  noyyalNewDeliveryEnabled: boolean;
  noyyalDeliveryEnabled: boolean;
}

export interface ProductFilters {
  query?: string;
  categorySlug?: string;
  categoryId?: string;
  foodType?: string;
  taste?: string;
  origin?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  isTrending?: boolean;
  isHalfPrice?: boolean;
  earnSnackpoints?: boolean;
  sortBy?: 'recommended' | 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount' | 'snackpoints';
}

// SnackPoints redemption tiers
export const SNACKPOINT_TIERS = [
  { points: 100, value: 5 },
  { points: 200, value: 10 },
  { points: 300, value: 15 },
  { points: 400, value: 20 },
] as const;

export const MAX_COUPON_DISCOUNT = 20;
export const COUPON_VALIDITY_DAYS = 7;

// Hostel blocks
export const HOSTEL_BLOCKS_CONFIG = [
  { name: 'Annex', timing: 'Fixed Time' },
  { name: 'Noyyal New', timing: 'Anytime' },
  { name: 'Noyyal', timing: 'Anytime' },
] as const;
