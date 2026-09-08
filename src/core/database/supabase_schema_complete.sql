-- ==============================================================================
-- NEGOCIO FLEX — SCHEMA COMPLETO DE BASE DE DATOS Y SEGURIDAD SUPABASE
-- FASE 11 & FASE 12: IMPLEMENTACIÓN, RLS Y PRODUCCIÓN
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: PROFILES (Usuarios y Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: ORGANIZATIONS / BUSINESSES (Negocios / Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: ORGANIZATION_SETTINGS (Configuración y Branding del Negocio)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#064E3B',
  accent_color TEXT DEFAULT '#F59E0B',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  whatsapp_message TEXT DEFAULT '¡Hola! Deseo realizar el siguiente pedido:',
  email TEXT DEFAULT '',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  website_url TEXT,
  currency TEXT DEFAULT 'S/',
  slogan TEXT DEFAULT '',
  active_modules JSONB DEFAULT '{
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: ORGANIZATION_MEMBERS (Roles y Permisos de Usuarios en cada Negocio)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'STAFF', 'CUSTOMER')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 6. TABLA: PLANS (Planes de Suscripción SaaS)
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
  custom_domain_allowed BOOLEAN DEFAULT FALSE,
  analytics_allowed BOOLEAN DEFAULT FALSE,
  support_level TEXT DEFAULT 'WhatsApp estándar',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: SUBSCRIPTIONS (Suscripciones por Negocio)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  billing_period TEXT DEFAULT 'MONTHLY' CHECK (billing_period IN ('MONTHLY', 'ANNUAL')),
  amount_paid NUMERIC(10, 2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'Culqi / Yape',
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: CATEGORIES (Categorías de Productos o Servicios)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'PRODUCT' CHECK (type IN ('PRODUCT', 'SERVICE')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: PRODUCTS (Catálogo de Productos)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  promo_price NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 999,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: SERVICES (Catálogo de Servicios para Salones, Spas, Talleres)
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
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: BUSINESS_HOURS (Horarios de Atención)
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_name TEXT NOT NULL,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE(organization_id, day_of_week)
);

-- 12. TABLA: BUSINESS_GALLERY (Galería de Fotos)
CREATE TABLE IF NOT EXISTS public.business_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT,
  category TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABLA: CUSTOMERS (Directorio CRM de Clientes)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  reference TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 1,
  total_spent NUMERIC(10, 2) DEFAULT 0.00,
  last_order_date TIMESTAMPTZ DEFAULT NOW(),
  last_order_number TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone)
);

-- 14. TABLA: ORDERS (Pedidos Recibidos)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABLA: APPOINTMENTS (Reservas / Citas)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  staff_id UUID,
  staff_name TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TABLA: PAYMENT_TRANSACTIONS (Historial de Pagos SaaS y Pasarelas)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
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
  webhook_verified BOOLEAN DEFAULT TRUE,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. TABLA: WEBHOOK_LOGS (Auditoría de Eventos de Pasarelas)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES — MULTI-TENANT ROBUSTO
-- ==============================================================================

-- Activar RLS en todas las tablas
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
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Verificar si el usuario autenticado pertenece al negocio
CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Verificar si el usuario es Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS: PROFILES
CREATE POLICY "Users can read their own profile or superadmins read all"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- POLÍTICAS: ORGANIZATIONS
-- Lectura pública para la página web del negocio por slug
CREATE POLICY "Public can read active organizations"
  ON public.organizations FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(id));

CREATE POLICY "Members can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.is_member_of_org(id));

CREATE POLICY "Super admin can do everything on organizations"
  ON public.organizations FOR ALL
  USING (public.is_super_admin());

-- POLÍTICAS: ORGANIZATION_SETTINGS
CREATE POLICY "Public can read settings of active organizations"
  ON public.organization_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Members can update their settings"
  ON public.organization_settings FOR UPDATE
  USING (public.is_member_of_org(organization_id));

-- POLÍTICAS: PRODUCTS & CATEGORIES & SERVICES
CREATE POLICY "Public can view active products and categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(organization_id));

CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(organization_id));

CREATE POLICY "Members can manage products"
  ON public.products FOR ALL
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Members can manage categories"
  ON public.categories FOR ALL
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(organization_id));

CREATE POLICY "Members can manage services"
  ON public.services FOR ALL
  USING (public.is_member_of_org(organization_id));

-- POLÍTICAS: ORDERS & APPOINTMENTS
-- Permitir a clientes anónimos crear pedidos en la tienda pública
CREATE POLICY "Public can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (TRUE);

-- Solo los miembros del negocio pueden ver y actualizar los pedidos de su tienda
CREATE POLICY "Members can view their own org orders"
  ON public.orders FOR SELECT
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Members can update their own org orders"
  ON public.orders FOR UPDATE
  USING (public.is_member_of_org(organization_id));

-- POLÍTICAS: CUSTOMERS (CRM PRIVADO)
CREATE POLICY "Customers select policy"
  ON public.customers FOR SELECT
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Customers insert policy"
  ON public.customers FOR INSERT
  WITH CHECK (
    public.is_member_of_org(organization_id) AND 
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

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

CREATE POLICY "Customers delete policy"
  ON public.customers FOR DELETE
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin'));

-- POLÍTICAS: APPOINTMENTS (RESERVAS / CITAS)
CREATE POLICY "Appointments public insert policy"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = appointments.organization_id AND o.is_active = TRUE
    )
  );

CREATE POLICY "Appointments members select policy"
  ON public.appointments FOR SELECT
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Appointments members update policy"
  ON public.appointments FOR UPDATE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

CREATE POLICY "Appointments delete policy"
  ON public.appointments FOR DELETE
  USING (
    public.get_user_org_role(organization_id) IN ('owner', 'super_admin')
  );

-- ------------------------------------------------------------------------------
-- TRIGGER & FUNCIÓN: PREVENCIÓN ATÓMICA DE DOBLE RESERVA / CONCURRENCIA (FASE 6)
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
  IF NEW.status = 'CANCELLED' THEN
    RETURN NEW;
  END IF;

  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: La hora de fin (%) debe ser posterior a la hora de inicio (%)', NEW.end_time, NEW.start_time
      USING ERRCODE = '22000';
  END IF;

  -- Advisory lock transaccional por organización, fecha y staff
  v_staff_key := COALESCE(NULLIF(TRIM(LOWER(NEW.staff_name)), ''), NEW.staff_id::text, 'GLOBAL_STAFF');
  v_lock_key := ('x' || SUBSTR(MD5(NEW.organization_id::text || '_' || NEW.appointment_date::text || '_' || v_staff_key), 1, 16))::bit(64)::bigint;

  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT id INTO v_conflict_id
  FROM public.appointments
  WHERE organization_id = NEW.organization_id
    AND appointment_date = NEW.appointment_date
    AND status != 'CANCELLED'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.staff_id IS NOT NULL AND staff_id IS NOT NULL AND NEW.staff_id = staff_id)
      OR
      (NEW.staff_name IS NOT NULL AND staff_name IS NOT NULL AND LOWER(TRIM(NEW.staff_name)) = LOWER(TRIM(staff_name)) AND TRIM(NEW.staff_name) != '')
      OR
      ((NEW.staff_id IS NULL AND (NEW.staff_name IS NULL OR TRIM(NEW.staff_name) = '')) OR (staff_id IS NULL AND (staff_name IS NULL OR TRIM(staff_name) = '')))
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

-- RPC: Consulta Pública Segura de Disponibilidad Horaria (Fase 6)
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
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = p_organization_id AND is_active = TRUE
  ) THEN
    RETURN;
  END IF;

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

CREATE POLICY "Members can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (public.is_member_of_org(organization_id));

CREATE POLICY "Super admin can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_super_admin());

-- ==============================================================================
-- 19. SEED DATA DE PLANES INICIALES
-- ==============================================================================
INSERT INTO public.plans (id, name, slug, description, price_monthly, price_annual, max_products, max_images, max_staff, custom_domain_allowed, analytics_allowed, features, allowed_modules)
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
  '["products", "categories", "orders", "whatsapp", "gallery", "hours", "location"]'::jsonb
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
  '["products", "services", "categories", "orders", "appointments", "customers", "whatsapp", "gallery", "hours", "location", "promotions", "analytics"]'::jsonb
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
  '["products", "services", "categories", "orders", "appointments", "customers", "whatsapp", "gallery", "hours", "location", "promotions", "analytics", "notifications"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  max_products = EXCLUDED.max_products,
  features = EXCLUDED.features;

-- 20. REALTIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
