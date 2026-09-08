-- ==============================================================================
-- NEGOCIO FLEX — FASE 13: PUNTO DE VENTA (POS) + CAJAS + PAGOS + COMPROBANTES
-- Transacciones Atómicas, Control de Concurrencia, Arqueo de Caja e Idempotencia
-- ==============================================================================

-- 1. TABLA: CASH_REGISTERS (Cajas Registradoras / Terminales Multi-Terminal)
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cash_registers_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_org ON public.cash_registers (organization_id);

-- 2. TABLA: CASH_SHIFTS (Turnos y Arqueos de Caja)
CREATE TABLE IF NOT EXISTS public.cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE RESTRICT,
  opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  initial_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (initial_cash >= 0),
  sales_cash_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (sales_cash_total >= 0),
  sales_digital_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (sales_digital_total >= 0),
  cash_in_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cash_in_total >= 0),
  cash_out_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cash_out_total >= 0),
  expected_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  actual_cash NUMERIC(10, 2) CHECK (actual_cash IS NULL OR actual_cash >= 0),
  difference NUMERIC(10, 2), -- actual_cash - expected_cash (positivo: sobrante, negativo: faltante)
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_by_name TEXT,
  notes TEXT
);

-- RESTRICCIÓN DE CONCURRENCIA: Únicamente 1 turno ABIERTO por terminal / caja registradora
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_open_cash_shift 
  ON public.cash_shifts (organization_id, cash_register_id) 
  WHERE status = 'OPEN';

CREATE INDEX IF NOT EXISTS idx_cash_shifts_org_status ON public.cash_shifts (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_org_opened ON public.cash_shifts (organization_id, opened_at DESC);

-- 3. TABLA: CASH_MOVEMENTS (Libro Mayor de Flujo de Efectivo en Caja)
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.cash_shifts(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'CASH_IN',       -- Ingreso manual de dinero (aporte, sencillo adicional)
    'CASH_OUT',      -- Egreso manual de dinero (pago a proveedor menor, retiro)
    'SALE_CASH',     -- Entrada automática por venta POS en efectivo
    'SALE_DIGITAL',  -- Registro informativo por venta POS digital (no altera efectivo físico)
    'REFUND_CASH'    -- Salida por devolución de venta en efectivo
  )),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  reference_id TEXT, -- ID de orden o comprobante
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER', 'OTHER')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON public.cash_movements (shift_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_org ON public.cash_movements (organization_id, created_at DESC);

-- Inmutabilidad de los movimientos de caja
CREATE OR REPLACE FUNCTION public.prevent_cash_movements_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'El Libro Mayor de Caja es inmutable. No se permite UPDATE ni DELETE sobre cash_movements.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_cash_movements_mutation ON public.cash_movements;
CREATE TRIGGER trg_prevent_cash_movements_mutation
  BEFORE UPDATE OR DELETE ON public.cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cash_movements_mutation();

-- 4. TABLA: SALES_RECEIPT_SERIES (Control Transaccional de Series y Correlativos)
CREATE TABLE IF NOT EXISTS public.sales_receipt_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('TICKET', 'BOLETA', 'FACTURA')),
  series TEXT NOT NULL, -- Ej: 'T001', 'B001', 'F001'
  current_number INTEGER NOT NULL DEFAULT 0 CHECK (current_number >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_receipt_series UNIQUE (organization_id, document_type, series)
);

CREATE INDEX IF NOT EXISTS idx_receipt_series_org ON public.sales_receipt_series (organization_id, document_type);

-- 5. TABLA: SALES_RECEIPTS (Comprobantes Emitidos en Mostrador / POS)
CREATE TABLE IF NOT EXISTS public.sales_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  cash_shift_id UUID REFERENCES public.cash_shifts(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('TICKET', 'BOLETA', 'FACTURA')),
  series TEXT NOT NULL,
  number INTEGER NOT NULL,
  full_number TEXT NOT NULL, -- 'T001-000001'
  customer_name TEXT NOT NULL,
  customer_document TEXT, -- DNI, RUC, etc.
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL,
  cash_received NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cash_received >= 0),
  cash_change NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cash_change >= 0),
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'ANNULLLED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sales_receipts_full_number UNIQUE (organization_id, document_type, series, number),
  CONSTRAINT uq_sales_receipts_order UNIQUE (organization_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_receipts_org ON public.sales_receipts (organization_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_receipts_order ON public.sales_receipts (order_id);

-- 6. TABLA: POS_IDEMPOTENCY (Garantía de Cero Duplicidad ante Retries y Doble Clic)
CREATE TABLE IF NOT EXISTS public.pos_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES public.sales_receipts(id) ON DELETE CASCADE,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pos_idempotency_key UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_pos_idempotency_key ON public.pos_idempotency (organization_id, idempotency_key);

-- ==============================================================================
-- 7. FUNCIONES ATÓMICAS POSTGRESQL (RPC) DE ALTA CONCURRENCIA
-- ==============================================================================

-- A) RPC: APERTURA DE TURNO DE CAJA
CREATE OR REPLACE FUNCTION public.open_cash_shift(
  p_organization_id UUID,
  p_cash_register_id UUID,
  p_user_id UUID,
  p_initial_cash NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_shift_id UUID;
  v_register_exists BOOLEAN;
  v_already_open BOOLEAN;
  v_initial NUMERIC := COALESCE(p_initial_cash, 0.00);
BEGIN
  -- 1. Validar RBAC (CRIT-01: Casing normalizado y super_admin incluido)
  v_user_role := public.get_user_org_role(p_organization_id);
  IF v_user_role IS NULL OR LOWER(v_user_role) NOT IN ('owner', 'admin', 'staff', 'super_admin') THEN
    RAISE EXCEPTION 'No autorizado para abrir turno de caja en esta organización.';
  END IF;

  -- 2. Bloqueo transaccional FOR UPDATE sobre la caja registradora (LOW-01: Exclusión mutua estricta)
  PERFORM 1 
  FROM public.cash_registers 
  WHERE id = p_cash_register_id AND organization_id = p_organization_id AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La caja registradora especificada no existe o se encuentra inactiva.';
  END IF;

  -- 3. Bloqueo determinista y validación de turno previo abierto bajo exclusión mutua
  SELECT EXISTS (
    SELECT 1 FROM public.cash_shifts
    WHERE organization_id = p_organization_id 
      AND cash_register_id = p_cash_register_id 
      AND status = 'OPEN'
  ) INTO v_already_open;

  IF v_already_open THEN
    RAISE EXCEPTION 'Ya existe un turno de caja abierto para esta caja registradora.';
  END IF;

  IF v_initial < 0 THEN
    RAISE EXCEPTION 'El monto inicial en caja no puede ser negativo.';
  END IF;

  -- Obtener nombre del usuario que abre la caja
  SELECT COALESCE(full_name, email, 'Cajero') INTO v_user_name 
  FROM public.profiles WHERE id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Cajero';
  END IF;

  -- 4. Insertar nuevo turno
  v_shift_id := gen_random_uuid();
  INSERT INTO public.cash_shifts (
    id,
    organization_id,
    cash_register_id,
    opened_by,
    opened_by_name,
    status,
    initial_cash,
    sales_cash_total,
    sales_digital_total,
    cash_in_total,
    cash_out_total,
    expected_cash,
    opened_at,
    notes
  ) VALUES (
    v_shift_id,
    p_organization_id,
    p_cash_register_id,
    p_user_id,
    v_user_name,
    'OPEN',
    v_initial,
    0.00,
    0.00,
    0.00,
    0.00,
    v_initial,
    NOW(),
    p_notes
  );

  -- Registrar movimiento de apertura si hay monto inicial
  IF v_initial > 0 THEN
    INSERT INTO public.cash_movements (
      organization_id,
      shift_id,
      movement_type,
      amount,
      reason,
      payment_method,
      created_by,
      created_by_name
    ) VALUES (
      p_organization_id,
      v_shift_id,
      'CASH_IN',
      v_initial,
      'Fondo inicial de apertura de caja',
      'CASH',
      p_user_id,
      v_user_name
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'shift_id', v_shift_id,
    'status', 'OPEN',
    'initial_cash', v_initial,
    'expected_cash', v_initial,
    'opened_at', NOW()
  );
END;
$$;

-- B) RPC: CIERRE Y ARQUEO DE TURNO DE CAJA
CREATE OR REPLACE FUNCTION public.close_cash_shift(
  p_organization_id UUID,
  p_shift_id UUID,
  p_user_id UUID,
  p_actual_cash NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_shift RECORD;
  v_difference NUMERIC;
  v_actual NUMERIC := COALESCE(p_actual_cash, 0.00);
BEGIN
  -- 1. Validar RBAC (CRIT-01: Casing normalizado y super_admin incluido)
  v_user_role := public.get_user_org_role(p_organization_id);
  IF v_user_role IS NULL OR LOWER(v_user_role) NOT IN ('owner', 'admin', 'staff', 'super_admin') THEN
    RAISE EXCEPTION 'No autorizado para cerrar turno de caja.';
  END IF;

  IF v_actual < 0 THEN
    RAISE EXCEPTION 'El monto real contado no puede ser negativo.';
  END IF;

  -- 2. Bloqueo transaccional de la fila del turno con FOR UPDATE
  SELECT * INTO v_shift
  FROM public.cash_shifts
  WHERE id = p_shift_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno de caja no encontrado en esta organización.';
  END IF;

  IF v_shift.status <> 'OPEN' THEN
    RAISE EXCEPTION 'El turno de caja ya se encuentra cerrado.';
  END IF;

  -- Obtener nombre del cajero que cierra
  SELECT COALESCE(full_name, email, 'Cajero') INTO v_user_name 
  FROM public.profiles WHERE id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Cajero';
  END IF;

  -- 3. Calcular diferencia (positivo: sobrante, negativo: faltante)
  v_difference := v_actual - v_shift.expected_cash;

  -- 4. Actualizar estado y archivar
  UPDATE public.cash_shifts
  SET status = 'CLOSED',
      actual_cash = v_actual,
      difference = v_difference,
      closed_at = NOW(),
      closed_by = p_user_id,
      closed_by_name = v_user_name,
      notes = COALESCE(p_notes, notes)
  WHERE id = v_shift.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'shift_id', v_shift.id,
    'status', 'CLOSED',
    'initial_cash', v_shift.initial_cash,
    'sales_cash_total', v_shift.sales_cash_total,
    'sales_digital_total', v_shift.sales_digital_total,
    'cash_in_total', v_shift.cash_in_total,
    'cash_out_total', v_shift.cash_out_total,
    'expected_cash', v_shift.expected_cash,
    'actual_cash', v_actual,
    'difference', v_difference,
    'closed_at', NOW()
  );
END;
$$;

-- C) RPC: REGISTRO DE MOVIMIENTOS MANUALES DE CAJA (CASH_IN / CASH_OUT)
CREATE OR REPLACE FUNCTION public.record_cash_movement(
  p_organization_id UUID,
  p_shift_id UUID,
  p_user_id UUID,
  p_movement_type TEXT,
  p_amount NUMERIC,
  p_reason TEXT,
  p_payment_method TEXT DEFAULT 'CASH'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_shift RECORD;
  v_movement_id UUID;
  v_new_expected NUMERIC;
BEGIN
  -- 1. Validar RBAC (CRIT-01: Casing normalizado y super_admin incluido)
  v_user_role := public.get_user_org_role(p_organization_id);
  IF v_user_role IS NULL OR LOWER(v_user_role) NOT IN ('owner', 'admin', 'staff', 'super_admin') THEN
    RAISE EXCEPTION 'No autorizado para registrar movimientos de caja.';
  END IF;

  IF p_movement_type NOT IN ('CASH_IN', 'CASH_OUT') THEN
    RAISE EXCEPTION 'Tipo de movimiento inválido. Debe ser CASH_IN o CASH_OUT.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto del movimiento debe ser estrictamente positivo.';
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'El motivo del movimiento es obligatorio.';
  END IF;

  -- 2. Bloquear turno con FOR UPDATE
  SELECT * INTO v_shift
  FROM public.cash_shifts
  WHERE id = p_shift_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno de caja no encontrado.';
  END IF;

  IF v_shift.status <> 'OPEN' THEN
    RAISE EXCEPTION 'No se pueden registrar movimientos en un turno cerrado.';
  END IF;

  -- 3. Validar fondos disponibles si es salida de efectivo
  IF p_movement_type = 'CASH_OUT' AND p_amount > v_shift.expected_cash THEN
    RAISE EXCEPTION 'Fondos insuficientes en caja. (Disponible: %, Solicitado: %)', 
      v_shift.expected_cash, p_amount;
  END IF;

  -- Obtener nombre del usuario
  SELECT COALESCE(full_name, email, 'Cajero') INTO v_user_name 
  FROM public.profiles WHERE id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Cajero';
  END IF;

  -- 4. Registrar en libro mayor inmutable
  v_movement_id := gen_random_uuid();
  INSERT INTO public.cash_movements (
    id,
    organization_id,
    shift_id,
    movement_type,
    amount,
    reason,
    payment_method,
    created_by,
    created_by_name
  ) VALUES (
    v_movement_id,
    p_organization_id,
    p_shift_id,
    p_movement_type,
    p_amount,
    p_reason,
    COALESCE(p_payment_method, 'CASH'),
    p_user_id,
    v_user_name
  );

  -- 5. Actualizar totales del turno
  IF p_movement_type = 'CASH_IN' THEN
    v_new_expected := v_shift.expected_cash + p_amount;
    UPDATE public.cash_shifts
    SET cash_in_total = cash_in_total + p_amount,
        expected_cash = v_new_expected
    WHERE id = v_shift.id;
  ELSE
    v_new_expected := v_shift.expected_cash - p_amount;
    UPDATE public.cash_shifts
    SET cash_out_total = cash_out_total + p_amount,
        expected_cash = v_new_expected
    WHERE id = v_shift.id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'movement_id', v_movement_id,
    'shift_id', v_shift.id,
    'movement_type', p_movement_type,
    'amount', p_amount,
    'expected_cash', v_new_expected
  );
END;
$$;

-- D) RPC PRINCIPAL: PROCESO ATÓMICO DE VENTA EN PUNTO DE VENTA (POS)
CREATE OR REPLACE FUNCTION public.process_pos_sale(
  p_organization_id UUID,
  p_cash_register_id UUID,
  p_shift_id UUID,
  p_user_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_document TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_payment_method TEXT DEFAULT 'CASH',
  p_cash_received NUMERIC DEFAULT 0.00,
  p_discount NUMERIC DEFAULT 0.00,
  p_tax_rate NUMERIC DEFAULT 0.00,
  p_document_type TEXT DEFAULT 'TICKET',
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_shift RECORD;
  v_plan_check JSONB;
  v_existing_idempotency JSONB;
  
  v_customer_id UUID := p_customer_id;
  v_customer_name TEXT := COALESCE(TRIM(p_customer_name), 'Público General');
  v_customer_phone TEXT := COALESCE(TRIM(p_customer_phone), '000000000');
  
  v_item JSONB;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_discount NUMERIC(10, 2) := GREATEST(0.00, COALESCE(p_discount, 0.00));
  v_tax_rate NUMERIC(5, 4) := GREATEST(0.00, COALESCE(p_tax_rate, 0.00));
  v_taxable_base NUMERIC(10, 2);
  v_tax_amount NUMERIC(10, 2);
  v_total NUMERIC(10, 2);
  
  v_cash_received NUMERIC(10, 2) := GREATEST(0.00, COALESCE(p_cash_received, 0.00));
  v_cash_change NUMERIC(10, 2) := 0.00;
  v_cash_paid NUMERIC(10, 2) := 0.00;
  v_digital_paid NUMERIC(10, 2) := 0.00;
  
  v_order_id UUID;
  v_order_number TEXT;
  v_order_count INTEGER;
  
  v_series_rec RECORD;
  v_receipt_number INTEGER;
  v_full_number TEXT;
  v_receipt_id UUID;
  
  v_deduct_res JSONB;
  v_response JSONB;
BEGIN
  -- 1. VERIFICAR IDEMPOTENCIA (Cero Duplicidad)
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) <> '' THEN
    SELECT response_payload INTO v_existing_idempotency
    FROM public.pos_idempotency
    WHERE organization_id = p_organization_id AND idempotency_key = TRIM(p_idempotency_key);
    
    IF v_existing_idempotency IS NOT NULL THEN
      RETURN v_existing_idempotency;
    END IF;
  END IF;

  -- 2. VALIDAR RBAC (CRIT-01: Casing normalizado y super_admin incluido)
  v_user_role := public.get_user_org_role(p_organization_id);
  IF v_user_role IS NULL OR LOWER(v_user_role) NOT IN ('owner', 'admin', 'staff', 'super_admin') THEN
    RAISE EXCEPTION 'No autorizado para procesar ventas POS en esta organización.';
  END IF;

  -- 3. VALIDAR LÍMITES SAAS EN SERVER-SIDE (Protección contra bypass de plan)
  BEGIN
    v_plan_check := public.check_organization_plan_limit(p_organization_id, 'orders');
    IF v_plan_check IS NOT NULL AND (v_plan_check->>'allowed')::BOOLEAN = FALSE THEN
      RAISE EXCEPTION 'Límite de pedidos de su plan SaaS alcanzado. Actualice su suscripción para continuar facturando.';
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      -- Si la función no existe en modo básico, continuar
      NULL;
  END;

  -- 4. VALIDAR Y BLOQUEAR TURNO DE CAJA (FOR UPDATE evita ventas sobre caja cerrada)
  SELECT * INTO v_shift
  FROM public.cash_shifts
  WHERE id = p_shift_id 
    AND organization_id = p_organization_id 
    AND cash_register_id = p_cash_register_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno de caja no encontrado para la caja registradora indicada.';
  END IF;

  IF v_shift.status <> 'OPEN' THEN
    RAISE EXCEPTION 'No se puede procesar la venta: La caja registradora se encuentra CERRADA.';
  END IF;

  -- 5. VALIDAR ARTÍCULOS Y CALCULAR SUBTOTAL
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta POS debe contener al menos un artículo.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'quantity')::INTEGER <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a cero.';
    END IF;
    IF (v_item->>'unit_price')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'El precio unitario no puede ser negativo.';
    END IF;
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::NUMERIC);
  END LOOP;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'El total de la venta debe ser mayor a cero.';
  END IF;

  -- Cálculo fiscal
  v_taxable_base := GREATEST(0.00, v_subtotal - v_discount);
  v_tax_amount := ROUND(v_taxable_base * v_tax_rate, 2);
  v_total := v_taxable_base + v_tax_amount;

  -- 6. VALIDAR PAGOS Y CALCULAR VUELTO
  IF p_payment_method = 'CASH' THEN
    IF v_cash_received < v_total THEN
      RAISE EXCEPTION 'Efectivo recibido (%) es insuficiente para pagar el total (%)', 
        v_cash_received, v_total;
    END IF;
    v_cash_change := v_cash_received - v_total;
    v_cash_paid := v_total;
    v_digital_paid := 0.00;
  ELSIF p_payment_method IN ('CARD', 'YAPE', 'PLIN', 'TRANSFER') THEN
    v_cash_change := 0.00;
    v_cash_received := 0.00;
    v_cash_paid := 0.00;
    v_digital_paid := v_total;
  ELSE
    RAISE EXCEPTION 'Método de pago no reconocido: %', p_payment_method;
  END IF;

  -- 7. GESTIÓN DEL CLIENTE (HIGH-01: Manejo Concurrente Seguro y Cero Duplicidad)
  IF v_customer_id IS NULL THEN
    -- Inserción / obtención concurrente segura con ON CONFLICT (organization_id, phone)
    INSERT INTO public.customers (
      id,
      organization_id,
      name,
      phone,
      total_orders,
      total_spent,
      last_order_date
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      v_customer_name,
      v_customer_phone,
      1,
      v_total,
      NOW()
    )
    ON CONFLICT (organization_id, phone)
    DO UPDATE SET
      total_orders = public.customers.total_orders + 1,
      total_spent = public.customers.total_spent + v_total,
      last_order_date = NOW(),
      updated_at = NOW()
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET total_orders = total_orders + 1,
        total_spent = total_spent + v_total,
        last_order_date = NOW(),
        updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  -- 8. GENERAR ORDEN DE VENTA (Atómica con status COMPLETED)
  v_order_id := gen_random_uuid();
  SELECT COUNT(*) + 1 INTO v_order_count 
  FROM public.orders WHERE organization_id = p_organization_id;
  v_order_number := '#POS-' || LPAD(v_order_count::TEXT, 5, '0');

  INSERT INTO public.orders (
    id,
    organization_id,
    customer_id,
    customer_name,
    customer_phone,
    order_number,
    status,
    subtotal,
    discount,
    delivery_fee,
    total,
    delivery_type,
    payment_method,
    notes,
    items,
    created_at
  ) VALUES (
    v_order_id,
    p_organization_id,
    v_customer_id,
    v_customer_name,
    v_customer_phone,
    v_order_number,
    'COMPLETED',
    v_subtotal,
    v_discount,
    0.00,
    v_total,
    'PICKUP',
    p_payment_method,
    p_notes,
    p_items,
    NOW()
  );

  -- Insertar items normalizados
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      organization_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      v_order_id,
      p_organization_id,
      (v_item->>'product_id')::UUID,
      COALESCE(v_item->>'product_name', 'Producto'),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      ((v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::NUMERIC)
    );
  END LOOP;

  -- 9. DEDUCCIÓN ATÓMICA DE STOCK MEDIANTE MECANISMO CERTIFICADO DE KÁRDEX
  -- Llama al RPC oficial de Fase 12.1. Si el stock es insuficiente, generará EXCEPTION
  -- produciendo ROLLBACK TOTAL e instantáneo de toda la transacción.
  v_deduct_res := public.deduct_order_inventory(
    p_organization_id,
    v_order_id,
    p_user_id,
    'Venta en Mostrador POS ' || v_order_number,
    p_items
  );

  -- 10. REGISTRAR MOVIMIENTOS FINANCIEROS Y ACTUALIZAR CAJA
  SELECT COALESCE(full_name, email, 'Cajero') INTO v_user_name 
  FROM public.profiles WHERE id = p_user_id;
  IF v_user_name IS NULL THEN v_user_name := 'Cajero'; END IF;

  IF v_cash_paid > 0 THEN
    INSERT INTO public.cash_movements (
      organization_id,
      shift_id,
      movement_type,
      amount,
      reason,
      reference_id,
      payment_method,
      created_by,
      created_by_name
    ) VALUES (
      p_organization_id,
      v_shift.id,
      'SALE_CASH',
      v_cash_paid,
      'Venta POS ' || v_order_number,
      v_order_id::TEXT,
      'CASH',
      p_user_id,
      v_user_name
    );

    UPDATE public.cash_shifts
    SET sales_cash_total = sales_cash_total + v_cash_paid,
        expected_cash = expected_cash + v_cash_paid
    WHERE id = v_shift.id;
  END IF;

  IF v_digital_paid > 0 THEN
    INSERT INTO public.cash_movements (
      organization_id,
      shift_id,
      movement_type,
      amount,
      reason,
      reference_id,
      payment_method,
      created_by,
      created_by_name
    ) VALUES (
      p_organization_id,
      v_shift.id,
      'SALE_DIGITAL',
      v_digital_paid,
      'Venta POS Digital ' || v_order_number || ' (' || p_payment_method || ')',
      v_order_id::TEXT,
      p_payment_method,
      p_user_id,
      v_user_name
    );

    UPDATE public.cash_shifts
    SET sales_digital_total = sales_digital_total + v_digital_paid
    WHERE id = v_shift.id;
  END IF;

  -- 11. GENERACIÓN DE COMPROBANTE CON CORRELATIVO ATÓMICO (LOCK FOR UPDATE)
  SELECT * INTO v_series_rec
  FROM public.sales_receipt_series
  WHERE organization_id = p_organization_id AND document_type = p_document_type
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Inicializar serie automática por defecto si no existía
    INSERT INTO public.sales_receipt_series (
      organization_id,
      document_type,
      series,
      current_number
    ) VALUES (
      p_organization_id,
      p_document_type,
      CASE p_document_type 
        WHEN 'BOLETA' THEN 'B001' 
        WHEN 'FACTURA' THEN 'F001' 
        ELSE 'T001' 
      END,
      1
    ) RETURNING series, current_number INTO v_series_rec;
    v_receipt_number := v_series_rec.current_number;
  ELSE
    UPDATE public.sales_receipt_series
    SET current_number = current_number + 1
    WHERE id = v_series_rec.id
    RETURNING current_number INTO v_receipt_number;
  END IF;

  v_full_number := v_series_rec.series || '-' || LPAD(v_receipt_number::TEXT, 6, '0');
  v_receipt_id := gen_random_uuid();

  INSERT INTO public.sales_receipts (
    id,
    organization_id,
    order_id,
    cash_shift_id,
    document_type,
    series,
    number,
    full_number,
    customer_name,
    customer_document,
    subtotal,
    discount,
    tax_rate,
    tax_amount,
    total,
    payment_method,
    cash_received,
    cash_change,
    status,
    issued_at
  ) VALUES (
    v_receipt_id,
    p_organization_id,
    v_order_id,
    v_shift.id,
    p_document_type,
    v_series_rec.series,
    v_receipt_number,
    v_full_number,
    v_customer_name,
    p_customer_document,
    v_subtotal,
    v_discount,
    v_tax_rate,
    v_tax_amount,
    v_total,
    p_payment_method,
    v_cash_received,
    v_cash_change,
    'ISSUED',
    NOW()
  );

  -- 12. CONSTRUIR PAYLOAD DE RESPUESTA
  v_response := jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'receipt_id', v_receipt_id,
    'receipt_number', v_full_number,
    'document_type', p_document_type,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'tax_amount', v_tax_amount,
    'total', v_total,
    'payment_method', p_payment_method,
    'cash_received', v_cash_received,
    'cash_change', v_cash_change,
    'customer_name', v_customer_name,
    'shift_id', v_shift.id,
    'issued_at', NOW()
  );

  -- 13. REGISTRAR IDEMPOTENCIA
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) <> '' THEN
    INSERT INTO public.pos_idempotency (
      organization_id,
      idempotency_key,
      order_id,
      receipt_id,
      response_payload
    ) VALUES (
      p_organization_id,
      TRIM(p_idempotency_key),
      v_order_id,
      v_receipt_id,
      v_response
    );
  END IF;

  RETURN v_response;
END;
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES PARA FASE 13
-- ==============================================================================

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_receipt_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_idempotency ENABLE ROW LEVEL SECURITY;

-- Políticas CASH_REGISTERS
DROP POLICY IF EXISTS "Miembros ven cajas de su organizacion" ON public.cash_registers;
CREATE POLICY "Miembros ven cajas de su organizacion" ON public.cash_registers
  FOR SELECT USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Staff y admin gestionan cajas" ON public.cash_registers;
CREATE POLICY "Staff y admin gestionan cajas" ON public.cash_registers
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- Políticas CASH_SHIFTS
DROP POLICY IF EXISTS "Miembros ven turnos de su organizacion" ON public.cash_shifts;
CREATE POLICY "Miembros ven turnos de su organizacion" ON public.cash_shifts
  FOR SELECT USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Staff y admin gestionan turnos" ON public.cash_shifts;
CREATE POLICY "Staff y admin gestionan turnos" ON public.cash_shifts
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- Políticas CASH_MOVEMENTS
DROP POLICY IF EXISTS "Miembros ven movimientos de caja" ON public.cash_movements;
CREATE POLICY "Miembros ven movimientos de caja" ON public.cash_movements
  FOR SELECT USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Staff y admin insertan movimientos" ON public.cash_movements;
CREATE POLICY "Staff y admin insertan movimientos" ON public.cash_movements
  FOR INSERT WITH CHECK (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- Políticas SALES_RECEIPTS
DROP POLICY IF EXISTS "Miembros ven comprobantes" ON public.sales_receipts;
CREATE POLICY "Miembros ven comprobantes" ON public.sales_receipts
  FOR SELECT USING (public.is_member_of_org(organization_id));

-- Políticas SALES_RECEIPT_SERIES
DROP POLICY IF EXISTS "Miembros ven series de comprobantes" ON public.sales_receipt_series;
CREATE POLICY "Miembros ven series de comprobantes" ON public.sales_receipt_series
  FOR SELECT USING (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "Staff y admin gestionan series" ON public.sales_receipt_series;
CREATE POLICY "Staff y admin gestionan series" ON public.sales_receipt_series
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- Políticas POS_IDEMPOTENCY (MED-01: SELECT para auditoría restringido por tenant y roles autorizados)
DROP POLICY IF EXISTS "Miembros autorizados ven registros de idempotencia" ON public.pos_idempotency;
CREATE POLICY "Miembros autorizados ven registros de idempotencia" ON public.pos_idempotency
  FOR SELECT USING (
    public.is_member_of_org(organization_id) AND 
    LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin')
  );
