-- ==============================================================================
-- FASE 7: PÁGINA PÚBLICA DEL NEGOCIO (URL SLUG, SEO, PERMISOS PÚBLICOS Y BRANDING)
-- Negocio Flex — Arquitectura Multi-Tenant Segura con Supabase PostgreSQL
-- ==============================================================================

-- 1. Asegurar columnas de slug, estado activo, SEO y mapas en tabla organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS map_embed_url TEXT;

-- Índice para búsqueda atómica y de ultra alta velocidad por slug
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active_slug ON public.organizations(slug, is_active);

-- 2. Asegurar columnas de personalización de marca y redes en organization_settings
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS map_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 3. Habilitar RLS en todas las tablas de datos públicos si no está habilitado
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO PÚBLICO (ANONYMOUS & AUTHENTICATED READ)
-- Regla estricta: Solo registros de organizaciones activas (is_active = true)
-- y nunca exponer PII (clientes, teléfonos privados o pedidos de otros).

-- 4.1 Organizations: Lectura pública solo si el negocio está activo
DROP POLICY IF EXISTS "Organizations select policy" ON public.organizations;
CREATE POLICY "Organizations select policy"
  ON public.organizations FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(id));

-- 4.2 Organization Settings: Lectura pública solo para organizaciones activas
DROP POLICY IF EXISTS "Org settings select policy" ON public.organization_settings;
CREATE POLICY "Org settings select policy"
  ON public.organization_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_settings.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

-- 4.3 Categories: Solo categorías activas de organizaciones activas
DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy"
  ON public.categories FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = categories.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

-- 4.4 Products: Solo productos activos de organizaciones activas
DROP POLICY IF EXISTS "Products select policy" ON public.products;
CREATE POLICY "Products select policy"
  ON public.products FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = products.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

-- 4.5 Services: Solo servicios activos de organizaciones activas
DROP POLICY IF EXISTS "Services select policy" ON public.services;
CREATE POLICY "Services select policy"
  ON public.services FOR SELECT
  USING (
    (is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = services.organization_id AND o.is_active = TRUE
    )) OR public.is_member_of_org(organization_id)
  );

-- 4.6 Business Hours: Horarios de atención de organizaciones activas
DROP POLICY IF EXISTS "Business hours select policy" ON public.business_hours;
CREATE POLICY "Business hours select policy"
  ON public.business_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = business_hours.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

-- 4.7 Business Gallery: Galería fotográfica de organizaciones activas
DROP POLICY IF EXISTS "Business gallery select policy" ON public.business_gallery;
CREATE POLICY "Business gallery select policy"
  ON public.business_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = business_gallery.organization_id AND o.is_active = TRUE
    ) OR public.is_member_of_org(organization_id)
  );

-- 4.8 Customers (CRM Privado): ESTRICTAMENTE PROHIBIDO EL ACCESO PÚBLICO
DROP POLICY IF EXISTS "Customers select policy" ON public.customers;
CREATE POLICY "Customers select policy"
  ON public.customers FOR SELECT
  USING (public.is_member_of_org(organization_id));
