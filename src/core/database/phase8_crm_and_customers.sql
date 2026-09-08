-- ==============================================================================
-- NEGOCIO FLEX - FASE 8: MÓDULO INTEGRAL DE CLIENTES (CRM Y HISTORIAL 360°)
-- Script de Migración, RPCs Atómicos y Seguridad RLS
-- ==============================================================================

-- 0. GARANTIZAR COLUMNA last_order_number EN TABLA CUSTOMERS (CRIT-01)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_order_number TEXT DEFAULT NULL;

-- 1. VERIFICAR EXTENSIÓN PG_TRGM PARA BÚSQUEDAS DIFUSAS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ÍNDICES DE ALTO RENDIMIENTO PARA BÚSQUEDA MULTI-TENANT EN CRM
CREATE INDEX IF NOT EXISTS idx_customers_org_name 
  ON public.customers(organization_id, name);

CREATE INDEX IF NOT EXISTS idx_customers_org_email 
  ON public.customers(organization_id, email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_org_spent 
  ON public.customers(organization_id, total_spent DESC);

CREATE INDEX IF NOT EXISTS idx_customers_org_last_order 
  ON public.customers(organization_id, last_order_date DESC) 
  WHERE last_order_date IS NOT NULL;

-- 3. VINCULACIÓN BIDIRECCIONAL ENTRE ORDERS / APPOINTMENTS Y CUSTOMERS
CREATE INDEX IF NOT EXISTS idx_orders_org_customer_phone 
  ON public.orders(organization_id, customer_phone);

CREATE INDEX IF NOT EXISTS idx_appointments_org_customer_phone 
  ON public.appointments(organization_id, customer_phone);

-- 4. POLÍTICAS DE SEGURIDAD RLS ESTRICTAS PARA CUSTOMERS
-- Asegurar que Row Level Security esté activo
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Lectura: Solo miembros de la organización correspondiente
DROP POLICY IF EXISTS "Customers select policy" ON public.customers;
CREATE POLICY "Customers select policy"
  ON public.customers FOR SELECT
  USING (public.is_member_of_org(organization_id));

-- Inserción interna: Solo miembros autorizados (owner, admin, staff, super_admin)
-- NOTA CRÍTICA DE SEGURIDAD (RBAC): El rol viewer y usuarios anon NO tienen permiso de INSERT directo.
DROP POLICY IF EXISTS "Customers insert policy" ON public.customers;
CREATE POLICY "Customers insert policy"
  ON public.customers FOR INSERT
  WITH CHECK (
    public.is_member_of_org(organization_id) AND 
    public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')
  );

-- Actualización interna: Solo miembros autorizados (owner, admin, staff, super_admin)
-- NOTA CRÍTICA DE SEGURIDAD: Los roles viewer y clientes anónimos (anon) NO tienen permiso de UPDATE directo.
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

-- Eliminación: Solo roles administrativos de la organización (owner, admin, super_admin)
DROP POLICY IF EXISTS "Customers delete policy" ON public.customers;
CREATE POLICY "Customers delete policy"
  ON public.customers FOR DELETE
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin'));

-- 5. FUNCIÓN RPC: CAPTURA PÚBLICA SEGURA Y ATÓMICA DE CLIENTE (CHECKOUT / CITAS)
-- Resuelve atómicamente el registro/actualización de clientes desde el flujo público (sin RLS bypass)
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
  -- Solo se incrementan métricas si se valida la existencia de un pedido real y no cancelado en la base de datos
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
  -- NOTA: notes jamás se sobrescriben por el flujo público para proteger confidencialidad
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
  -- Se excluyen estrictamente 'notes', 'total_spent', 'total_orders', 'created_at', 'updated_at'
  RETURN jsonb_build_object(
    'id', v_customer.id,
    'organization_id', v_customer.organization_id,
    'name', v_customer.name,
    'phone', v_customer.phone
  );
END;
$$;

-- 6. FUNCIÓN RPC: OBTENER FICHA CONSOLIDADA 360° DE CLIENTE
-- Corrección Auditada:
-- - Las métricas (total_orders, total_spent, avg_ticket) se calculan sobre TODOS los pedidos válidos (no cancelados).
-- - El timeline visual mantiene LIMIT 20 para garantizar máximo rendimiento.
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
  -- Validar membresía del usuario autenticado que realiza la consulta
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

  -- 2. Calcular métricas financieras y operativas reales sobre TODOS los pedidos válidos (excluyendo cancelados)
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

-- 7. TRIGGER: SINCRONIZACIÓN AUTOMÁTICA Y AUTORITATIVA DE MÉTRICAS DE CLIENTES
-- Garantiza consistencia transaccional y previene fraude de LTV desde el cliente
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
