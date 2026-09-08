/**
 * NEGOCIO FLEX — TIPOS DE BASE DE DATOS SUPABASE (POSTGRESQL)
 * Generado a partir de: src/core/database/supabase_schema_production.sql
 * Fuente Única de Verdad: supabase_schema_production.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | unknown }
  | Json[];

export type OrgMemberRole = 'super_admin' | 'owner' | 'admin' | 'staff' | 'customer';
export type OrgMemberStatus = 'active' | 'inactive' | 'invited' | 'suspended';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BusinessType =
  | 'restaurant'
  | 'salon'
  | 'gym'
  | 'store'
  | 'professional'
  | 'other'
  | 'pasteleria'
  | 'barberia'
  | 'ferreteria'
  | 'veterinaria'
  | 'boutique'
  | 'servicios_generales'
  | 'personalizado';

export type CategoryType = 'PRODUCT' | 'SERVICE';
export type BillingPeriod = 'MONTHLY' | 'ANNUAL';
export type DeliveryType = 'DELIVERY' | 'PICKUP';
export type PaymentMethod = 'CASH' | 'YAPE_PLIN' | 'CARD' | 'TRANSFER';
export type TransactionStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          business_type: BusinessType | string;
          description: string | null;
          category: string | null;
          seo_title: string | null;
          seo_description: string | null;
          map_embed_url: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          business_type?: BusinessType | string;
          description?: string | null;
          category?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          map_embed_url?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          business_type?: BusinessType | string;
          description?: string | null;
          category?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          map_embed_url?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          logo_url: string | null;
          cover_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          accent_color: string | null;
          text_color: string | null;
          address: string | null;
          phone: string | null;
          whatsapp_number: string;
          whatsapp_message: string | null;
          email: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          website_url: string | null;
          currency: string | null;
          slogan: string | null;
          active_modules: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          logo_url?: string | null;
          cover_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          accent_color?: string | null;
          text_color?: string | null;
          address?: string | null;
          phone?: string | null;
          whatsapp_number?: string;
          whatsapp_message?: string | null;
          email?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          website_url?: string | null;
          currency?: string | null;
          slogan?: string | null;
          active_modules?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          logo_url?: string | null;
          cover_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          accent_color?: string | null;
          text_color?: string | null;
          address?: string | null;
          phone?: string | null;
          whatsapp_number?: string;
          whatsapp_message?: string | null;
          email?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          website_url?: string | null;
          currency?: string | null;
          slogan?: string | null;
          active_modules?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgMemberRole | string;
          status: OrgMemberStatus | string;
          permissions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgMemberRole | string;
          status?: OrgMemberStatus | string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrgMemberRole | string;
          status?: OrgMemberStatus | string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price_monthly: number;
          price_annual: number;
          max_products: number;
          max_images: number;
          max_staff: number;
          max_customers: number;
          max_orders_per_month: number;
          max_appointments_per_month: number;
          custom_domain_allowed: boolean;
          analytics_allowed: boolean;
          support_level: string | null;
          features: Json;
          allowed_modules: Json;
          billing_interval?: string | null;
          trial_days?: number;
          limits?: Json;
          active_modules?: Json;
          is_active: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price_monthly?: number;
          price_annual?: number;
          max_products?: number;
          max_images?: number;
          max_staff?: number;
          max_customers?: number;
          max_orders_per_month?: number;
          max_appointments_per_month?: number;
          custom_domain_allowed?: boolean;
          analytics_allowed?: boolean;
          support_level?: string | null;
          features?: Json;
          allowed_modules?: Json;
          billing_interval?: string | null;
          trial_days?: number;
          limits?: Json;
          active_modules?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price_monthly?: number;
          price_annual?: number;
          max_products?: number;
          max_images?: number;
          max_staff?: number;
          max_customers?: number;
          max_orders_per_month?: number;
          max_appointments_per_month?: number;
          custom_domain_allowed?: boolean;
          analytics_allowed?: boolean;
          support_level?: string | null;
          features?: Json;
          allowed_modules?: Json;
          billing_interval?: string | null;
          trial_days?: number;
          limits?: Json;
          active_modules?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          plan_name: string;
          status: SubscriptionStatus | string;
          start_date: string;
          end_date: string;
          trial_start?: string | null;
          trial_end?: string | null;
          trial_end_date: string | null;
          auto_renew: boolean;
          billing_period: BillingPeriod | string;
          billing_interval?: string | null;
          amount_paid: number;
          payment_method: string | null;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          custom_domain: string | null;
          limits?: Json | null;
          active_modules?: Json | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          last_reconciled_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          plan_name: string;
          status?: SubscriptionStatus | string;
          start_date?: string;
          end_date: string;
          trial_start?: string | null;
          trial_end?: string | null;
          trial_end_date?: string | null;
          auto_renew?: boolean;
          billing_period?: BillingPeriod | string;
          billing_interval?: string | null;
          amount_paid?: number;
          payment_method?: string | null;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          custom_domain?: string | null;
          limits?: Json | null;
          active_modules?: Json | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          last_reconciled_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan_id?: string;
          plan_name?: string;
          status?: SubscriptionStatus | string;
          start_date?: string;
          end_date?: string;
          trial_start?: string | null;
          trial_end?: string | null;
          trial_end_date?: string | null;
          auto_renew?: boolean;
          billing_period?: BillingPeriod | string;
          billing_interval?: string | null;
          amount_paid?: number;
          payment_method?: string | null;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          custom_domain?: string | null;
          limits?: Json | null;
          active_modules?: Json | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          last_reconciled_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          }
        ];
      };

      categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          type: CategoryType | string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          type?: CategoryType | string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          type?: CategoryType | string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      products: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string | null;
          name: string;
          sku: string | null;
          description: string | null;
          price: number;
          cost_price: number;
          promo_price: number | null;
          stock: number;
          track_inventory: boolean;
          allow_negative_stock: boolean;
          barcode: string | null;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          images: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id?: string | null;
          name: string;
          sku?: string | null;
          description?: string | null;
          price?: number;
          cost_price?: number;
          promo_price?: number | null;
          stock?: number;
          track_inventory?: boolean;
          allow_negative_stock?: boolean;
          barcode?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          category_id?: string | null;
          name?: string;
          sku?: string | null;
          description?: string | null;
          price?: number;
          cost_price?: number;
          promo_price?: number | null;
          stock?: number;
          track_inventory?: boolean;
          allow_negative_stock?: boolean;
          barcode?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      services: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          promo_price: number | null;
          duration_minutes: number;
          image_url: string | null;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price?: number;
          promo_price?: number | null;
          duration_minutes?: number;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          promo_price?: number | null;
          duration_minutes?: number;
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      business_hours: {
        Row: {
          id: string;
          organization_id: string;
          day_of_week: number;
          day_name: string;
          open_time: string;
          close_time: string;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          day_of_week: number;
          day_name: string;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          day_of_week?: number;
          day_name?: string;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_hours_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      business_gallery: {
        Row: {
          id: string;
          organization_id: string;
          title: string | null;
          caption: string | null;
          category: string | null;
          image_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title?: string | null;
          caption?: string | null;
          category?: string | null;
          image_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string | null;
          caption?: string | null;
          category?: string | null;
          image_url?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_gallery_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          reference: string | null;
          notes: string | null;
          total_orders: number;
          total_spent: number;
          last_order_date: string | null;
          last_order_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          reference?: string | null;
          notes?: string | null;
          total_orders?: number;
          total_spent?: number;
          last_order_date?: string | null;
          last_order_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          reference?: string | null;
          notes?: string | null;
          total_orders?: number;
          total_spent?: number;
          last_order_date?: string | null;
          last_order_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      orders: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          order_number: string;
          status: OrderStatus | string;
          subtotal: number;
          discount: number;
          delivery_fee: number;
          total: number;
          delivery_type: DeliveryType | string;
          delivery_address: string | null;
          customer_reference: string | null;
          payment_method: PaymentMethod | string;
          notes: string | null;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id?: string | null;
          customer_name: string;
          customer_phone: string;
          order_number: string;
          status?: OrderStatus | string;
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          total?: number;
          delivery_type?: DeliveryType | string;
          delivery_address?: string | null;
          customer_reference?: string | null;
          payment_method?: PaymentMethod | string;
          notes?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          order_number?: string;
          status?: OrderStatus | string;
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          total?: number;
          delivery_type?: DeliveryType | string;
          delivery_address?: string | null;
          customer_reference?: string | null;
          payment_method?: PaymentMethod | string;
          notes?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          organization_id: string;
          product_id: string | null;
          product_name: string;
          product_image: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          organization_id: string;
          product_id?: string | null;
          product_name: string;
          product_image?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          organization_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_image?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      appointments: {
        Row: {
          id: string;
          organization_id: string;
          service_id: string | null;
          service_name: string;
          service_price: number;
          duration_minutes: number;
          staff_id: string | null;
          staff_name: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus | string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          service_id?: string | null;
          service_name: string;
          service_price: number;
          duration_minutes?: number;
          staff_id?: string | null;
          staff_name?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus | string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          service_id?: string | null;
          service_name?: string;
          service_price?: number;
          duration_minutes?: number;
          staff_id?: string | null;
          staff_name?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus | string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      payment_transactions: {
        Row: {
          id: string;
          organization_id: string;
          organization_name: string;
          plan_id: string;
          plan_name: string;
          amount: number;
          currency: string | null;
          payment_gateway: string;
          payment_method_type: string;
          transaction_id: string;
          status: TransactionStatus | string;
          customer_name: string;
          customer_email: string;
          card_last4: string | null;
          card_brand: string | null;
          webhook_verified: boolean;
          receipt_url: string | null;
          subscription_id?: string | null;
          provider?: string | null;
          provider_transaction_id?: string | null;
          idempotency_key?: string | null;
          payment_method_reference?: string | null;
          metadata: Json;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          organization_name: string;
          plan_id: string;
          plan_name: string;
          amount: number;
          currency?: string | null;
          payment_gateway: string;
          payment_method_type?: string;
          transaction_id: string;
          status?: TransactionStatus | string;
          customer_name: string;
          customer_email: string;
          card_last4?: string | null;
          card_brand?: string | null;
          webhook_verified?: boolean;
          receipt_url?: string | null;
          subscription_id?: string | null;
          provider?: string | null;
          provider_transaction_id?: string | null;
          idempotency_key?: string | null;
          payment_method_reference?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          organization_name?: string;
          plan_id?: string;
          plan_name?: string;
          amount?: number;
          currency?: string | null;
          payment_gateway?: string;
          payment_method_type?: string;
          transaction_id?: string;
          status?: TransactionStatus | string;
          customer_name?: string;
          customer_email?: string;
          card_last4?: string | null;
          card_brand?: string | null;
          webhook_verified?: boolean;
          receipt_url?: string | null;
          subscription_id?: string | null;
          provider?: string | null;
          provider_transaction_id?: string | null;
          idempotency_key?: string | null;
          payment_method_reference?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          }
        ];
      };

      webhook_logs: {
        Row: {
          id: string;
          gateway: string;
          event_type: string;
          payload: Json;
          status: string;
          provider?: string | null;
          event_id?: string | null;
          signature_valid?: boolean;
          processed?: boolean;
          processing_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gateway: string;
          event_type: string;
          payload: Json;
          status?: string;
          provider?: string | null;
          event_id?: string | null;
          signature_valid?: boolean;
          processed?: boolean;
          processing_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gateway?: string;
          event_type?: string;
          payload?: Json;
          status?: string;
          provider?: string | null;
          event_id?: string | null;
          signature_valid?: boolean;
          processed?: boolean;
          processing_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      inventory_movements: {
        Row: {
          id: string;
          organization_id: string;
          product_id: string;
          movement_type: string;
          quantity: number;
          stock_before: number;
          stock_after: number;
          unit_cost: number;
          total_cost: number;
          reference_type: string | null;
          reference_id: string | null;
          reason: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          product_id: string;
          movement_type: string;
          quantity: number;
          stock_before: number;
          stock_after: number;
          unit_cost?: number;
          total_cost?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          reason?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          product_id?: string;
          movement_type?: string;
          quantity?: number;
          stock_before?: number;
          stock_after?: number;
          unit_cost?: number;
          total_cost?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          reason?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };

      cash_registers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_registers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      cash_shifts: {
        Row: {
          id: string;
          organization_id: string;
          cash_register_id: string;
          opened_by: string | null;
          opened_by_name: string;
          status: 'OPEN' | 'CLOSED';
          initial_cash: number;
          sales_cash_total: number;
          sales_digital_total: number;
          cash_in_total: number;
          cash_out_total: number;
          expected_cash: number;
          actual_cash: number | null;
          difference: number | null;
          opened_at: string;
          closed_at: string | null;
          closed_by: string | null;
          closed_by_name: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          cash_register_id: string;
          opened_by?: string | null;
          opened_by_name: string;
          status?: 'OPEN' | 'CLOSED';
          initial_cash?: number;
          sales_cash_total?: number;
          sales_digital_total?: number;
          cash_in_total?: number;
          cash_out_total?: number;
          expected_cash?: number;
          actual_cash?: number | null;
          difference?: number | null;
          opened_at?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          closed_by_name?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          cash_register_id?: string;
          opened_by?: string | null;
          opened_by_name?: string;
          status?: 'OPEN' | 'CLOSED';
          initial_cash?: number;
          sales_cash_total?: number;
          sales_digital_total?: number;
          cash_in_total?: number;
          cash_out_total?: number;
          expected_cash?: number;
          actual_cash?: number | null;
          difference?: number | null;
          opened_at?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          closed_by_name?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cash_shifts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_shifts_cash_register_id_fkey";
            columns: ["cash_register_id"];
            isOneToOne: false;
            referencedRelation: "cash_registers";
            referencedColumns: ["id"];
          }
        ];
      };

      cash_movements: {
        Row: {
          id: string;
          organization_id: string;
          shift_id: string;
          movement_type: 'CASH_IN' | 'CASH_OUT' | 'SALE_CASH' | 'SALE_DIGITAL' | 'REFUND_CASH';
          amount: number;
          reason: string;
          reference_id: string | null;
          payment_method: string;
          created_by: string | null;
          created_by_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          shift_id: string;
          movement_type: 'CASH_IN' | 'CASH_OUT' | 'SALE_CASH' | 'SALE_DIGITAL' | 'REFUND_CASH';
          amount: number;
          reason: string;
          reference_id?: string | null;
          payment_method?: string;
          created_by?: string | null;
          created_by_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          shift_id?: string;
          movement_type?: 'CASH_IN' | 'CASH_OUT' | 'SALE_CASH' | 'SALE_DIGITAL' | 'REFUND_CASH';
          amount?: number;
          reason?: string;
          reference_id?: string | null;
          payment_method?: string;
          created_by?: string | null;
          created_by_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_movements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "cash_shifts";
            referencedColumns: ["id"];
          }
        ];
      };

      sales_receipt_series: {
        Row: {
          id: string;
          organization_id: string;
          document_type: 'TICKET' | 'BOLETA' | 'FACTURA';
          series: string;
          current_number: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_type: 'TICKET' | 'BOLETA' | 'FACTURA';
          series: string;
          current_number?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          document_type?: 'TICKET' | 'BOLETA' | 'FACTURA';
          series?: string;
          current_number?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_receipt_series_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      sales_receipts: {
        Row: {
          id: string;
          organization_id: string;
          order_id: string;
          cash_shift_id: string | null;
          document_type: 'TICKET' | 'BOLETA' | 'FACTURA';
          series: string;
          number: number;
          full_number: string;
          customer_name: string;
          customer_document: string | null;
          subtotal: number;
          discount: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          payment_method: string;
          cash_received: number;
          cash_change: number;
          status: 'ISSUED' | 'ANNULLLED';
          issued_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_id: string;
          cash_shift_id?: string | null;
          document_type: 'TICKET' | 'BOLETA' | 'FACTURA';
          series: string;
          number: number;
          full_number: string;
          customer_name: string;
          customer_document?: string | null;
          subtotal: number;
          discount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total: number;
          payment_method: string;
          cash_received?: number;
          cash_change?: number;
          status?: 'ISSUED' | 'ANNULLLED';
          issued_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_id?: string;
          cash_shift_id?: string | null;
          document_type?: 'TICKET' | 'BOLETA' | 'FACTURA';
          series?: string;
          number?: number;
          full_number?: string;
          customer_name?: string;
          customer_document?: string | null;
          subtotal?: number;
          discount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          payment_method?: string;
          cash_received?: number;
          cash_change?: number;
          status?: 'ISSUED' | 'ANNULLLED';
          issued_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_receipts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_receipts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };

      pos_idempotency: {
        Row: {
          id: string;
          organization_id: string;
          idempotency_key: string;
          order_id: string;
          receipt_id: string | null;
          response_payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          idempotency_key: string;
          order_id: string;
          receipt_id?: string | null;
          response_payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          idempotency_key?: string;
          order_id?: string;
          receipt_id?: string | null;
          response_payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pos_idempotency_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_member_of_org: {
        Args: {
          p_org_id: string;
        };
        Returns: boolean;
      };
      get_user_org_role: {
        Args: {
          p_org_id: string;
        };
        Returns: string | null;
      };
      generate_unique_slug: {
        Args: {
          base_name: string;
        };
        Returns: string;
      };
      create_organization: {
        Args: {
          org_name: string;
          org_business_type: string;
          custom_slug?: string | null;
        };
        Returns: Json;
      };
      change_member_role: {
        Args: {
          p_organization_id: string;
          p_target_user_id: string;
          p_new_role: string;
        };
        Returns: Json;
      };
      remove_organization_member: {
        Args: {
          p_organization_id: string;
          p_target_user_id: string;
        };
        Returns: Json;
      };
      get_public_appointment_slots: {
        Args: {
          p_organization_id: string;
          p_date: string;
        };
        Returns: {
          start_time: string;
          end_time: string;
          staff_name: string;
        }[];
      };
      validate_subscription_status_transition: {
        Args: {
          p_current_status: string;
          p_new_status: string;
        };
        Returns: boolean;
      };
      check_organization_plan_limit: {
        Args: {
          p_org_id: string;
          p_limit_type: string;
          p_increment?: number;
        };
        Returns: Json;
      };
      process_subscription_upgrade_downgrade: {
        Args: {
          p_org_id: string;
          p_new_plan_id: string;
          p_billing_interval: string;
          p_idempotency_key: string;
          p_payment_gateway?: string;
          p_payment_method?: string;
        };
        Returns: Json;
      };
      cancel_organization_subscription: {
        Args: {
          p_org_id: string;
        };
        Returns: Json;
      };
      start_organization_trial: {
        Args: {
          p_org_id: string;
          p_plan_id?: string;
          p_trial_days?: number;
        };
        Returns: Json;
      };
      process_payment_webhook: {
        Args: {
          p_provider: string;
          p_event_id: string;
          p_event_type: string;
          p_payload: Json;
        };
        Returns: Json;
      };
      deduct_order_inventory: {
        Args: {
          p_organization_id: string;
          p_order_id: string;
          p_items: Json;
          p_user_id?: string | null;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      restore_order_inventory: {
        Args: {
          p_organization_id: string;
          p_order_id: string;
          p_reason?: string | null;
          p_user_id?: string | null;
        };
        Returns: Json;
      };
      adjust_inventory: {
        Args: {
          p_organization_id: string;
          p_product_id: string;
          p_movement_type: string;
          p_quantity: number;
          p_unit_cost?: number | null;
          p_reason?: string | null;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
          p_user_id?: string | null;
        };
        Returns: Json;
      };
      open_cash_shift: {
        Args: {
          p_organization_id: string;
          p_cash_register_id: string;
          p_user_id: string;
          p_initial_cash: number;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      close_cash_shift: {
        Args: {
          p_organization_id: string;
          p_shift_id: string;
          p_user_id: string;
          p_actual_cash: number;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      record_cash_movement: {
        Args: {
          p_organization_id: string;
          p_shift_id: string;
          p_user_id: string;
          p_movement_type: string;
          p_amount: number;
          p_reason: string;
          p_payment_method?: string | null;
        };
        Returns: Json;
      };
      process_pos_sale: {
        Args: {
          p_organization_id: string;
          p_cash_register_id: string;
          p_shift_id: string;
          p_user_id: string;
          p_customer_id?: string | null;
          p_customer_name?: string | null;
          p_customer_phone?: string | null;
          p_customer_document?: string | null;
          p_items: Json;
          p_payment_method?: string | null;
          p_cash_received?: number | null;
          p_discount?: number | null;
          p_tax_rate?: number | null;
          p_document_type?: string | null;
          p_idempotency_key?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
    };

    Enums: {
      org_member_role: OrgMemberRole;
      org_member_status: OrgMemberStatus;
      subscription_status: SubscriptionStatus;
      order_status: OrderStatus;
      appointment_status: AppointmentStatus;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
