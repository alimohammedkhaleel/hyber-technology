/**
 * Type Definitions for Hyper Technology Store
 */

export type PricingMode = 'FIXED_EGP' | 'USD_LINKED';

export interface CalculatedPricing {
  sellingPriceEgp: number;
  calculatedBaseEgp: number;
  oldPriceEgp?: number;
  discountPercent: number;
  pricingMode: PricingMode;
  baseCost: number;
  baseCurrency: string;
  profitMarginPercent: number;
  effectiveRate: number;
}

export interface Product {
  id: string;
  category_id?: string;
  category_name_ar?: string;
  category_name_en?: string;
  category_slug?: string;
  category_name?: string;
  brand_id?: string;
  brand_name?: string;
  name_ar: string;
  name_en: string;
  name?: string;
  sku: string;
  description_ar?: string;
  description_en?: string;
  description?: string;
  image_url?: string;
  main_image_url?: string;
  images?: string[];
  pricing_mode: PricingMode;
  base_cost: number;
  base_currency: 'EGP' | 'USD';
  profit_margin_percent: number;
  manual_egp_price: number;
  old_price?: number;
  discount_percent: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_active: boolean;
  specifications: Record<string, any>;
  warranty_info?: string;
  warranty_months?: number;
  usd_price?: number;
  manual_usd_price?: number;
  calculated_price_egp?: number;
  base_price?: number;
  created_at: string;
  updated_at?: string;
  pricing?: CalculatedPricing;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name?: string;
  slug: string;
  image_url?: string;
  icon_name?: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CarouselSlide {
  id: string;
  title_ar: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url: string;
  button_text_ar?: string;
  link_url?: string;
  product_id?: string;
  product_name_ar?: string;
  category_id?: string;
  category_name_ar?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface GovernorateShippingRate {
  id: string;
  nameAr: string;
  fee: number;
}

export interface StoreSettings {
  id: number;
  store_name_ar: string;
  store_name_en: string;
  supervisor_name_ar: string;
  phone: string;
  address_ar: string;
  working_hours_ar: string;
  cod_enabled: boolean;
  instapay_enabled: boolean;
  instapay_info: string;
  vodafone_cash_enabled: boolean;
  vodafone_cash_info: string;
  usd_egp_rate_auto_update: boolean;
  shipping_rates?: GovernorateShippingRate[];
  updated_at?: string;
}

export interface ExchangeRateRecord {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_at: string;
  source: string;
  is_manual_override: boolean;
  changed_by?: string;
  changed_by_phone?: string;
  notes?: string;
  created_at: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_VERIFICATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFICATION'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REFUNDED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'INSTAPAY' | 'VODAFONE_CASH';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStatusHistoryItem {
  id: number;
  previous_status?: string;
  new_status: string;
  changed_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  payer_phone?: string;
  payment_proof_url?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  payment_verification_notes?: string;
  order_status: OrderStatus;
  exchange_rate_used?: number;
  internal_admin_notes?: string;
  items_count?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistoryItem[];
}

export interface CartItem {
  id: string;
  productId: string;
  nameAr: string;
  nameEn?: string;
  sku: string;
  imageUrl?: string;
  stockQuantity: number;
  isAvailable: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pricing?: CalculatedPricing;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  address: string;
  area: string;
  city: string;
  building?: string;
  floor?: string;
  apartment?: string;
  delivery_notes?: string;
  deliveryNotes?: string;
  is_default: boolean;
  isDefault?: boolean;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  account_status: string;
  auth_phone?: string;
  auth_email?: string;
  orders_count?: number;
  total_spent?: number;
  registered_at?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
}

export type ProductCategory = Category;
export type ExchangeRate = ExchangeRateRecord;

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  body?: string;
  type?: string;
  is_read: boolean;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AdminMetrics {
  todayOrders: number;
  pendingPaymentVerifications: number;
  lowStockItems: number;
  totalActiveProducts: number;
  totalCustomers: number;
  totalRevenueEgp: number;
  currentUsdRate: number;
  rateLastUpdated: string;
  isManualOverride: boolean;
}

export interface AuditLog {
  id: number;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  title_ar?: string;
  desc_ar?: string;
  badge_color?: string;
}
