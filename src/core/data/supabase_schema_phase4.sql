-- ==============================================================================
-- NEGOCIO FLEX — FASE 4: ARQUITECTURA MULTI-TENANT, ORGANIZACIONES, ROLES Y RLS
-- PostgreSQL / Supabase Migration: Organizations, Members, Settings & RPCs
-- ==============================================================================

-- 1. TABLA: public.organizations
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    business_type text not null check (
        business_type in (
            'restaurant', 'salon', 'gym', 'store', 'professional', 'other',
            'pasteleria', 'barberia', 'ferreteria', 'veterinaria', 'boutique',
            'servicios_generales', 'personalizado'
        )
    ),
    status text default 'active' check (status in ('active', 'inactive', 'suspended')),
    created_by uuid references auth.users(id) on delete restrict,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices de búsqueda
create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_organizations_created_by on public.organizations(created_by);

-- 2. TABLA: public.organization_members (Relación N:M Usuario <-> Organización)
create table if not exists public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'owner' check (role in ('owner', 'admin', 'staff')),
    status text default 'active' check (status in ('active', 'inactive', 'invited', 'suspended')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (organization_id, user_id)
);

-- Índices de membresía
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);

-- 3. TABLA: public.organization_settings (Configuración dinámica JSONB)
create table if not exists public.organization_settings (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade unique not null,
    settings jsonb not null default '{
        "language": "es",
        "timezone": "America/Lima",
        "currency": "PEN"
    }'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_org_settings_org on public.organization_settings(organization_id);

-- 4. TABLA PREPARADA: public.organization_invitations (Esquema preliminar para invitaciones)
create table if not exists public.organization_invitations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    email text not null,
    role text default 'staff' check (role in ('admin', 'staff')),
    token text not null unique,
    status text default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
    expires_at timestamp with time zone not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_org_invitations_token on public.organization_invitations(token);
create index if not exists idx_org_invitations_email on public.organization_invitations(email);

-- ==============================================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_invitations enable row level security;

-- ==============================================================================
-- 6. POLÍTICAS RLS: organizations
-- ==============================================================================

-- SELECT: Solo miembros activos de la organización pueden ver sus datos
drop policy if exists "Users can view organizations they belong to" on public.organizations;
create policy "Users can view organizations they belong to"
    on public.organizations for select
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = organizations.id
              and organization_members.user_id = auth.uid()
              and organization_members.status = 'active'
        )
    );

-- UPDATE: Solo OWNER y ADMIN pueden actualizar la información de su organización
drop policy if exists "Owners and admins can update organization" on public.organizations;
create policy "Owners and admins can update organization"
    on public.organizations for update
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = organizations.id
              and organization_members.user_id = auth.uid()
              and organization_members.role in ('owner', 'admin')
              and organization_members.status = 'active'
        )
    );

-- INSERT: Creación directa o a través de la función RPC segura
drop policy if exists "Authenticated users can insert organization" on public.organizations;
create policy "Authenticated users can insert organization"
    on public.organizations for insert
    with check (auth.uid() = created_by);

-- ==============================================================================
-- 7. POLÍTICAS RLS: organization_members
-- ==============================================================================

-- SELECT: Los miembros activos pueden ver a los demás miembros de su organización
drop policy if exists "Members can view peers in same organization" on public.organization_members;
create policy "Members can view peers in same organization"
    on public.organization_members for select
    using (
        exists (
            select 1 from public.organization_members as m
            where m.organization_id = organization_members.organization_id
              and m.user_id = auth.uid()
              and m.status = 'active'
        )
    );

-- UPDATE: Solo OWNER puede cambiar roles o estados de otros miembros
drop policy if exists "Owners can update organization members" on public.organization_members;
create policy "Owners can update organization members"
    on public.organization_members for update
    using (
        exists (
            select 1 from public.organization_members as m
            where m.organization_id = organization_members.organization_id
              and m.user_id = auth.uid()
              and m.role = 'owner'
              and m.status = 'active'
        )
    );

-- DELETE: Solo OWNER puede eliminar miembros de su organización
drop policy if exists "Owners can delete organization members" on public.organization_members;
create policy "Owners can delete organization members"
    on public.organization_members for delete
    using (
        exists (
            select 1 from public.organization_members as m
            where m.organization_id = organization_members.organization_id
              and m.user_id = auth.uid()
              and m.role = 'owner'
              and m.status = 'active'
        )
    );

-- ==============================================================================
-- 8. POLÍTICAS RLS: organization_settings
-- ==============================================================================

-- SELECT: Miembros de la organización pueden leer la configuración
drop policy if exists "Members can view organization settings" on public.organization_settings;
create policy "Members can view organization settings"
    on public.organization_settings for select
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = organization_settings.organization_id
              and organization_members.user_id = auth.uid()
              and organization_members.status = 'active'
        )
    );

-- UPDATE: Solo OWNER y ADMIN pueden modificar la configuración
drop policy if exists "Owners and admins can update settings" on public.organization_settings;
create policy "Owners and admins can update settings"
    on public.organization_settings for update
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = organization_settings.organization_id
              and organization_members.user_id = auth.uid()
              and organization_members.role in ('owner', 'admin')
              and organization_members.status = 'active'
        )
    );

-- ==============================================================================
-- 9. FUNCIONES SEGURAS Y TRANSACCIONES RPC
-- ==============================================================================

-- Helper: Generación de Slug Seguro y Único
create or replace function public.generate_unique_slug(base_name text)
returns text
language plpgsql
as $$
declare
    clean_slug text;
    final_slug text;
    counter integer := 1;
begin
    -- 1. Normalizar a minúsculas y reemplazar espacios / caracteres especiales
    clean_slug := lower(trim(base_name));
    clean_slug := regexp_replace(clean_slug, '[áàäâ]', 'a', 'g');
    clean_slug := regexp_replace(clean_slug, '[éèëê]', 'e', 'g');
    clean_slug := regexp_replace(clean_slug, '[íìïî]', 'i', 'g');
    clean_slug := regexp_replace(clean_slug, '[óòöô]', 'o', 'g');
    clean_slug := regexp_replace(clean_slug, '[úùüû]', 'u', 'g');
    clean_slug := regexp_replace(clean_slug, '[ñ]', 'n', 'g');
    clean_slug := regexp_replace(clean_slug, '[^a-z0-9]+', '-', 'g');
    clean_slug := regexp_replace(clean_slug, '^-+|-+$', '', 'g');

    if clean_slug = '' then
        clean_slug := 'negocio';
    end if;

    final_slug := clean_slug;

    -- 2. Garantizar unicidad con sufijo incremental
    while exists (select 1 from public.organizations where slug = final_slug) loop
        counter := counter + 1;
        final_slug := clean_slug || '-' || counter;
    end loop;

    return final_slug;
end;
$$;

-- Transacción Atómica: create_organization
-- Crea Organización + Asigna Creador como OWNER + Crea Settings iniciales
create or replace function public.create_organization(
    org_name text,
    org_business_type text,
    custom_slug text default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    current_user_id uuid;
    resolved_slug text;
    new_org_id uuid;
    result jsonb;
begin
    -- 1. Validar autenticación
    current_user_id := auth.uid();
    if current_user_id is null then
        raise exception 'Usuario no autenticado para crear una organización';
    end if;

    if trim(org_name) = '' then
        raise exception 'El nombre de la organización es obligatorio';
    end if;

    -- 2. Resolver slug único
    if custom_slug is not null and trim(custom_slug) <> '' then
        resolved_slug := public.generate_unique_slug(custom_slug);
    else
        resolved_slug := public.generate_unique_slug(org_name);
    end if;

    -- 3. Insertar Organización
    insert into public.organizations (name, slug, business_type, status, created_by)
    values (org_name, resolved_slug, org_business_type, 'active', current_user_id)
    returning id into new_org_id;

    -- 4. Insertar Miembro como OWNER
    insert into public.organization_members (organization_id, user_id, role, status)
    values (new_org_id, current_user_id, 'owner', 'active');

    -- 5. Insertar Configuración Inicial de la Organización
    insert into public.organization_settings (organization_id, settings)
    values (
        new_org_id,
        jsonb_build_object(
            'language', 'es',
            'timezone', 'America/Lima',
            'currency', 'PEN'
        )
    );

    -- 6. Construir y retornar resultado
    select jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'business_type', o.business_type,
        'status', o.status,
        'created_by', o.created_by,
        'created_at', o.created_at,
        'role', 'owner'
    ) into result
    from public.organizations o
    where o.id = new_org_id;

    return result;
end;
$$;

-- Transacción Segura: change_member_role
-- Solo un OWNER puede cambiar el rol de un miembro, y no se puede degradar al último OWNER activo
create or replace function public.change_member_role(
    p_organization_id uuid,
    p_target_user_id uuid,
    p_new_role text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    caller_id uuid;
    caller_role text;
    target_current_role text;
    active_owners_count integer;
begin
    caller_id := auth.uid();
    if caller_id is null then
        raise exception 'No autenticado';
    end if;

    -- Verificar que el invocador sea OWNER activo
    select role into caller_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = caller_id
      and status = 'active';

    if caller_role <> 'owner' then
        raise exception 'Solo los propietarios pueden modificar roles en la organización';
    end if;

    -- Verificar que el rol destino sea válido
    if p_new_role not in ('owner', 'admin', 'staff') then
        raise exception 'Rol no válido: %', p_new_role;
    end if;

    -- Si se intenta cambiar el rol del OWNER actual, verificar que no quede sin propietarios
    select role into target_current_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_target_user_id
      and status = 'active';

    if target_current_role = 'owner' and p_new_role <> 'owner' then
        select count(*) into active_owners_count
        from public.organization_members
        where organization_id = p_organization_id
          and role = 'owner'
          and status = 'active';

        if active_owners_count <= 1 then
            raise exception 'La organización debe mantener al menos un propietario (OWNER) activo';
        end if;
    end if;

    -- Actualizar rol
    update public.organization_members
    set role = p_new_role, updated_at = now()
    where organization_id = p_organization_id
      and user_id = p_target_user_id;

    return jsonb_build_object('success', true, 'organization_id', p_organization_id, 'user_id', p_target_user_id, 'new_role', p_new_role);
end;
$$;

-- Transacción Segura: remove_organization_member
create or replace function public.remove_organization_member(
    p_organization_id uuid,
    p_target_user_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    caller_id uuid;
    caller_role text;
    target_role text;
    active_owners_count integer;
begin
    caller_id := auth.uid();
    if caller_id is null then
        raise exception 'No autenticado';
    end if;

    select role into caller_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = caller_id
      and status = 'active';

    -- Permitir si es OWNER o si el usuario se está retirando a sí mismo
    if caller_role <> 'owner' and caller_id <> p_target_user_id then
        raise exception 'Permisos insuficientes para eliminar a este miembro';
    end if;

    -- Verificar que no se elimine al último OWNER
    select role into target_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_target_user_id
      and status = 'active';

    if target_role = 'owner' then
        select count(*) into active_owners_count
        from public.organization_members
        where organization_id = p_organization_id
          and role = 'owner'
          and status = 'active';

        if active_owners_count <= 1 then
            raise exception 'No puedes eliminar al único propietario (OWNER) de la organización';
        end if;
    end if;

    delete from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_target_user_id;

    return jsonb_build_object('success', true, 'removed_user_id', p_target_user_id);
end;
$$;
