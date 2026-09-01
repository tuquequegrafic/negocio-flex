-- ==============================================================================
-- NEGOCIO FLEX - FASE 5: CONFIGURACIÓN Y PERSONALIZACIÓN DEL NEGOCIO
-- Esquema de Base de Datos, Políticas RLS y Storage para Supabase
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA PRINCIPAL DE NEGOCIOS / ORGANIZACIONES (Ampliación Fase 5)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) DEFAULT 'other',
    logo_url TEXT,
    cover_url TEXT,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    whatsapp_message TEXT DEFAULT 'Hola, quiero información sobre sus productos y servicios.',
    address TEXT,
    primary_color VARCHAR(20) DEFAULT '#2563EB',
    secondary_color VARCHAR(20) DEFAULT '#F59E0B',
    text_color VARCHAR(20) DEFAULT '#111827',
    accent_color VARCHAR(20) DEFAULT '#10B981',
    currency VARCHAR(10) DEFAULT 'S/',
    slogan VARCHAR(255),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    tiktok VARCHAR(255),
    youtube VARCHAR(255),
    website VARCHAR(255),
    modules JSONB DEFAULT '{
        "products": true,
        "services": true,
        "gallery": true,
        "whatsapp": true,
        "hours": true,
        "location": true,
        "testimonials": false,
        "appointments": false,
        "orders": true,
        "social": true,
        "delivery": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE HORARIOS DE ATENCIÓN (business_hours)
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_number INT NOT NULL CHECK (day_number BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes ... 6=Sábado
    day_name VARCHAR(20) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    opening_time VARCHAR(10) DEFAULT '09:00',
    closing_time VARCHAR(10) DEFAULT '18:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_business_day UNIQUE(business_id, day_number)
);

-- 4. TABLA DE GALERÍA DE FOTOGRAFÍAS (business_gallery)
CREATE TABLE IF NOT EXISTS public.business_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON public.business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_gallery_business_id ON public.business_gallery(business_id);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE SEGURIDAD (RLS)
-- Lectura pública para catálogos y página web del negocio
CREATE POLICY "Public Read Businesses"
    ON public.businesses FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public Read Business Hours"
    ON public.business_hours FOR SELECT
    USING (true);

CREATE POLICY "Public Read Business Gallery"
    ON public.business_gallery FOR SELECT
    USING (true);

-- Modificación exclusiva para el propietario/administrador del negocio
CREATE POLICY "Owners can update own business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.businesses.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.businesses.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can insert business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can manage business hours"
    ON public.business_hours FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = public.business_hours.business_id
            AND (b.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = b.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
            ))
        )
    );

CREATE POLICY "Owners can manage gallery"
    ON public.business_gallery FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = public.business_gallery.business_id
            AND (b.user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = b.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
            ))
        )
    );

-- 8. STORAGE BUCKET: 'business-assets'
-- Insertar bucket público si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-assets',
    'business-assets',
    true,
    5242880, -- 5MB por imagen
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- Políticas de Storage para 'business-assets'
CREATE POLICY "Public Read Business Assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can upload business assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Users can update and delete their own business assets"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'business-assets' AND (auth.uid() = owner OR auth.role() = 'authenticated'));
