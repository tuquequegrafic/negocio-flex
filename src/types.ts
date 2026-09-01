export type BusinessType = 'restaurant' | 'salon' | 'gym' | 'store' | 'professional' | 'custom';

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_super_admin: boolean;
  created_at: string;
}

export interface OrganizationModules {
  products: boolean;
  services: boolean;
  categories: boolean;
  orders: boolean;
  appointments: boolean;
  delivery: boolean;
  promotions: boolean;
  gallery: boolean;
  whatsapp: boolean;
  hours: boolean;
  location: boolean;
  testimonials: boolean;
  social: boolean;
  notifications: boolean;
  analytics: boolean;
}

export interface OrganizationSettings {
  organization_id: string;
  logo_url: string;
  cover_url: string;
  primary_color: string;
  secondary_color: string;
  text_color?: string;
  accent_color: string;
  address: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_message?: string;
  email: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  website_url?: string;
  active_modules: OrganizationModules;
  currency: string;
  slogan?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  description: string;
  is_active: boolean;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_by: string;
  created_at: string;
  settings?: OrganizationSettings;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  user_profile?: UserProfile;
  created_at: string;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  image_url?: string;
  icon?: string;
  type: 'PRODUCT' | 'SERVICE';
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  promo_price?: number;
  stock: number;
  is_active: boolean;
  is_featured?: boolean;
  display_order?: number;
  images: string[];
  category_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ServiceItem {
  id: string;
  organization_id: string;
  category_id?: string;
  name: string;
  description: string;
  image_url?: string;
  price: number;
  promo_price?: number;
  duration_minutes: number;
  is_active: boolean;
  is_featured?: boolean;
  display_order?: number;
  category_name?: string;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  organization_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  delivery_type: 'DELIVERY' | 'PICKUP';
  delivery_address?: string;
  customer_reference?: string;
  payment_method: 'CASH' | 'YAPE_PLIN' | 'CARD' | 'TRANSFER';
  notes?: string;
  items: OrderItem[];
  created_at: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  organization_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  duration_minutes: number;
  staff_id?: string;
  staff_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  organization_id: string;
  day_of_week: number; // 0=Domingo, 1=Lunes, ... 6=Sábado
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  is_open?: boolean;
}

export interface Promotion {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  banner_url: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface GalleryItem {
  id: string;
  organization_id: string;
  title?: string;
  caption?: string;
  category?: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  reference?: string;
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  last_order_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string; // 'Inicial' | 'Profesional' | 'Premium'
  slug: string;
  description: string;
  price_monthly: number;
  price_annual?: number;
  billing_period?: 'MONTHLY' | 'ANNUAL';
  max_products: number; // 30, 150, 9999
  max_images: number;
  max_staff: number; // 1, 3, 9999
  max_users?: number;
  allowed_modules: (keyof OrganizationModules)[];
  is_active: boolean;
  features: string[];
  badge?: string; // 'POPULAR', 'RECOMENDADO', etc.
  custom_domain_allowed: boolean;
  analytics_allowed: boolean;
  support_level: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  business_id?: string;
  organization_id: string;
  plan_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
  current_period_start?: string;
  current_period_end?: string;
  auto_renew: boolean;
  billing_period: 'MONTHLY' | 'ANNUAL';
  amount_paid: number;
  payment_method?: string;
  last_payment_date?: string;
  next_billing_date?: string;
  custom_domain?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id: string;
  organization_id: string;
  organization_name: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_gateway: 'Culqi' | 'Mercado Pago' | 'Niubiz' | 'Izipay' | 'Yape / Plin';
  payment_method_type: 'CARD' | 'QR' | 'TRANSFER';
  transaction_id: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  customer_name: string;
  customer_email: string;
  card_last4?: string;
  card_brand?: string;
  webhook_verified: boolean;
  created_at: string;
  receipt_url?: string;
}

export interface UserAccount {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'STAFF';
  organization_id: string;
  organization_name: string;
  plan_name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PENDING_APPROVAL' | 'REJECTED';
  rejection_reason?: string;
  requested_plan_id?: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface WebhookLog {
  id: string;
  gateway: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'PROCESSED' | 'FAILED';
  created_at: string;
}
