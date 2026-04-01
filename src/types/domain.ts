// ─── Locale & Translation ─────────────────────────────────────────
// BRD §3.2.1 — exhaustiveness checked at compile time
export type LocaleCode = 'en' | 'bn-BD' | 'sv';

export const LOCALE_CODES: readonly LocaleCode[] = ['en', 'bn-BD', 'sv'] as const;
export const DEFAULT_LOCALE: LocaleCode = 'en';

// BRD §6.1 — JSONB translation columns typed as TranslationMap
export type TranslationMap<T = string> = Partial<Record<LocaleCode, T>>;

// ─── Currency ─────────────────────────────────────────────────────
// BRD §3.3
export type CurrencyCode = 'USD' | 'EUR' | 'BDT' | 'SEK';

export const LOCALE_CURRENCY_MAP: Record<LocaleCode, CurrencyCode> = {
  en: 'USD',
  'bn-BD': 'BDT',
  sv: 'SEK',
};

// ─── Locale Config ────────────────────────────────────────────────
// BRD §3.2.1 table
export interface LocaleConfig {
  code: LocaleCode;
  language: string;
  script: 'Latin' | 'Bengali';
  direction: 'LTR';
  isDefault: boolean;
  isActive: boolean;
}

// ─── User / Profile ──────────────────────────────────────────────
// BRD §6.1 — extends auth.users
export type UserRole = 'customer' | 'administrator' | 'store_manager' | 'support_agent';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  language_pref: LocaleCode;
  currency_pref: CurrencyCode;
  role: UserRole;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Product ──────────────────────────────────────────────────────
// BRD §6.1
export interface Product {
  id: string;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  short_description: TranslationMap;
  meta_title: TranslationMap;
  meta_description: TranslationMap;
  category_id: string | null;
  product_type: 'physical' | 'digital';
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  variants?: ProductVariant[];
  images?: ProductImage[];
  category?: Category;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: TranslationMap;
  prices: Record<CurrencyCode, number>; // amount in smallest unit (cents/paisa/öre)
  sale_prices: Record<CurrencyCode, number> | null;
  sale_start: string | null;
  sale_end: string | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: TranslationMap;
  sort_order: number;
}

// ─── Category ─────────────────────────────────────────────────────
// BRD §6.1
export interface Category {
  id: string;
  parent_id: string | null;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  meta_title: TranslationMap;
  meta_description: TranslationMap;
  is_active: boolean;
  sort_order: number;
}

// ─── Cart ─────────────────────────────────────────────────────────
// BRD §3.5.1
export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  // Joined
  variant?: ProductVariant;
  product?: Product;
}

export interface Cart {
  id: string;
  user_id: string | null;
  locale: LocaleCode;
  currency: CurrencyCode;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// ─── Order ────────────────────────────────────────────────────────
// BRD §3.7
export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  locale: LocaleCode;          // BRD §3.7 — locale at time of purchase
  currency: CurrencyCode;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  stripe_payment_intent_id: string | null;
  shipping_address: Address;
  billing_address: Address;
  email: string;
  created_at: string;
  updated_at: string;
  // Relations
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: TranslationMap;
  variant_name: TranslationMap;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ─── Address ──────────────────────────────────────────────────────
// BRD §3.4 — adapts for BD vs SE vs intl
export interface Address {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  state_province?: string;     // division for BD
  district?: string;           // BD-specific
  thana?: string;              // BD-specific
  postort?: string;            // SE-specific
  postal_code: string;
  country: string;
  phone?: string;
}

// ─── Return / RMA ─────────────────────────────────────────────────
// BRD §3.8
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'info_requested' | 'received' | 'refunded';

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  status: ReturnStatus;
  reason_code: string;           // English — BRD §3.8.2
  reason_detail: string | null;
  items: ReturnItem[];
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id: string;
  quantity: number;
  condition: string;
}

// ─── Content Blocks ───────────────────────────────────────────────
// BRD §6.1 — banners, homepage sections
export interface ContentBlock {
  id: string;
  type: 'banner' | 'featured_section' | 'promo' | 'about_us' | 'contact_us';
  name: TranslationMap;
  body: TranslationMap;
  cta_label: TranslationMap;
  cta_url: TranslationMap;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

// ─── Email Templates ──────────────────────────────────────────────
// BRD §6.1 — one row per email type per locale
export type EmailType =
  | 'order_confirmation'
  | 'order_shipped'
  | 'password_reset'
  | 'email_verification'
  | 'return_confirmation'
  | 'refund_issued'
  | 'abandoned_cart';

export interface EmailTemplate {
  id: string;
  type: EmailType;
  locale: LocaleCode;
  subject: string;
  body_html: string;
  is_active: boolean;
}

// ─── Webhook Events ───────────────────────────────────────────────
// BRD §3.6.3
export interface WebhookEvent {
  stripe_event_id: string;
  type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

// ─── FX Rates ─────────────────────────────────────────────────────
// BRD §3.3
export interface FxRate {
  base_currency: CurrencyCode;
  target_currency: CurrencyCode;
  rate: number;
  updated_at: string;
}

// ─── Discount Codes ───────────────────────────────────────────────
// BRD §3.1.3
export type DiscountType = 'percentage' | 'fixed_amount';

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  currency: CurrencyCode | null;  // null for percentage
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
}

// ─── Slug Redirects ───────────────────────────────────────────────
// BRD §3.10
export interface SlugRedirect {
  id: string;
  from_path: string;
  to_path: string;
  locale: LocaleCode;
  status_code: 301 | 302;
}

// ─── Translation Completeness ─────────────────────────────────────
// Utility type for admin dashboard (BRD §3.2.6)
export interface TranslationCompleteness {
  locale: LocaleCode;
  content_type: 'products' | 'categories' | 'content_blocks' | 'email_templates';
  total: number;
  translated: number;
  percentage: number;
}

// ─── Search ───────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  name: TranslationMap;
  slug: TranslationMap;
  short_description: TranslationMap;
  category_name: TranslationMap | null;
  price_min: number;
  currency: CurrencyCode;
  image_url: string | null;
  rank: number;
}

// ─── API Response Wrapper ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
