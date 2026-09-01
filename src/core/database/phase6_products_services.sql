-- ==============================================================================
-- NEGOCIO FLEX - FASE 6: PRODUCTOS, SERVICIOS Y CATEGORÍAS (MULTI-TENANT DDL & RLS)
-- ==============================================================================

-- 1. TABLA: CATEGORÍAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    type TEXT NOT NULL DEFAULT 'PRODUCT' CHECK (type IN ('PRODUCT', 'SERVICE')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimización de consultas por negocio y orden
CREATE INDEX IF NOT EXISTS idx_categories_business_order ON public.categories (business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories (business_id, is_active);

-- 2. TABLA: PRODUCTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    promo_price NUMERIC(12, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida, filtrado y destacados
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products (business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (business_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products (business_id, is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (business_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_order ON public.products (business_id, display_order);

-- 3. TABLA: SERVICIOS (services)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    promo_price NUMERIC(12, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services (business_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services (business_id, category_id);

-- ==============================================================================
-- 4. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Helper function: Verifica si el usuario autenticado pertenece al negocio
CREATE OR REPLACE FUNCTION public.is_business_member(biz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = biz_id
      AND bm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = biz_id
      AND b.created_by = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- POLÍTICAS: CATEGORIES
-- -----------------------------------------------------------------------------
-- Clientes pueden leer categorías de negocios activos
CREATE POLICY "Public read active categories"
ON public.categories
FOR SELECT
USING (true);

-- Solo administradores y miembros pueden insertar categorías en su propio negocio
CREATE POLICY "Members can insert own categories"
ON public.categories
FOR INSERT
WITH CHECK (public.is_business_member(business_id));

-- Solo miembros pueden actualizar categorías de su negocio
CREATE POLICY "Members can update own categories"
ON public.categories
FOR UPDATE
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

-- Solo miembros pueden eliminar categorías de su negocio
CREATE POLICY "Members can delete own categories"
ON public.categories
FOR DELETE
USING (public.is_business_member(business_id));

-- -----------------------------------------------------------------------------
-- POLÍTICAS: PRODUCTS
-- -----------------------------------------------------------------------------
-- Vista pública: Cualquiera puede ver los productos del catálogo
CREATE POLICY "Public read products"
ON public.products
FOR SELECT
USING (true);

-- Creación de productos: Bounded a su propio negocio
CREATE POLICY "Members can insert own products"
ON public.products
FOR INSERT
WITH CHECK (public.is_business_member(business_id));

-- Actualización de productos: Bounded a su propio negocio
CREATE POLICY "Members can update own products"
ON public.products
FOR UPDATE
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

-- Eliminación de productos: Bounded a su propio negocio
CREATE POLICY "Members can delete own products"
ON public.products
FOR DELETE
USING (public.is_business_member(business_id));

-- -----------------------------------------------------------------------------
-- POLÍTICAS: SERVICES
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read services"
ON public.services
FOR SELECT
USING (true);

CREATE POLICY "Members can insert own services"
ON public.services
FOR INSERT
WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members can update own services"
ON public.services
FOR UPDATE
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members can delete own services"
ON public.services
FOR DELETE
USING (public.is_business_member(business_id));

-- ==============================================================================
-- 5. SUPABASE STORAGE POLICIES (business-assets/products)
-- ==============================================================================
-- Las imágenes de productos se almacenan bajo:
-- business-assets/{business_id}/products/{product_id}.jpg

CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-assets');

CREATE POLICY "Members can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets'
  AND auth.role() = 'authenticated'
);
