-- ==============================================================================
-- NEGOCIO FLEX — ESQUEMA CANÓNICO DE PRODUCCIÓN (SUPABASE / POSTGRESQL)
-- Arquitectura: Multi-Tenant con Aislamiento RLS, Auth, Roles y Storage
-- Versión: 2.0 (Consolidada y Segura para Producción)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES REQUERIDAS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TIPOS Y ENUMS
-- ------------------------------------------------------------------------------
-- Nota de Arquitectura sobre Roles:
-- • Nivel Plataforma SaaS: profiles.is_super_admin (BOOLEAN)
-- • Nivel Multi-Tenant: organization_members.role ('owner', 'admin', 'staff', 'customer')
-- Esto separa limpiamente los privilegios globales de la plataforma de los privilegios dentro de cada negocio.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_member_role') THEN
    CREATE TYPE public.org_member_role AS ENUM ('super_admin', 'owner', 'admin', 'staff', 'customer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_member_status') THEN
    CREATE TYPE public.org_member_status AS ENUM ('active', 'inactive', 'invited', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE public.appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABLA: PROFILES (Perfiles de Usuarios vinculados a Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = TRUE;

-- ------------------------------------------------------------------------------
-- 4. TABLA: ORGANIZATIONS (Empresas / Negocios / Tenants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  business_type TEXT NOT NULL DEFAULT 'restaurant' CHECK (
    business_type IN (
      'restaurant', 'salon', 'gym', 'store', 'professional', 'other',
      'pasteleria', 'barberia', 'ferreteria', 'veterinaria', 'boutique',
      'servicios_generales', 'personalizado'
    )
  ),
  description TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT 'other',
  seo_title TEXT,
  seo_description TEXT,
  map_embed_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- ------------------------------------------------------------------------------
-- 5. TABLA: ORGANIZATION_SETTINGS (Configuración y Branding del Negocio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#064E3B',
  accent_color TEXT DEFAULT '#F59E0B',
  text_color TEXT DEFAULT '#111827',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  whatsapp_message TEXT DEFAULT '¡Hola! Deseo realizar el siguiente pedido:',
  email TEXT DEFAULT '',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  website_url TEXT,
  currency TEXT DEFAULT 'S/',
  slogan TEXT DEFAULT '',
  active_modules JSONB NOT NULL DEFAULT '{
    "products": true,
    "services": false,
    "categories": true,
    "orders": true,
    "appointments": false,
    "delivery": true,
    "promotions": true,
    "gallery": true,
    "whatsapp": true,
    "hours": true,
    "location": true,
    "testimonials": true,
    "social": true,
    "notifications": true,
    "analytics": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_settings_organization_id ON public.organization_settings(organization_id);

-- ------------------------------------------------------------------------------
-- 6. TABLA: ORGANIZATION_MEMBERS (Membresías y Roles en cada Organización)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('super_admin', 'owner', 'admin', 'staff', 'customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited', 'suspended')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_members(user_id, organization_id);

-- ------------------------------------------------------------------------------
-- 7. TABLA: PLANS (Catálogo Global de Planes SaaS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_annual NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_products INTEGER NOT NULL DEFAULT 30,
  max_images INTEGER NOT NULL DEFAULT 10,
  max_staff INTEGER NOT NULL DEFAULT 1,
  custom_domain_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  analytics_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  support_level TEXT DEFAULT 'WhatsApp estándar',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: SUBSCRIPTIONS (Suscripciones de Organizaciones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  billing_period TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (billing_period IN ('MONTHLY', 'ANNUAL')),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT DEFAULT 'Culqi / Yape',
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ------------------------------------------------------------------------------
-- 9. TABLA: CATEGORIES (Categorías de Productos o Servicios)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'PRODUCT' CHECK (type IN ('PRODUCT', 'SERVICE')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_org_order ON public.categories(organization_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_org_active ON public.categories(organization_id, is_active);

-- ------------------------------------------------------------------------------
-- 10. TABLA: PRODUCTS (Catálogo de Productos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  promo_price NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 999,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_org_active ON public.products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(organization_id, is_featured) WHERE is_featured = TRUE;

-- ------------------------------------------------------------------------------
-- 11. TABLA: SERVICES (Catálogo de Servicios)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  promo_price NUMERIC(10, 2),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_org_active ON public.services(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);

-- ------------------------------------------------------------------------------
-- 12. TABLA: BUSINESS_HOURS (Horarios de Atención)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_name TEXT NOT NULL,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_hours_org ON public.business_hours(organization_id);

-- ------------------------------------------------------------------------------
-- 13. TABLA: BUSINESS_GALLERY (Galería de Fotos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT,
  category TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_gallery_org ON public.business_gallery(organization_id);

-- ------------------------------------------------------------------------------
-- 14. TABLA: CUSTOMERS (Directorio CRM de Clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  reference TEXT,
  notes TEXT,
  total_orders INTEGER NOT NULL DEFAULT 1,
  total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  last_order_date TIMESTAMPTZ DEFAULT NOW(),
  last_order_number TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON public.customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_org_orders ON public.customers(organization_id, total_orders DESC);
CREATE INDEX IF NOT EXISTS idx_customers_org_name ON public.customers(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_org_spent ON public.customers(organization_id, total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_orders_org_customer_phone ON public.orders(organization_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_org_customer_phone ON public.appointments(organization_id, customer_phone);

-- ------------------------------------------------------------------------------
-- 15. TABLA: ORDERS (Pedidos Recibidos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_type TEXT NOT NULL DEFAULT 'DELIVERY' CHECK (delivery_type IN ('DELIVERY', 'PICKUP')),
  delivery_address TEXT,
  customer_reference TEXT,
  payment_method TEXT NOT NULL DEFAULT 'YAPE_PLIN' CHECK (payment_method IN ('CASH', 'YAPE_PLIN', 'CARD', 'TRANSFER')),
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_org_created ON public.orders(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON public.orders(organization_id, status);

-- ------------------------------------------------------------------------------
-- 15.1 TABLA: ORDER_ITEMS (Artículos de Pedido Normalizados)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_org ON public.order_items(organization_id);

-- ------------------------------------------------------------------------------
-- 16. TABLA: APPOINTMENTS (Reservas y Citas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  staff_name TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON public.appointments(organization_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_org_status ON public.appointments(organization_id, status);

-- ------------------------------------------------------------------------------
-- 17. TABLA: PAYMENT_TRANSACTIONS (Historial de Pagos SaaS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'S/',
  payment_gateway TEXT NOT NULL,
  payment_method_type TEXT NOT NULL DEFAULT 'CARD',
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  webhook_verified BOOLEAN NOT NULL DEFAULT TRUE,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_transactions(status);

-- ------------------------------------------------------------------------------
-- 18. TABLA: WEBHOOK_LOGS (Auditoría de Webhooks de Pasarelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_gateway ON public.webhook_logs(gateway, created_at DESC);

-- ==============================================================================
-- 19. FUNCIONES DE SEGURIDAD Y HELPERS (SECURITY DEFINER + SAFE SEARCH_PATH)
-- ==============================================================================

-- Helper 1: Verificar si el usuario autenticado es Super Administrador
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
END;
$$;

-- Helper 2: Verificar si el usuario autenticado pertenece activamente a una organización
CREATE OR REPLACE FUNCTION public.is_member_of_org(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_org_id 
      AND user_id = auth.uid()
      AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
END;
$$;

-- Helper 3: Obtener el rol del usuario en la organización
CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Si es Super Admin de plataforma
  IF public.is_super_admin() THEN
    RETURN 'super_admin';
  END IF;

  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND user_id = auth.uid()
    AND status = 'active';

  RETURN v_role;
END;
$$;

-- Helper 4: Generador de slug único y seguro
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  clean_slug := lower(trim(base_name));
  clean_slug := regexp_replace(clean_slug, '[áàäâ]', 'a', 'g');
  clean_slug := regexp_replace(clean_slug, '[éèëê]', 'e', 'g');
  clean_slug := regexp_replace(clean_slug, '[íìïî]', 'i', 'g');
  clean_slug := regexp_replace(clean_slug, '[óòöô]', 'o', 'g');
  clean_slug := regexp_replace(clean_slug, '[úùüû]', 'u', 'g');
  clean_slug := regexp_replace(clean_slug, '[ñ]', 'n', 'g');
  clean_slug := regexp_replace(clean_slug, '[^a-z0-9]+', '-', 'g');
  clean_slug := regexp_replace(clean_slug, '^-+|-+$', '', 'g');

  IF clean_slug = '' THEN
    clean_slug := 'negocio';
  END IF;

  final_slug := clean_slug;

  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := clean_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Helper 5: Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper 6: Trigger de registro para crear automáticamente public.profiles desde auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_super_admin')::BOOLEAN, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 20. TRIGGERS
-- ==============================================================================

-- Trigger para creación de perfil al registrarse en Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers de updated_at para mantener marcas de tiempo sincronizadas
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orgs_updated_at ON public.organizations;
CREATE TRIGGER trg_orgs_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_org_settings_updated_at ON public.organization_settings;
CREATE TRIGGER trg_org_settings_updated_at BEFORE UPDATE ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON public.organization_members;
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- TRIGGER: PREVENCIÓN ATÓMICA DE DOBLE RESERVA / CONCURRENCIA (FASE 6)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conflict_id UUID;
  v_lock_key BIGINT;
  v_staff_key TEXT;
BEGIN
  -- Citas canceladas no reservan cupo ni generan conflicto
  IF NEW.status = 'CANCELLED' THEN
    RETURN NEW;
  END IF;

  -- Validación de coherencia de horario
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: La hora de fin (%) debe ser posterior a la hora de inicio (%)', NEW.end_time, NEW.start_time
      USING ERRCODE = '22000';
  END IF;

  -- 1. ADVISORY LOCK ATÓMICO A NIVEL DE TRANSACCIÓN:
  -- Serializa transacciones concurrentes en el mismo espacio (org, fecha, especialista/global).
  -- Se libera automáticamente al finalizar la transacción (COMMIT o ROLLBACK).
  v_staff_key := COALESCE(NULLIF(TRIM(LOWER(NEW.staff_name)), ''), NEW.staff_id::text, 'GLOBAL_STAFF');
  v_lock_key := ('x' || SUBSTR(MD5(NEW.organization_id::text || '_' || NEW.appointment_date::text || '_' || v_staff_key), 1, 16))::bit(64)::bigint;

  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 2. VERIFICACIÓN ESTRICTA DE SOLAPAMIENTO:
  -- Regla: existing.start_time < NEW.end_time AND existing.end_time > NEW.start_time
  SELECT id INTO v_conflict_id
  FROM public.appointments
  WHERE organization_id = NEW.organization_id
    AND appointment_date = NEW.appointment_date
    AND status != 'CANCELLED'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (
        NEW.staff_id IS NOT NULL AND staff_id IS NOT NULL AND NEW.staff_id = staff_id
      )
      OR
      (
        NEW.staff_name IS NOT NULL AND staff_name IS NOT NULL 
        AND LOWER(TRIM(NEW.staff_name)) = LOWER(TRIM(staff_name))
        AND TRIM(NEW.staff_name) != ''
      )
      OR
      (
        (NEW.staff_id IS NULL AND (NEW.staff_name IS NULL OR TRIM(NEW.staff_name) = ''))
        OR
        (staff_id IS NULL AND (staff_name IS NULL OR TRIM(staff_name) = ''))
      )
    )
    AND (start_time < NEW.end_time AND end_time > NEW.start_time)
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RAISE EXCEPTION 'CONFLICT_OVERLAP: El horario % - % ya se encuentra reservado para esta fecha.', NEW.start_time, NEW.end_time
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_appointment_overlap ON public.appointments;
CREATE TRIGGER trg_prevent_appointment_overlap
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointment_overlap();

-- ------------------------------------------------------------------------------
-- TRIGGER: INTEGRIDAD Y PREVENCIÓN DE MANIPULACIÓN DE PRECIOS EN PEDIDOS (FASE 7)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_order_item_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prod_org_id UUID;
  v_prod_price NUMERIC;
  v_prod_promo_price NUMERIC;
  v_prod_active BOOLEAN;
  v_order_org_id UUID;
BEGIN
  -- 1. Verificar que el pedido existe y obtener su organization_id
  SELECT organization_id INTO v_order_org_id
  FROM public.orders
  WHERE id = NEW.order_id;

  IF v_order_org_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: El pedido asociado no existe' USING ERRCODE = '22000';
  END IF;

  -- 2. Asegurar que organization_id coincide con la del pedido
  IF NEW.organization_id IS NULL OR NEW.organization_id <> v_order_org_id THEN
    NEW.organization_id := v_order_org_id;
  END IF;

  -- 3. Verificar producto, pertenencia al mismo tenant y estado activo
  SELECT organization_id, price, promo_price, is_active
  INTO v_prod_org_id, v_prod_price, v_prod_promo_price, v_prod_active
  FROM public.products
  WHERE id = NEW.product_id;

  IF v_prod_org_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: El producto asociado no existe' USING ERRCODE = '22000';
  END IF;

  IF v_prod_org_id <> v_order_org_id THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Intento de agregar un producto de otra organización' USING ERRCODE = '42501';
  END IF;

  IF v_prod_active IS NOT TRUE THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: El producto seleccionado no está activo para venta' USING ERRCODE = '22000';
  END IF;

  -- 4. Fijar precio unitario real desde la base de datos (inmune a manipulación de frontend)
  NEW.unit_price := COALESCE(v_prod_promo_price, v_prod_price, 0);
  NEW.subtotal := NEW.unit_price * GREATEST(1, NEW.quantity);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_item_integrity ON public.order_items;
CREATE TRIGGER trg_validate_order_item_integrity
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_integrity();

-- ==============================================================================
-- 21. FUNCIONES RPC (TRANSACCIONES ATÓMICAS SEGURAS)
-- ==============================================================================

-- RPC 1: Crear Organización Atómicamente (Org + Owner Member + Initial Settings)
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name TEXT,
  org_business_type TEXT,
  custom_slug TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_slug TEXT;
  v_org_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado para crear una organización';
  END IF;

  IF TRIM(org_name) = '' THEN
    RAISE EXCEPTION 'El nombre de la organización es obligatorio';
  END IF;

  -- Resolver slug
  IF custom_slug IS NOT NULL AND TRIM(custom_slug) <> '' THEN
    v_slug := public.generate_unique_slug(custom_slug);
  ELSE
    v_slug := public.generate_unique_slug(org_name);
  END IF;

  -- 1. Insertar Organización
  INSERT INTO public.organizations (name, slug, business_type, is_active, created_by)
  VALUES (TRIM(org_name), v_slug, org_business_type, TRUE, v_user_id)
  RETURNING id INTO v_org_id;

  -- 2. Insertar Miembro como OWNER
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'owner', 'active');

  -- 3. Insertar Configuración y Branding por defecto
  INSERT INTO public.organization_settings (organization_id, primary_color, secondary_color, accent_color)
  VALUES (v_org_id, '#4F46E5', '#064E3B', '#F59E0B');

  -- 4. Retornar payload completo
  SELECT JSONB_BUILD_OBJECT(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'business_type', o.business_type,
    'is_active', o.is_active,
    'created_by', o.created_by,
    'created_at', o.created_at,
    'role', 'owner'
  ) INTO v_result
  FROM public.organizations o
  WHERE o.id = v_org_id;

  RETURN v_result;
END;
$$;

-- RPC 2: Modificar Rol de Miembro (Solo Owner de la Org o SuperAdmin)
CREATE OR REPLACE FUNCTION public.change_member_role(
  p_organization_id UUID,
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_target_current_role TEXT;
  v_active_owners_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_new_role NOT IN ('owner', 'admin', 'staff', 'customer') THEN
    RAISE EXCEPTION 'Rol no válido: %', p_new_role;
  END IF;

  v_caller_role := public.get_user_org_role(p_organization_id);
  IF v_caller_role NOT IN ('owner', 'super_admin') THEN
    RAISE EXCEPTION 'Solo los propietarios o SuperAdmin pueden modificar roles en la organización';
  END IF;

  -- Protección: Evitar degradar al último Owner
  SELECT role INTO v_target_current_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_target_user_id
    AND status = 'active';

  IF v_target_current_role = 'owner' AND p_new_role <> 'owner' THEN
    SELECT COUNT(*) INTO v_active_owners_count
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND role = 'owner'
      AND status = 'active';

    IF v_active_owners_count <= 1 THEN
      RAISE EXCEPTION 'La organización debe mantener al menos un propietario (OWNER) activo';
    END IF;
  END IF;

  UPDATE public.organization_members
  SET role = p_new_role, updated_at = NOW()
  WHERE organization_id = p_organization_id
    AND user_id = p_target_user_id;

  RETURN JSONB_BUILD_OBJECT('success', TRUE, 'organization_id', p_organization_id, 'user_id', p_target_user_id, 'new_role', p_new_role);
END;
$$;

-- RPC 3: Eliminar Miembro de Organización
CREATE OR REPLACE FUNCTION public.remove_organization_member(
  p_organization_id UUID,
  p_target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_target_role TEXT;
  v_active_owners_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  v_caller_role := public.get_user_org_role(p_organization_id);

  -- Permitir si es Owner/SuperAdmin o si el usuario se retira voluntariamente
  IF v_caller_role NOT IN ('owner', 'super_admin') AND auth.uid() <> p_target_user_id THEN
    RAISE EXCEPTION 'Permisos insuficientes para eliminar a este miembro';
  END IF;

  SELECT role INTO v_target_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_target_user_id
    AND status = 'active';

  IF v_target_role = 'owner' THEN
    SELECT COUNT(*) INTO v_active_owners_count
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND role = 'owner'
      AND status = 'active';

    IF v_active_owners_count <= 1 THEN
      RAISE EXCEPTION 'No puedes eliminar al único propietario (OWNER) de la organización';
    END IF;
  END IF;

  DELETE FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_target_user_id;

  RETURN JSONB_BUILD_OBJECT('success', TRUE, 'removed_user_id', p_target_user_id);
END;
$$;

-- RPC 4: Consulta Pública Segura de Disponibilidad Horaria (Fase 6)
-- Permite a visitantes anónimos consultar bloques ocupados SIN exponer PII de clientes
CREATE OR REPLACE FUNCTION public.get_public_appointment_slots(
  p_organization_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_time TEXT,
  end_time TEXT,
  staff_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validar que la organización exista y esté activa
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = p_organization_id AND is_active = TRUE
  ) THEN
    RETURN;
  END IF;

  -- Retorna EXCLUSIVAMENTE los bloques de horario ocupados.
  -- NUNCA expone: id, customer_name, customer_phone, customer_email, service_price, notes.
  RETURN QUERY
  SELECT a.start_time, a.end_time, COALESCE(a.staff_name, '')
  FROM public.appointments a
  WHERE a.organization_id = p_organization_id
    AND a.appointment_date = p_date
    AND a.status != 'CANCELLED'
  ORDER BY a.start_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_appointment_slots(UUID, DATE) TO anon, authenticated;

-- RPC 5: Ficha 360° Consolidada de Cliente (Fase 8 - CRM)
-- Retorna cliente, pedidos y citas históricas en una sola transacción atómica segura
-- Las métricas financieras y operativas se calculan sobre TODOS los pedidos válidos (no cancelados), no sobre el limit visual
CREATE OR REPLACE FUNCTION public.get_customer_360_profile(
  p_organization_id UUID,
  p_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer JSONB;
  v_orders JSONB;
  v_appointments JSONB;
  v_metrics JSONB;
  v_customer_phone TEXT;
  v_real_total_orders BIGINT := 0;
  v_real_total_spent NUMERIC := 0.00;
  v_real_total_appointments BIGINT := 0;
BEGIN
  -- Validar membresía del usuario que consulta
  IF NOT public.is_member_of_org(p_organization_id) THEN
    RAISE EXCEPTION 'Acceso denegado: no es miembro de la organización' USING ERRCODE = '42501';
  END IF;

  -- 1. Obtener cliente
  SELECT to_jsonb(c), c.phone
  INTO v_customer, v_customer_phone
  FROM public.customers c
  WHERE c.id = p_customer_id AND c.organization_id = p_organization_id;

  IF v_customer IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Calcular métricas reales sobre TODOS los pedidos válidos (excluyendo cancelados)
  SELECT 
    COUNT(*),
    COALESCE(SUM(total), 0)
  INTO v_real_total_orders, v_real_total_spent
  FROM public.orders
  WHERE organization_id = p_organization_id
    AND (customer_id = p_customer_id OR customer_phone = v_customer_phone)
    AND status != 'CANCELLED';

  -- 3. Calcular cantidad real de citas válidas
  SELECT COUNT(*)
  INTO v_real_total_appointments
  FROM public.appointments
  WHERE organization_id = p_organization_id
    AND customer_phone = v_customer_phone
    AND status != 'CANCELLED';

  -- 4. Obtener pedidos recientes para el timeline visual (LIMIT 20)
  SELECT COALESCE(jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC), '[]'::jsonb)
  INTO v_orders
  FROM (
    SELECT id, order_number, status, subtotal, discount, delivery_fee, total,
           delivery_type, delivery_address, payment_method, created_at
    FROM public.orders
    WHERE organization_id = p_organization_id
      AND (customer_id = p_customer_id OR customer_phone = v_customer_phone)
    ORDER BY created_at DESC
    LIMIT 20
  ) o;

  -- 5. Obtener citas recientes para el timeline visual (LIMIT 20)
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.appointment_date DESC, a.start_time DESC), '[]'::jsonb)
  INTO v_appointments
  FROM (
    SELECT id, service_name, staff_name, appointment_date, start_time, end_time, status, notes, created_at
    FROM public.appointments
    WHERE organization_id = p_organization_id
      AND customer_phone = v_customer_phone
    ORDER BY appointment_date DESC, start_time DESC
    LIMIT 20
  ) a;

  -- 6. Construir métricas consolidadas exactas (Alineadas con CustomerSegment: VIP, FREQUENT, NEW, INACTIVE)
  v_metrics := jsonb_build_object(
    'total_orders', v_real_total_orders,
    'total_appointments', v_real_total_appointments,
    'total_spent', v_real_total_spent,
    'avg_ticket', CASE 
      WHEN v_real_total_orders > 0 THEN 
        ROUND((v_real_total_spent / v_real_total_orders), 2)
      ELSE 0.00 
    END,
    'segment', CASE
      WHEN v_real_total_orders >= 5 OR v_real_total_spent >= 300.00 THEN 'VIP'
      WHEN v_real_total_orders >= 2 THEN 'FREQUENT'
      WHEN v_real_total_orders = 1 THEN 'NEW'
      ELSE 'INACTIVE'
    END
  );

  RETURN jsonb_build_object(
    'customer', v_customer,
    'orders', v_orders,
    'appointments', v_appointments,
    'metrics', v_metrics
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_360_profile(UUID, UUID) TO authenticated;

-- Captura pública segura y atómica de clientes (checkout / citas públicas)
-- CRIT-02: Retorna payload sanitizado mínimo { id, organization_id, name, phone } sin exponer notas privadas ni LTV.
-- CRIT-04: Prevención de fraude en métricas. No permite manipulación arbitraria de total_spent/total_orders.
CREATE OR REPLACE FUNCTION public.capture_public_customer(
  p_organization_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL,
  p_order_total NUMERIC DEFAULT 0,
  p_order_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_clean_name TEXT;
  v_customer public.customers%ROWTYPE;
  v_org_exists BOOLEAN;
  v_verified_order_total NUMERIC := 0.00;
  v_has_verified_order BOOLEAN := FALSE;
BEGIN
  -- 1. Validar que la organización exista y se encuentre activa (Multi-Tenant Guard)
  SELECT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = p_organization_id AND is_active = TRUE
  ) INTO v_org_exists;

  IF NOT v_org_exists THEN
    RAISE EXCEPTION 'Organización inválida o inactiva' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validar nombre
  v_clean_name := trim(COALESCE(p_name, ''));
  IF length(v_clean_name) < 1 THEN
    RAISE EXCEPTION 'Nombre de cliente inválido' USING ERRCODE = '22023';
  END IF;

  -- 3. Normalización canónica de teléfono: solo dígitos numéricos
  v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  
  -- Si es formato celular de Perú (9 dígitos comenzando con 9), anteponer '51'
  IF length(v_clean_phone) = 9 AND substring(v_clean_phone from 1 for 1) = '9' THEN
    v_clean_phone := '51' || v_clean_phone;
  END IF;

  IF length(v_clean_phone) < 7 THEN
    RAISE EXCEPTION 'Teléfono inválido para registro de cliente' USING ERRCODE = '22023';
  END IF;

  -- 4. Verificación anti-fraude de pedidos (CRIT-04)
  IF p_order_number IS NOT NULL AND trim(p_order_number) <> '' THEN
    SELECT COALESCE(total, 0), TRUE
    INTO v_verified_order_total, v_has_verified_order
    FROM public.orders
    WHERE organization_id = p_organization_id
      AND order_number = trim(p_order_number)
      AND status != 'CANCELLED'
    LIMIT 1;
  END IF;

  -- 5. Inserción o Actualización Atómica (UPSERT)
  INSERT INTO public.customers (
    organization_id,
    name,
    phone,
    email,
    address,
    reference,
    notes,
    total_orders,
    total_spent,
    last_order_date,
    last_order_number,
    created_at,
    updated_at
  )
  VALUES (
    p_organization_id,
    v_clean_name,
    v_clean_phone,
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_address), ''),
    NULLIF(trim(p_reference), ''),
    NULL,
    CASE WHEN v_has_verified_order THEN 1 ELSE 0 END,
    CASE WHEN v_has_verified_order THEN GREATEST(v_verified_order_total, 0) ELSE 0.00 END,
    CASE WHEN v_has_verified_order THEN NOW() ELSE NULL END,
    CASE WHEN v_has_verified_order THEN trim(p_order_number) ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (organization_id, phone)
  DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(EXCLUDED.email, public.customers.email),
    address = COALESCE(EXCLUDED.address, public.customers.address),
    reference = COALESCE(EXCLUDED.reference, public.customers.reference),
    total_orders = public.customers.total_orders + CASE WHEN v_has_verified_order THEN 1 ELSE 0 END,
    total_spent = public.customers.total_spent + CASE WHEN v_has_verified_order THEN GREATEST(v_verified_order_total, 0) ELSE 0.00 END,
    last_order_date = CASE WHEN v_has_verified_order THEN NOW() ELSE public.customers.last_order_date END,
    last_order_number = CASE WHEN v_has_verified_order THEN trim(p_order_number) ELSE public.customers.last_order_number END,
    updated_at = NOW()
  RETURNING * INTO v_customer;

  -- 6. Respuesta Pública Mínima y Sanitizada (CRIT-02)
  RETURN jsonb_build_object(
    'id', v_customer.id,
    'organization_id', v_customer.organization_id,
    'name', v_customer.name,
    'phone', v_customer.phone
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_public_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated;

-- Trigger para sincronización automática y autoritativa de métricas de clientes
CREATE OR REPLACE FUNCTION public.sync_customer_metrics_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cust_id UUID;
  v_org_id UUID;
  v_tot_orders INT;
  v_tot_spent NUMERIC(10,2);
  v_last_date TIMESTAMPTZ;
  v_last_num TEXT;
BEGIN
  v_cust_id := COALESCE(NEW.customer_id, OLD.customer_id);
  v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);

  IF v_cust_id IS NOT NULL THEN
    SELECT 
      COUNT(*),
      COALESCE(SUM(total), 0.00),
      MAX(created_at)
    INTO v_tot_orders, v_tot_spent, v_last_date
    FROM public.orders
    WHERE organization_id = v_org_id
      AND customer_id = v_cust_id
      AND status != 'CANCELLED';

    SELECT order_number INTO v_last_num
    FROM public.orders
    WHERE organization_id = v_org_id
      AND customer_id = v_cust_id
      AND status != 'CANCELLED'
    ORDER BY created_at DESC
    LIMIT 1;

    UPDATE public.customers
    SET 
      total_orders = COALESCE(v_tot_orders, 0),
      total_spent = COALESCE(v_tot_spent, 0.00),
      last_order_date = v_last_date,
      last_order_number = v_last_num,
      updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_customer_metrics ON public.orders;
CREATE TRIGGER trg_sync_customer_metrics
  AFTER INSERT OR UPDATE OF status, total, customer_id OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_metrics_on_order();

-- ==============================================================================
-- 22. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: ORGANIZATIONS
-- ------------------------------------------------------------------------------
-- Lectura: Pública si está activa (para el catálogo /r/:slug), o si el usuario es miembro activo / SuperAdmin
DROP POLICY IF EXISTS "Organizations select policy" ON public.organizations;
CREATE POLICY "Organizations select policy"
  ON public.organizations FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(id));

-- Inserción: Solo usuarios autenticados
DROP POLICY IF EXISTS "Organizations insert policy" ON public.organizations;
CREATE POLICY "Organizations insert policy"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by OR public.is_super_admin());

-- Actualización: Solo OWNER, ADMIN de la org o SuperAdmin
DROP POLICY IF EXISTS "Organizations update policy" ON public.organizations;
CREATE POLICY "Organizations update policy"
  ON public.organizations FOR UPDATE
  USING (
    public.get_user_org_role(id) IN ('owner', 'admin', 'super_admin')
  )
  WITH CHECK (
    public.get_user_org_role(id) IN ('owner', 'admin', 'super_admin')
  );

-- Eliminación: Solo SuperAdmin o el Creador/Owner
DROP POLICY IF EXISTS "Organizations delete policy" ON public.organizations;
CREATE POLICY "Organizations delete policy"
  ON public.organizations FOR DELETE
  USING (
    public.get_user_org_role(id) IN ('owner', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: ORGANIZATION_SETTINGS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org settings select policy" ON public.organization_settings;
CREATE POLICY "Org settings select policy"
  ON public.organization_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_settings.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Org settings update policy" ON public.organization_settings;
CREATE POLICY "Org settings update policy"
  ON public.organization_settings FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  )
  WITH CHECK (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: ORGANIZATION_MEMBERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org members select policy" ON public.organization_members;
CREATE POLICY "Org members select policy"
  ON public.organization_members FOR SELECT
  USING (
    public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Org members insert policy" ON public.organization_members;
CREATE POLICY "Org members insert policy"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Org members update policy" ON public.organization_members;
CREATE POLICY "Org members update policy"
  ON public.organization_members FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
  );

DROP POLICY IF EXISTS "Org members delete policy" ON public.organization_members;
CREATE POLICY "Org members delete policy"
  ON public.organization_members FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
    OR user_id = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PLANS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Plans select policy" ON public.plans;
CREATE POLICY "Plans select policy"
  ON public.plans FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

DROP POLICY IF EXISTS "Plans manage policy" ON public.plans;
CREATE POLICY "Plans manage policy"
  ON public.plans FOR ALL
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Subscriptions select policy" ON public.subscriptions;
CREATE POLICY "Subscriptions select policy"
  ON public.subscriptions FOR SELECT
  USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Subscriptions manage policy" ON public.subscriptions;
CREATE POLICY "Subscriptions manage policy"
  ON public.subscriptions FOR ALL
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: CATEGORIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy"
  ON public.categories FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = categories.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Categories insert policy" ON public.categories;
CREATE POLICY "Categories insert policy"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Categories update policy" ON public.categories;
CREATE POLICY "Categories update policy"
  ON public.categories FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Categories delete policy" ON public.categories;
CREATE POLICY "Categories delete policy"
  ON public.categories FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PRODUCTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products select policy" ON public.products;
CREATE POLICY "Products select policy"
  ON public.products FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = products.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Products insert policy" ON public.products;
CREATE POLICY "Products insert policy"
  ON public.products FOR INSERT
  WITH CHECK (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Products update policy" ON public.products;
CREATE POLICY "Products update policy"
  ON public.products FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Products delete policy" ON public.products;
CREATE POLICY "Products delete policy"
  ON public.products FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: SERVICES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Services select policy" ON public.services;
CREATE POLICY "Services select policy"
  ON public.services FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = services.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Services insert policy" ON public.services;
CREATE POLICY "Services insert policy"
  ON public.services FOR INSERT
  WITH CHECK (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Services update policy" ON public.services;
CREATE POLICY "Services update policy"
  ON public.services FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Services delete policy" ON public.services;
CREATE POLICY "Services delete policy"
  ON public.services FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: BUSINESS_HOURS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Business hours select policy" ON public.business_hours;
CREATE POLICY "Business hours select policy"
  ON public.business_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = business_hours.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Business hours manage policy" ON public.business_hours;
CREATE POLICY "Business hours manage policy"
  ON public.business_hours FOR ALL
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: BUSINESS_GALLERY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Business gallery select policy" ON public.business_gallery;
CREATE POLICY "Business gallery select policy"
  ON public.business_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = business_gallery.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Business gallery manage policy" ON public.business_gallery;
CREATE POLICY "Business gallery manage policy"
  ON public.business_gallery FOR ALL
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: CUSTOMERS (CRM PRIVADO)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers select policy" ON public.customers;
CREATE POLICY "Customers select policy"
  ON public.customers FOR SELECT
  USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Customers insert policy" ON public.customers;
CREATE POLICY "Customers insert policy"
  ON public.customers FOR INSERT
  WITH CHECK (
    public.is_member_of_org(organization_id) AND 
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Customers update policy" ON public.customers;
CREATE POLICY "Customers update policy"
  ON public.customers FOR UPDATE
  USING (
    public.is_member_of_org(organization_id) AND 
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  )
  WITH CHECK (
    public.is_member_of_org(organization_id) AND 
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Customers delete policy" ON public.customers;
CREATE POLICY "Customers delete policy"
  ON public.customers FOR DELETE
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin'));

-- ------------------------------------------------------------------------------
-- POLÍTICAS: ORDERS (PEDIDOS)
-- ------------------------------------------------------------------------------
-- Clientes anónimos pueden crear pedidos en el catálogo público
DROP POLICY IF EXISTS "Orders public insert policy" ON public.orders;
CREATE POLICY "Orders public insert policy"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = orders.organization_id AND o.is_active = TRUE
    )
  );

-- Solo los miembros del negocio o SuperAdmin pueden ver los pedidos
DROP POLICY IF EXISTS "Orders members select policy" ON public.orders;
CREATE POLICY "Orders members select policy"
  ON public.orders FOR SELECT
  USING (public.is_member_of_org(organization_id));

-- Miembros del negocio (Owner, Admin, Staff) pueden actualizar estados de pedidos
DROP POLICY IF EXISTS "Orders members update policy" ON public.orders;
CREATE POLICY "Orders members update policy"
  ON public.orders FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Orders delete policy" ON public.orders;
CREATE POLICY "Orders delete policy"
  ON public.orders FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: ORDER_ITEMS (ARTÍCULOS DE PEDIDOS)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Order items public insert policy" ON public.order_items;
CREATE POLICY "Order items public insert policy"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders ord
      JOIN public.organizations o ON o.id = ord.organization_id
      WHERE ord.id = order_items.order_id
        AND o.id = order_items.organization_id
        AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

DROP POLICY IF EXISTS "Order items members select policy" ON public.order_items;
CREATE POLICY "Order items members select policy"
  ON public.order_items FOR SELECT
  USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Order items members update policy" ON public.order_items;
CREATE POLICY "Order items members update policy"
  ON public.order_items FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Order items delete policy" ON public.order_items;
CREATE POLICY "Order items delete policy"
  ON public.order_items FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: APPOINTMENTS (RESERVAS)
-- ------------------------------------------------------------------------------
-- Clientes anónimos pueden solicitar citas en la tienda pública
DROP POLICY IF EXISTS "Appointments public insert policy" ON public.appointments;
CREATE POLICY "Appointments public insert policy"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = appointments.organization_id AND o.is_active = TRUE
    ) AND (status IS NULL OR status = 'PENDING')
  );

DROP POLICY IF EXISTS "Appointments members select policy" ON public.appointments;
CREATE POLICY "Appointments members select policy"
  ON public.appointments FOR SELECT
  USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Appointments members update policy" ON public.appointments;
CREATE POLICY "Appointments members update policy"
  ON public.appointments FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

DROP POLICY IF EXISTS "Appointments delete policy" ON public.appointments;
CREATE POLICY "Appointments delete policy"
  ON public.appointments FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PAYMENT_TRANSACTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payments select policy" ON public.payment_transactions;
CREATE POLICY "Payments select policy"
  ON public.payment_transactions FOR SELECT
  USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Payments manage policy" ON public.payment_transactions;
CREATE POLICY "Payments manage policy"
  ON public.payment_transactions FOR ALL
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: WEBHOOK_LOGS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Webhook logs superadmin policy" ON public.webhook_logs;
CREATE POLICY "Webhook logs superadmin policy"
  ON public.webhook_logs FOR ALL
  USING (public.is_super_admin());

-- ==============================================================================
-- 23. STORAGE BUCKETS Y POLÍTICAS DE ACCESO
-- ==============================================================================

-- 1. Crear Buckets en el esquema storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', TRUE, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('business-assets', 'business-assets', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('gallery', 'gallery', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Políticas para Storage: avatars
DROP POLICY IF EXISTS "Avatars Public Read" ON storage.objects;
CREATE POLICY "Avatars Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars Auth Upload" ON storage.objects;
CREATE POLICY "Avatars Auth Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatars Auth Delete" ON storage.objects;
CREATE POLICY "Avatars Auth Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Políticas para Storage: business-assets (Logos y Portadas)
DROP POLICY IF EXISTS "Assets Public Read" ON storage.objects;
CREATE POLICY "Assets Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Assets Org Member Upload" ON storage.objects;
CREATE POLICY "Assets Org Member Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-assets' 
    AND auth.role() = 'authenticated'
    AND (
      public.is_member_of_org((storage.foldername(name))[1]::uuid)
    )
  );

DROP POLICY IF EXISTS "Assets Org Member Delete" ON storage.objects;
CREATE POLICY "Assets Org Member Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-assets' 
    AND auth.role() = 'authenticated'
    AND (
      public.is_member_of_org((storage.foldername(name))[1]::uuid)
    )
  );

-- 4. Políticas para Storage: gallery
DROP POLICY IF EXISTS "Gallery Public Read" ON storage.objects;
CREATE POLICY "Gallery Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Gallery Org Member Upload" ON storage.objects;
CREATE POLICY "Gallery Org Member Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (
      public.is_member_of_org((storage.foldername(name))[1]::uuid)
    )
  );

DROP POLICY IF EXISTS "Gallery Org Member Delete" ON storage.objects;
CREATE POLICY "Gallery Org Member Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (
      public.is_member_of_org((storage.foldername(name))[1]::uuid)
    )
  );

-- ==============================================================================
-- 24. SEED DATA DE PLANES INICIALES
-- ==============================================================================
INSERT INTO public.plans (
  id, name, slug, description, price_monthly, price_annual, 
  max_products, max_images, max_staff, custom_domain_allowed, 
  analytics_allowed, features, allowed_modules, is_active
)
VALUES 
(
  'plan_inicial', 
  'Plan Inicial', 
  'inicial', 
  'Perfecto para pequeños negocios que inician su presencia online y recepción por WhatsApp.', 
  29.00, 
  290.00, 
  30, 
  10, 
  1, 
  FALSE, 
  FALSE, 
  '["Hasta 30 productos en catálogo", "10 fotos de galería", "1 usuario administrador", "Recepción de pedidos por WhatsApp", "Panel de control básico", "Soporte estándar"]'::jsonb,
  '["products", "categories", "orders", "whatsapp", "gallery", "hours", "location"]'::jsonb,
  TRUE
),
(
  'plan_profesional', 
  'Plan Profesional', 
  'profesional', 
  'Para negocios en crecimiento que buscan potenciar sus ventas y fidelizar clientes.', 
  49.00, 
  490.00, 
  150, 
  50, 
  5, 
  FALSE, 
  TRUE, 
  '["Hasta 150 productos en catálogo", "50 fotos de galería", "5 usuarios con roles", "Gestión de clientes y CRM", "Métricas y reportes de ventas", "Soporte prioritario por WhatsApp"]'::jsonb,
  '["products", "services", "categories", "orders", "appointments", "customers", "whatsapp", "gallery", "hours", "location", "promotions", "analytics"]'::jsonb,
  TRUE
),
(
  'plan_premium', 
  'Plan Premium', 
  'premium', 
  'Para marcas y empresas consolidadas que requieren capacidad ilimitada y dominio propio.', 
  79.00, 
  790.00, 
  9999, 
  9999, 
  9999, 
  TRUE, 
  TRUE, 
  '["Productos y fotos ilimitadas", "Usuarios y colaboradores ilimitados", "Soporte para Dominio Propio (.com / .pe)", "Analíticas en tiempo real avanzadas", "Sin comisiones por ventas", "Soporte VIP 24/7 dedicado"]'::jsonb,
  '["products", "services", "categories", "orders", "appointments", "customers", "whatsapp", "gallery", "hours", "location", "promotions", "analytics", "notifications"]'::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  max_products = EXCLUDED.max_products,
  max_images = EXCLUDED.max_images,
  max_staff = EXCLUDED.max_staff,
  features = EXCLUDED.features,
  allowed_modules = EXCLUDED.allowed_modules;

-- ==============================================================================
-- 25. SUPABASE REALTIME (PUBLICACIÓN DE EVENTOS EN VIVO)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 26. ENFORCEMENT DE LÍMITES Y MÁQUINA DE ESTADOS (FASE 10 REMEDIACIÓN)
-- ==============================================================================

-- 26.1. Enforce resource limits via DB Triggers (Anti-Bypass REST/INSERT)
CREATE OR REPLACE FUNCTION public.enforce_organization_resource_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_id UUID;
  v_sub RECORD;
  v_plan RECORD;
  v_current_count INTEGER := 0;
  v_max_allowed INTEGER := 0;
  v_resource_name TEXT;
BEGIN
  v_org_id := NEW.organization_id;
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('org_limit_' || v_org_id::text || '_' || TG_TABLE_NAME));

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE organization_id = v_org_id
    AND status IN ('trial', 'active', 'past_due')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub.id IS NULL THEN
    SELECT * INTO v_plan FROM public.plans WHERE id = 'plan-inicial' LIMIT 1;
  ELSE
    SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id LIMIT 1;
  END IF;

  IF v_plan.id IS NULL THEN
    SELECT * INTO v_plan FROM public.plans ORDER BY price_monthly ASC LIMIT 1;
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'products' THEN
      v_resource_name := 'productos';
      v_max_allowed := COALESCE(v_plan.max_products, 30);
      SELECT COUNT(*) INTO v_current_count FROM public.products WHERE organization_id = v_org_id;
    WHEN 'business_gallery' THEN
      v_resource_name := 'imágenes de galería';
      v_max_allowed := COALESCE(v_plan.max_images, 10);
      SELECT COUNT(*) INTO v_current_count FROM public.business_gallery WHERE organization_id = v_org_id;
    WHEN 'organization_members' THEN
      v_resource_name := 'miembros de equipo';
      v_max_allowed := COALESCE(v_plan.max_staff, 1);
      SELECT COUNT(*) INTO v_current_count FROM public.organization_members WHERE organization_id = v_org_id;
    WHEN 'customers' THEN
      v_resource_name := 'clientes CRM';
      v_max_allowed := COALESCE(v_plan.max_customers, 100);
      SELECT COUNT(*) INTO v_current_count FROM public.customers WHERE organization_id = v_org_id;
    WHEN 'services' THEN
      v_resource_name := 'servicios';
      v_max_allowed := COALESCE(v_plan.max_products, 30);
      SELECT COUNT(*) INTO v_current_count FROM public.services WHERE organization_id = v_org_id;
    ELSE
      RETURN NEW;
  END CASE;

  IF v_current_count >= v_max_allowed THEN
    RAISE EXCEPTION 'Límite de plan excedido: Tu plan actual (%) permite un máximo de % % (Uso actual: %). Realiza un upgrade para continuar.',
      v_plan.name, v_max_allowed, v_resource_name, v_current_count
      USING ERRCODE = '54000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_limit_products ON public.products;
CREATE TRIGGER trg_enforce_limit_products
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organization_resource_limit();

DROP TRIGGER IF EXISTS trg_enforce_limit_gallery ON public.business_gallery;
CREATE TRIGGER trg_enforce_limit_gallery
  BEFORE INSERT ON public.business_gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organization_resource_limit();

DROP TRIGGER IF EXISTS trg_enforce_limit_members ON public.organization_members;
CREATE TRIGGER trg_enforce_limit_members
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organization_resource_limit();

DROP TRIGGER IF EXISTS trg_enforce_limit_customers ON public.customers;
CREATE TRIGGER trg_enforce_limit_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organization_resource_limit();

DROP TRIGGER IF EXISTS trg_enforce_limit_services ON public.services;
CREATE TRIGGER trg_enforce_limit_services
  BEFORE INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_organization_resource_limit();

-- 26.2. Enforce Subscription State Transitions
CREATE OR REPLACE FUNCTION public.enforce_subscription_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.validate_subscription_status_transition(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'Transición de estado de suscripción inválida de "%" a "%".', OLD.status, NEW.status
        USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_subscription_status ON public.subscriptions;
CREATE TRIGGER trg_validate_subscription_status
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_subscription_status_transition();

