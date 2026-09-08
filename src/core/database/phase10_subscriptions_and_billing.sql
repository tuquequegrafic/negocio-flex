-- ==============================================================================
-- NEGOCIO FLEX - FASE 10: PLATAFORMA DE SUSCRIPCIONES, PLANES, LÍMITES Y FACTURACIÓN SaaS
-- ARQUITECTURA: Clean Architecture, PostgreSQL, RLS, Zero Trust, Multi-Tenant
-- FECHA: 2026-09-04
-- ==============================================================================

-- 1. EXTENSIÓN Y VERIFICACIÓN DE LA TABLA: PLANS
-- ------------------------------------------------------------------------------
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'MONTHLY' CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
  ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS max_customers INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_orders_per_month INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS max_appointments_per_month INTEGER NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS limits JSONB NOT NULL DEFAULT '{"max_products": 30, "max_images": 10, "max_staff": 1, "max_customers": 100, "max_orders": 500, "max_appointments": 200}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_modules JSONB NOT NULL DEFAULT '{"products": true, "services": true, "categories": true, "orders": true, "whatsapp": true, "gallery": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. EXTENSIÓN Y VERIFICACIÓN DE LA TABLA: SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'MONTHLY' CHECK (billing_interval IN ('MONTHLY', 'ANNUAL')),
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'Culqi',
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;

-- Asegurar restricción de unicidad: Una organización solo puede tener UNA suscripción activa/vigente
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_single_active_org 
  ON public.subscriptions(organization_id)
  WHERE status IN ('trial', 'active', 'past_due');

-- 3. EXTENSIÓN Y VERIFICACIÓN DE LA TABLA: PAYMENT_TRANSACTIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'Culqi',
  ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_reference TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice único de idempotencia para prevenir cobros y transacciones duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key 
  ON public.payment_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 4. EXTENSIÓN Y VERIFICACIÓN DE LA TABLA: WEBHOOK_LOGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'Culqi',
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS signature_valid BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Índice único para protección contra eventos de webhook duplicados y replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_logs_provider_event_id 
  ON public.webhook_logs(provider, event_id)
  WHERE event_id IS NOT NULL;

-- ==============================================================================
-- 5. RPC & SERVER-SIDE FUNCTIONS (SECURITY DEFINER + SAFE SEARCH_PATH)
-- ==============================================================================

-- 5.1. Máquina de estados: Validar y ejecutar transiciones de suscripción
CREATE OR REPLACE FUNCTION public.validate_subscription_status_transition(
  p_current_status TEXT,
  p_new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si el estado es idéntico, es idempotente
  IF p_current_status = p_new_status THEN
    RETURN TRUE;
  END IF;

  -- Reglas de la máquina de estados de Negocio Flex
  CASE p_current_status
    WHEN 'trial' THEN
      RETURN p_new_status IN ('active', 'past_due', 'expired', 'cancelled');
    WHEN 'active' THEN
      RETURN p_new_status IN ('past_due', 'cancelled', 'expired');
    WHEN 'past_due' THEN
      RETURN p_new_status IN ('active', 'cancelled', 'expired');
    WHEN 'cancelled' THEN
      RETURN p_new_status IN ('expired');
    WHEN 'expired' THEN
      RETURN FALSE;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- 5.1.1. Trigger de máquina de estados para subscriptions
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

-- 5.1.2. Función y Triggers de Enforcement de Límites de Recursos en Base de Datos (Anti-Bypass REST/INSERT)
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

  -- Serialización concurrente mediante advisory lock por organización y tabla
  PERFORM pg_advisory_xact_lock(hashtext('org_limit_' || v_org_id::text || '_' || TG_TABLE_NAME));

  -- Obtener suscripción activa/trial
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

-- 5.2. RPC: Verificación estricta de límites de plan en el servidor
CREATE OR REPLACE FUNCTION public.check_organization_plan_limit(
  p_org_id UUID,
  p_limit_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
  v_current_count INTEGER := 0;
  v_max_allowed INTEGER := 0;
  v_allowed BOOLEAN := FALSE;
  v_is_member BOOLEAN;
BEGIN
  -- 1. Verificar autorización multi-tenant
  v_is_member := public.is_member_of_org(p_org_id) OR public.is_super_admin();
  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Acceso denegado: No eres miembro autorizado de esta organización.'
      USING ERRCODE = '42501';
  END IF;

  -- 1.1 Bloqueo de asesoría por concurrencia
  PERFORM pg_advisory_xact_lock(hashtext('org_limit_' || p_org_id::text || '_' || p_limit_type));

  -- 2. Obtener suscripción activa o trial de la organización
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE organization_id = p_org_id
    AND status IN ('trial', 'active', 'past_due')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si no existe suscripción activa, usar plan inicial por defecto
  IF v_sub.id IS NULL THEN
    SELECT * INTO v_plan FROM public.plans WHERE id = 'plan-inicial' LIMIT 1;
  ELSE
    SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id LIMIT 1;
  END IF;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan no configurado en el sistema.' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Evaluar el recurso solicitado
  CASE p_limit_type
    WHEN 'products' THEN
      SELECT COUNT(*) INTO v_current_count FROM public.products WHERE organization_id = p_org_id;
      v_max_allowed := COALESCE(v_plan.max_products, 30);
    WHEN 'images' THEN
      SELECT COUNT(*) INTO v_current_count FROM public.business_gallery WHERE organization_id = p_org_id;
      v_max_allowed := COALESCE(v_plan.max_images, 10);
    WHEN 'staff' THEN
      SELECT COUNT(*) INTO v_current_count FROM public.organization_members WHERE organization_id = p_org_id;
      v_max_allowed := COALESCE(v_plan.max_staff, 1);
    WHEN 'customers' THEN
      SELECT COUNT(*) INTO v_current_count FROM public.customers WHERE organization_id = p_org_id;
      v_max_allowed := COALESCE(v_plan.max_customers, 100);
    WHEN 'services' THEN
      SELECT COUNT(*) INTO v_current_count FROM public.services WHERE organization_id = p_org_id;
      v_max_allowed := COALESCE(v_plan.max_products, 30);
    ELSE
      RAISE EXCEPTION 'Tipo de límite no reconocido: %', p_limit_type;
  END CASE;

  -- Evaluar si permite el incremento
  v_allowed := (v_current_count + p_increment) <= v_max_allowed;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_current_count,
    'max_allowed', v_max_allowed,
    'limit_type', p_limit_type,
    'plan_id', v_plan.id,
    'plan_name', v_plan.name,
    'percent_used', ROUND((v_current_count::numeric / GREATEST(v_max_allowed, 1)::numeric) * 100, 1),
    'message', CASE 
      WHEN v_allowed THEN 'Recurso permitido dentro de los límites del plan.'
      ELSE format('Límite excedido: Tu plan %s permite un máximo de %s %s.', v_plan.name, v_max_allowed, p_limit_type)
    END
  );
END;
$$;

-- 5.3. RPC: Upgrade / Downgrade o Renovación con verificación de precio autoritativa
CREATE OR REPLACE FUNCTION public.process_subscription_upgrade_downgrade(
  p_org_id UUID,
  p_new_plan_id TEXT,
  p_billing_interval TEXT,
  p_idempotency_key TEXT,
  p_payment_gateway TEXT DEFAULT 'Culqi',
  p_payment_method TEXT DEFAULT 'CARD'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_owner_or_admin BOOLEAN;
  v_target_plan RECORD;
  v_current_sub RECORD;
  v_org RECORD;
  v_authorized_price NUMERIC(10, 2);
  v_new_end_date TIMESTAMPTZ;
  v_tx_id UUID;
  v_existing_tx RECORD;
BEGIN
  -- 1. Control de Idempotencia: si ya se procesó esta clave, retornar resultado idéntico
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_tx
    FROM public.payment_transactions
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_tx.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'idempotent_replay', TRUE,
        'transaction_id', v_existing_tx.id,
        'status', v_existing_tx.status,
        'amount', v_existing_tx.amount,
        'message', 'Transacción ya procesada previamente (idempotencia garantizada).'
      );
    END IF;
  END IF;

  -- 2. Verificar autorización RBAC: Solo Owner, Admin o SuperAdmin pueden cambiar de plan
  v_is_owner_or_admin := (public.get_user_org_role(p_org_id) IN ('owner', 'admin')) OR public.is_super_admin();
  IF NOT v_is_owner_or_admin THEN
    RAISE EXCEPTION 'Acceso denegado: Solo los propietarios o administradores pueden modificar el plan de la empresa.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Obtener organización
  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  IF v_org.id IS NULL THEN
    RAISE EXCEPTION 'Organización no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- 4. Obtener datos del plan objetivo desde el servidor (PREVENCIÓN DE MANIPULACIÓN CLIENT-SIDE)
  SELECT * INTO v_target_plan FROM public.plans WHERE id = p_new_plan_id AND is_active = TRUE;
  IF v_target_plan.id IS NULL THEN
    RAISE EXCEPTION 'El plan seleccionado no existe o no se encuentra activo.' USING ERRCODE = 'P0002';
  END IF;

  -- Determinar precio fidedigno desde la base de datos
  IF p_billing_interval = 'ANNUAL' THEN
    v_authorized_price := v_target_plan.price_annual;
    v_new_end_date := NOW() + INTERVAL '1 year';
  ELSE
    v_authorized_price := v_target_plan.price_monthly;
    v_new_end_date := NOW() + INTERVAL '30 days';
  END IF;

  -- 5. Bloqueo pesimista de fila en subscriptions para serializar concurrencia
  SELECT * INTO v_current_sub
  FROM public.subscriptions
  WHERE organization_id = p_org_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- 6. Registrar transacción financiera en estado PENDING (NUNCA APPROVED sin confirmación de pasarela)
  INSERT INTO public.payment_transactions (
    organization_id,
    organization_name,
    plan_id,
    plan_name,
    amount,
    currency,
    payment_gateway,
    payment_method_type,
    transaction_id,
    idempotency_key,
    status,
    customer_name,
    customer_email,
    webhook_verified,
    created_at
  ) VALUES (
    p_org_id,
    v_org.name,
    v_target_plan.id,
    v_target_plan.name,
    v_authorized_price,
    'S/',
    p_payment_gateway,
    p_payment_method,
    'TXN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    p_idempotency_key,
    'PENDING',              -- ESTADO PENDIENTE DE PAGO
    COALESCE(auth.jwt()->>'name', 'Admin Negocio'),
    COALESCE(auth.jwt()->>'email', 'billing@negocio.pe'),
    FALSE,                  -- NO VERIFICADO POR WEBHOOK AÚN
    NOW()
  )
  RETURNING id INTO v_tx_id;

  -- NOTA DE SEGURIDAD: NO se actualiza el estado de la suscripción a 'active' aquí.
  -- La activación oficial ocurrirá EXCLUSIVAMENTE cuando el Webhook verificado
  -- del proveedor de pagos confirme el cobro real en process_payment_webhook.

  RETURN jsonb_build_object(
    'success', TRUE,
    'plan_id', v_target_plan.id,
    'plan_name', v_target_plan.name,
    'amount_billed', v_authorized_price,
    'billing_interval', p_billing_interval,
    'transaction_id', v_tx_id,
    'status', 'PENDING',
    'message', format('Solicitud de cambio a plan %s registrada. Pendiente de pago por el proveedor.', v_target_plan.name)
  );
END;
$$;

-- 5.4. RPC: Cancelación segura de suscripción
CREATE OR REPLACE FUNCTION public.cancel_organization_subscription(
  p_org_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_sub RECORD;
BEGIN
  v_is_authorized := (public.get_user_org_role(p_org_id) IN ('owner', 'admin')) OR public.is_super_admin();
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acceso denegado: No tienes permisos para cancelar la suscripción de este negocio.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE organization_id = p_org_id
    AND status IN ('active', 'trial', 'past_due')
  LIMIT 1
  FOR UPDATE;

  IF v_sub.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró una suscripción activa para cancelar.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.subscriptions
  SET
    status = 'cancelled',
    auto_renew = FALSE,
    canceled_at = NOW(),
    updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'subscription_id', v_sub.id,
    'status', 'cancelled',
    'access_until', v_sub.end_date,
    'message', 'La suscripción ha sido cancelada. Mantendrás acceso hasta el final del periodo facturado.'
  );
END;
$$;

-- 5.5. RPC: Inicio seguro de período de prueba (Trial) con aislamiento Multi-Tenant y Security Definer
CREATE OR REPLACE FUNCTION public.start_organization_trial(
  p_org_id UUID,
  p_plan_id TEXT DEFAULT 'plan-inicial',
  p_trial_days INTEGER DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_target_plan RECORD;
  v_existing_sub RECORD;
  v_sub_id UUID;
  v_trial_end TIMESTAMPTZ;
  v_days INTEGER := COALESCE(p_trial_days, 14);
BEGIN
  -- 1. Autorización: Solo owner, admin de la org o super_admin
  v_is_authorized := (public.get_user_org_role(p_org_id) IN ('owner', 'admin')) OR public.is_super_admin();
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acceso denegado: No tienes permisos para iniciar suscripción en esta organización.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Verificar existencia y validez de la organización
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organización no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verificar si ya existe suscripción activa o en trial
  SELECT * INTO v_existing_sub
  FROM public.subscriptions
  WHERE organization_id = p_org_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_sub.id IS NOT NULL AND v_existing_sub.status IN ('trial', 'active', 'past_due') THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'subscription_id', v_existing_sub.id,
      'status', v_existing_sub.status,
      'message', 'La organización ya cuenta con una suscripción vigente.'
    );
  END IF;

  -- 4. Obtener plan de la base de datos
  SELECT * INTO v_target_plan FROM public.plans WHERE id = p_plan_id;
  IF v_target_plan.id IS NULL THEN
    SELECT * INTO v_target_plan FROM public.plans WHERE id = 'plan-inicial' LIMIT 1;
  END IF;

  IF v_target_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan no configurado en el sistema.' USING ERRCODE = 'P0002';
  END IF;

  v_trial_end := NOW() + (v_days || ' days')::interval;

  -- 5. Crear o actualizar registro de suscripción
  IF v_existing_sub.id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET
      plan_id = v_target_plan.id,
      plan_name = v_target_plan.name,
      status = 'trial',
      billing_period = 'MONTHLY',
      billing_interval = 'MONTHLY',
      start_date = NOW(),
      end_date = v_trial_end,
      trial_start = NOW(),
      trial_end = v_trial_end,
      trial_end_date = v_trial_end,
      current_period_start = NOW(),
      current_period_end = v_trial_end,
      auto_renew = TRUE,
      amount_paid = 0.00,
      provider = 'Culqi',
      limits = v_target_plan.limits,
      active_modules = v_target_plan.active_modules,
      canceled_at = NULL,
      updated_at = NOW()
    WHERE id = v_existing_sub.id
    RETURNING id INTO v_sub_id;
  ELSE
    INSERT INTO public.subscriptions (
      organization_id,
      plan_id,
      plan_name,
      status,
      billing_period,
      billing_interval,
      start_date,
      end_date,
      trial_start,
      trial_end,
      trial_end_date,
      current_period_start,
      current_period_end,
      auto_renew,
      amount_paid,
      provider,
      limits,
      active_modules
    ) VALUES (
      p_org_id,
      v_target_plan.id,
      v_target_plan.name,
      'trial',
      'MONTHLY',
      'MONTHLY',
      NOW(),
      v_trial_end,
      NOW(),
      v_trial_end,
      v_trial_end,
      NOW(),
      v_trial_end,
      TRUE,
      0.00,
      'Culqi',
      v_target_plan.limits,
      v_target_plan.active_modules
    )
    RETURNING id INTO v_sub_id;
  END IF;

  -- 6. Sincronizar módulos de organización
  UPDATE public.organization_settings
  SET
    modules = v_target_plan.active_modules,
    updated_at = NOW()
  WHERE organization_id = p_org_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'subscription_id', v_sub_id,
    'status', 'trial',
    'trial_end', v_trial_end,
    'message', 'Periodo de prueba iniciado exitosamente.'
  );
END;
$$;

-- 5.6. RPC: Procesamiento seguro de Webhooks de Pasarelas (Idempotencia, Anti-Replay y Verificación Autoritativa)
DROP FUNCTION IF EXISTS public.process_payment_webhook(TEXT, TEXT, TEXT, JSONB, BOOLEAN);

CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_log RECORD;
  v_target_org_id UUID;
  v_target_plan_id TEXT;
  v_billing_interval TEXT := 'MONTHLY';
  v_amount NUMERIC(10, 2);
  v_db_plan RECORD;
  v_expected_price NUMERIC(10, 2);
  v_end_interval INTERVAL := INTERVAL '30 days';
  v_tx_id UUID;
  v_org RECORD;
  v_sub RECORD;
  v_event_timestamp TIMESTAMPTZ;
BEGIN
  -- 1. Control de Idempotencia y Reintentos (FAILED -> RETRY -> PROCESSED)
  SELECT * INTO v_existing_log
  FROM public.webhook_logs
  WHERE provider = p_provider AND event_id = p_event_id;

  IF v_existing_log.id IS NOT NULL THEN
    IF v_existing_log.status = 'PROCESSED' THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'duplicate_ignored', TRUE,
        'event_id', p_event_id,
        'message', 'Evento ya procesado previamente (idempotencia garantizada).'
      );
    ELSE
      -- Permitir reintento si falló previamente
      UPDATE public.webhook_logs
      SET status = 'PROCESSING', processing_error = NULL, received_at = NOW()
      WHERE id = v_existing_log.id;
    END IF;
  ELSE
    INSERT INTO public.webhook_logs (
      gateway,
      event_type,
      payload,
      status,
      provider,
      event_id,
      signature_valid,
      processed,
      received_at
    ) VALUES (
      p_provider,
      p_event_type,
      p_payload,
      'PROCESSING',
      p_provider,
      p_event_id,
      TRUE,
      FALSE,
      NOW()
    );
  END IF;

  -- 2. Procesamiento transaccional
  BEGIN
    IF p_event_type = 'payment.succeeded' OR p_event_type = 'charge.successful' THEN
      v_target_org_id := (p_payload->'metadata'->>'organization_id')::uuid;
      v_target_plan_id := p_payload->'metadata'->>'plan_id';
      v_billing_interval := COALESCE(p_payload->'metadata'->>'billing_interval', 'MONTHLY');
      v_amount := COALESCE((p_payload->>'amount')::numeric, 0.00);

      -- Validar existencia de la organización
      SELECT * INTO v_org FROM public.organizations WHERE id = v_target_org_id AND is_active = TRUE;
      IF v_org.id IS NULL THEN
        RAISE EXCEPTION 'Organización % no encontrada o inactiva.', v_target_org_id;
      END IF;

      -- Validar plan en base de datos
      SELECT * INTO v_db_plan FROM public.plans WHERE id = v_target_plan_id AND is_active = TRUE;
      IF v_db_plan.id IS NULL THEN
        RAISE EXCEPTION 'Plan % no encontrado o inactivo.', v_target_plan_id;
      END IF;

      IF v_billing_interval = 'ANNUAL' THEN
        v_expected_price := v_db_plan.price_annual;
        v_end_interval := INTERVAL '1 year';
      ELSE
        v_expected_price := v_db_plan.price_monthly;
        v_end_interval := INTERVAL '30 days';
      END IF;

      -- Normalizar céntimos
      IF v_amount >= 100 AND v_amount = (v_expected_price * 100) THEN
        v_amount := v_amount / 100.00;
      END IF;

      -- Validar que el monto cobrado coincide con el precio oficial
      IF v_amount <> v_expected_price THEN
        RAISE EXCEPTION 'Monto cobrado (%) inconsistente con el precio oficial del plan (%)', v_amount, v_expected_price;
      END IF;

      -- Bloqueo pesimista de fila en subscriptions para serializar con cancel o upgrade simultáneos
      SELECT * INTO v_sub
      FROM public.subscriptions
      WHERE organization_id = v_target_org_id
      FOR UPDATE;

      -- Activar o actualizar suscripción
      IF v_sub.id IS NOT NULL THEN
        UPDATE public.subscriptions
        SET
          plan_id = v_db_plan.id,
          plan_name = v_db_plan.name,
          status = 'active',
          billing_interval = v_billing_interval,
          billing_period = v_billing_interval,
          current_period_start = NOW(),
          current_period_end = NOW() + v_end_interval,
          end_date = NOW() + v_end_interval,
          amount_paid = v_expected_price,
          limits = v_db_plan.limits,
          active_modules = v_db_plan.active_modules,
          canceled_at = NULL,
          last_reconciled_at = NOW(),
          updated_at = NOW()
        WHERE id = v_sub.id;
      ELSE
        INSERT INTO public.subscriptions (
          organization_id, plan_id, plan_name, status, billing_interval,
          billing_period, current_period_start, current_period_end, end_date,
          amount_paid, limits, active_modules, last_reconciled_at, created_at, updated_at
        ) VALUES (
          v_target_org_id, v_db_plan.id, v_db_plan.name, 'active', v_billing_interval,
          v_billing_interval, NOW(), NOW() + v_end_interval, NOW() + v_end_interval,
          v_expected_price, v_db_plan.limits, v_db_plan.active_modules, NOW(), NOW(), NOW()
        );
      END IF;

      -- Sincronizar módulos en organization_settings
      UPDATE public.organization_settings
      SET modules = v_db_plan.active_modules, updated_at = NOW()
      WHERE organization_id = v_target_org_id;

      -- Actualizar transacciones pendientes a APPROVED
      UPDATE public.payment_transactions
      SET status = 'APPROVED', webhook_verified = TRUE, updated_at = NOW()
      WHERE organization_id = v_target_org_id AND status = 'PENDING';

      -- Registrar transacción confirmada por el webhook
      INSERT INTO public.payment_transactions (
        organization_id,
        organization_name,
        plan_id,
        plan_name,
        amount,
        currency,
        payment_gateway,
        payment_method_type,
        transaction_id,
        idempotency_key,
        status,
        customer_name,
        customer_email,
        webhook_verified,
        created_at
      ) VALUES (
        v_target_org_id,
        v_org.name,
        v_db_plan.id,
        v_db_plan.name,
        v_expected_price,
        COALESCE(p_payload->>'currency', 'S/'),
        p_provider,
        COALESCE(p_payload->>'payment_method', 'CARD'),
        COALESCE(p_payload->>'id', 'TXN-' || p_event_id),
        'WH-' || p_event_id,
        'APPROVED',
        COALESCE(p_payload->'customer'->>'name', 'Cliente SaaS'),
        COALESCE(p_payload->'customer'->>'email', 'cliente@negocio.pe'),
        TRUE,
        NOW()
      );

    ELSIF p_event_type = 'payment.failed' OR p_event_type = 'charge.failed' THEN
      v_target_org_id := (p_payload->'metadata'->>'organization_id')::uuid;
      
      IF v_target_org_id IS NOT NULL THEN
        -- Extraer timestamp del evento (Out-of-Order protection)
        v_event_timestamp := COALESCE(
          (p_payload->>'created_at')::timestamptz,
          to_timestamp(COALESCE((p_payload->>'created')::numeric, EXTRACT(EPOCH FROM NOW()))),
          NOW()
        );

        SELECT * INTO v_sub
        FROM public.subscriptions
        WHERE organization_id = v_target_org_id
        FOR UPDATE;

        -- Si la suscripción fue renovada o pagada después de la fecha de este fallo, IGNORAR el fallo tardío
        IF v_sub.id IS NOT NULL AND v_sub.status = 'active' AND v_sub.last_reconciled_at > v_event_timestamp THEN
          UPDATE public.webhook_logs
          SET status = 'PROCESSED', processed = TRUE, processing_error = 'Out-of-order event ignorado (existe reconciliación posterior)'
          WHERE provider = p_provider AND event_id = p_event_id;

          RETURN jsonb_build_object(
            'success', TRUE,
            'out_of_order_ignored', TRUE,
            'message', 'Fallo de pago desestimado: la suscripción cuenta con una renovación posterior exitosa.'
          );
        ELSE
          UPDATE public.subscriptions
          SET status = 'past_due', updated_at = NOW()
          WHERE id = v_sub.id;
        END IF;
      END IF;
    END IF;

    -- Marcar webhook como exitoso
    UPDATE public.webhook_logs
    SET status = 'PROCESSED', processed = TRUE, processed_at = NOW()
    WHERE provider = p_provider AND event_id = p_event_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'event_id', p_event_id,
      'status', 'PROCESSED'
    );
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.webhook_logs
    SET
      status = 'FAILED',
      processed = FALSE,
      processing_error = SQLERRM,
      processed_at = NOW()
    WHERE provider = p_provider AND event_id = p_event_id;

    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'event_id', p_event_id
    );
  END;
END;
$$;

-- Revocar acceso directo público a process_payment_webhook y conceder a service_role
REVOKE EXECUTE ON FUNCTION public.process_payment_webhook(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ==============================================================================
-- 6. POLÍTICAS ROW LEVEL SECURITY (RLS) - AISLAMIENTO ZERO TRUST
-- ==============================================================================

-- 6.1. PLANS RLS: Todos pueden ver planes activos; solo SuperAdmin puede administrarlos
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans public read policy" ON public.plans;
CREATE POLICY "Plans public read policy"
  ON public.plans FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

DROP POLICY IF EXISTS "Plans superadmin manage policy" ON public.plans;
CREATE POLICY "Plans superadmin manage policy"
  ON public.plans FOR ALL
  USING (public.is_super_admin());

-- 6.2. SUBSCRIPTIONS RLS: Miembros solo pueden leer su propia suscripción. Ningún cliente puede escribir directamente.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscriptions select policy" ON public.subscriptions;
CREATE POLICY "Subscriptions select policy"
  ON public.subscriptions FOR SELECT
  USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "Subscriptions block direct insert" ON public.subscriptions;
CREATE POLICY "Subscriptions block direct insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Subscriptions block direct update" ON public.subscriptions;
CREATE POLICY "Subscriptions block direct update"
  ON public.subscriptions FOR UPDATE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Subscriptions block direct delete" ON public.subscriptions;
CREATE POLICY "Subscriptions block direct delete"
  ON public.subscriptions FOR DELETE
  USING (public.is_super_admin());

-- 6.3. PAYMENT_TRANSACTIONS RLS: Miembros solo pueden consultar transacciones de su organización
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments select policy" ON public.payment_transactions;
CREATE POLICY "Payments select policy"
  ON public.payment_transactions FOR SELECT
  USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "Payments block direct client write" ON public.payment_transactions;
CREATE POLICY "Payments block direct client write"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Payments block direct client update" ON public.payment_transactions;
CREATE POLICY "Payments block direct client update"
  ON public.payment_transactions FOR UPDATE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Payments block direct client delete" ON public.payment_transactions;
CREATE POLICY "Payments block direct client delete"
  ON public.payment_transactions FOR DELETE
  USING (public.is_super_admin());

-- 6.4. WEBHOOK_LOGS RLS: Estrictamente confidencial para Super Administradores
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Webhook logs superadmin only" ON public.webhook_logs;
CREATE POLICY "Webhook logs superadmin only"
  ON public.webhook_logs FOR ALL
  USING (public.is_super_admin());

-- Comentario de certificación de Fase 10
COMMENT ON TABLE public.subscriptions IS 'Negocio Flex - Suscripciones SaaS Multi-Tenant (Fase 10 - Nivel Producción)';
COMMENT ON TABLE public.plans IS 'Negocio Flex - Catálogo Canónico de Planes SaaS y Límites de Recursos (Fase 10)';
COMMENT ON TABLE public.payment_transactions IS 'Negocio Flex - Libro Mayor y Auditoría de Pagos SaaS con Idempotencia (Fase 10)';
COMMENT ON TABLE public.webhook_logs IS 'Negocio Flex - Registro Anti-Replay e Idempotente de Webhooks de Pasarelas (Fase 10)';
