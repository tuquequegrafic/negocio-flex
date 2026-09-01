-- ==============================================================================
-- NEGOCIO FLEX — FASE 3: ESQUEMA DE BASE DE DATOS Y SEGURIDAD RLS
-- PostgreSQL / Supabase Migration: Auth, Profiles, Trigger y Storage
-- ==============================================================================

-- 1. TABLA: public.profiles
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text,
    phone text,
    avatar_url text,
    role text default 'owner' check (role in ('super_admin', 'owner', 'manager', 'staff', 'customer')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 2. POLÍTICAS RLS PARA PROFILES
-- SELECT: Un usuario solo puede ver su propio perfil
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
    on public.profiles for select
    using (auth.uid() = id);

-- UPDATE: Un usuario solo puede modificar su propio perfil
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- INSERT: Permitir inserción durante el registro o trigger
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- 3. TRIGGER AUTOMÁTICO PARA CREACIÓN DE PERFIL (auth.users -> public.profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, email, phone, avatar_url, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'avatar_url',
        coalesce(new.raw_user_meta_data->>'role', 'owner')
    )
    on conflict (id) do update set
        full_name = coalesce(excluded.full_name, profiles.full_name),
        phone = coalesce(excluded.phone, profiles.phone),
        updated_at = now();
    return new;
end;
$$;

-- Eliminar trigger previo si existe y recrear
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 4. BUCKET DE STORAGE: avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avatars',
    'avatars',
    true,
    3145728, -- 3 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 5. POLÍTICAS RLS PARA STORAGE (avatars)
-- LECTURA: Acceso público a los avatares para visualizarlos
drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
    on storage.objects for select
    using (bucket_id = 'avatars');

-- ESCRITURA: Solo el usuario autenticado puede subir a su propia carpeta: avatars/{user_id}/*
drop policy if exists "User can upload own avatar" on storage.objects;
create policy "User can upload own avatar"
    on storage.objects for insert
    with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- ACTUALIZACIÓN: Solo el dueño del archivo puede modificarlo
drop policy if exists "User can update own avatar" on storage.objects;
create policy "User can update own avatar"
    on storage.objects for update
    using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- ELIMINACIÓN: Solo el dueño del archivo puede eliminarlo
drop policy if exists "User can delete own avatar" on storage.objects;
create policy "User can delete own avatar"
    on storage.objects for delete
    using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
