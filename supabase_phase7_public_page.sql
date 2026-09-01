-- ==============================================================================
-- FASE 7: PÁGINA PÚBLICA DEL NEGOCIO (URL SLUG, SEO, PERMISOS PÚBLICOS)
-- ==============================================================================

-- 1. Asegurar campo slug único e indexado en la tabla businesses
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS map_embed_url TEXT;

-- Crear índice para búsqueda ultrarrápida por slug en la URL pública /r/:slug
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses (slug);

-- 2. Asegurar campos de colores y redes en business_settings
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 3. POLÍTICAS DE ACCESO PÚBLICO (ANONYMOUS READ) PARA LA PÁGINA PÚBLICA
-- Cualquier cliente anónimo en internet puede leer los datos de un negocio activo, sus categorías y sus productos disponibles:

-- Lectura pública de negocios activos
CREATE POLICY "Public anonymous read access to active businesses"
  ON public.businesses FOR SELECT
  USING (is_active = true);

-- Lectura pública de configuraciones de negocios activos
CREATE POLICY "Public anonymous read access to business settings"
  ON public.business_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_settings.business_id AND b.is_active = true
  ));

-- Lectura pública de categorías activas
CREATE POLICY "Public anonymous read access to active categories"
  ON public.categories FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = categories.business_id AND b.is_active = true
  ));

-- Lectura pública de productos activos
CREATE POLICY "Public anonymous read access to active products"
  ON public.products FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = products.business_id AND b.is_active = true
  ));

-- Lectura pública de servicios activos
CREATE POLICY "Public anonymous read access to active services"
  ON public.services FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = services.business_id AND b.is_active = true
  ));

-- Lectura pública de galería de fotos
CREATE POLICY "Public anonymous read access to business gallery"
  ON public.gallery_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = gallery_items.business_id AND b.is_active = true
  ));

-- Lectura pública de horarios de atención
CREATE POLICY "Public anonymous read access to business hours"
  ON public.business_hours FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_hours.business_id AND b.is_active = true
  ));
