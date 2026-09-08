-- ==============================================================================
-- NEGOCIO FLEX — FASE 13.1: REMEDIACIÓN FORENSE POS, CAJAS Y COMPROBANTES
-- Corrige:
-- 1. CRIT-01: Discrepancia de casing en validación RBAC/RLS ('owner', 'admin', 'staff', 'super_admin')
-- 2. HIGH-01: Concurrencia en gestión de clientes con ON CONFLICT (organization_id, phone)
-- 3. MED-01: Política RLS SELECT para pos_idempotency delimitada por Tenant y Roles
-- 4. LOW-01: Bloqueo transaccional FOR UPDATE en cash_registers para apertura de turno
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: OPEN_CASH_SHIFT (Corrige CRIT-01 y LOW-01)
-- ------------------------------------------------------------------------------
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

  RETURN jsonb_build_object(
    'success', true,
    'shift_id', v_shift_id,
    'status', 'OPEN',
    'initial_cash', v_initial,
    'opened_at', NOW()
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. RPC: CLOSE_CASH_SHIFT (Corrige CRIT-01)
-- ------------------------------------------------------------------------------
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
      notes = CASE 
        WHEN p_notes IS NOT NULL AND TRIM(p_notes) <> '' THEN 
          COALESCE(notes || E'\n' || p_notes, p_notes)
        ELSE notes 
      END
  WHERE id = p_shift_id;

  RETURN jsonb_build_object(
    'success', true,
    'shift_id', p_shift_id,
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

-- ------------------------------------------------------------------------------
-- 3. RPC: RECORD_CASH_MOVEMENT (Corrige CRIT-01)
-- ------------------------------------------------------------------------------
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

  -- Obtener nombre del cajero
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
    created_by_name,
    created_at
  ) VALUES (
    v_movement_id,
    p_organization_id,
    p_shift_id,
    p_movement_type,
    p_amount,
    TRIM(p_reason),
    p_payment_method,
    p_user_id,
    v_user_name,
    NOW()
  );

  -- 5. Actualizar totales del turno de caja
  IF p_movement_type = 'CASH_IN' THEN
    UPDATE public.cash_shifts
    SET cash_in_total = cash_in_total + p_amount,
        expected_cash = expected_cash + p_amount
    WHERE id = p_shift_id
    RETURNING expected_cash INTO v_new_expected;
  ELSE
    UPDATE public.cash_shifts
    SET cash_out_total = cash_out_total + p_amount,
        expected_cash = expected_cash - p_amount
    WHERE id = p_shift_id
    RETURNING expected_cash INTO v_new_expected;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'movement_type', p_movement_type,
    'amount', p_amount,
    'expected_cash_now', v_new_expected,
    'created_at', NOW()
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. RPC: PROCESS_POS_SALE (Corrige CRIT-01 y HIGH-01)
-- ------------------------------------------------------------------------------
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

  -- Obtener nombre del cajero
  SELECT COALESCE(full_name, email, 'Cajero') INTO v_user_name 
  FROM public.profiles WHERE id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Cajero';
  END IF;

  -- 8. GENERAR CORRELATIVO DE PEDIDO
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_order_count 
  FROM public.orders 
  WHERE organization_id = p_organization_id;
  
  v_order_number := 'POS-' || LPAD(v_order_count::TEXT, 5, '0');
  v_order_id := gen_random_uuid();

  -- 9. INSERTAR REGISTRO DE PEDIDO
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
    payment_method,
    payment_status,
    notes,
    created_at,
    updated_at
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
    p_payment_method,
    'PAID',
    COALESCE(p_notes, 'Venta en Terminal Punto de Venta'),
    NOW(),
    NOW()
  );

  -- 10. INSERTAR ARTÍCULOS DEL PEDIDO
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      name,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      ((v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::NUMERIC)
    );
  END LOOP;

  -- 11. DEDUCCIÓN ATÓMICA DE INVENTARIO Y REGISTRO EN KÁRDEX (Fase 12.1 Integrada)
  v_deduct_res := public.deduct_order_inventory(
    p_organization_id,
    v_order_id,
    p_user_id,
    'Venta POS ' || v_order_number,
    p_items
  );

  -- 12. ACTUALIZAR TOTALES DE TURNO Y REGISTRAR EN LIBRO MAYOR DE CAJA
  IF p_payment_method = 'CASH' THEN
    UPDATE public.cash_shifts
    SET sales_cash_total = sales_cash_total + v_total,
        expected_cash = expected_cash + v_total
    WHERE id = p_shift_id;

    INSERT INTO public.cash_movements (
      id,
      organization_id,
      shift_id,
      movement_type,
      amount,
      reason,
      reference_id,
      payment_method,
      created_by,
      created_by_name,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      p_shift_id,
      'SALE_CASH',
      v_total,
      'Venta POS ' || v_order_number,
      v_order_id::TEXT,
      'CASH',
      p_user_id,
      v_user_name,
      NOW()
    );
  ELSE
    UPDATE public.cash_shifts
    SET sales_digital_total = sales_digital_total + v_total
    WHERE id = p_shift_id;

    INSERT INTO public.cash_movements (
      id,
      organization_id,
      shift_id,
      movement_type,
      amount,
      reason,
      reference_id,
      payment_method,
      created_by,
      created_by_name,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      p_shift_id,
      'SALE_DIGITAL',
      v_total,
      'Venta POS Digital ' || v_order_number || ' (' || p_payment_method || ')',
      v_order_id::TEXT,
      p_payment_method,
      p_user_id,
      v_user_name,
      NOW()
    );
  END IF;

  -- 13. GENERAR COMPROBANTE DE VENTA CON BLOQUEO EXCLUSIVO DE SERIE
  SELECT * INTO v_series_rec
  FROM public.sales_receipt_series
  WHERE organization_id = p_organization_id 
    AND document_type = p_document_type 
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sales_receipt_series (
      id,
      organization_id,
      document_type,
      series,
      current_number,
      is_active
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      p_document_type,
      CASE p_document_type 
        WHEN 'BOLETA' THEN 'B001'
        WHEN 'FACTURA' THEN 'F001'
        ELSE 'T001'
      END,
      0,
      TRUE
    )
    RETURNING * INTO v_series_rec;
  END IF;

  v_receipt_number := v_series_rec.current_number + 1;
  UPDATE public.sales_receipt_series
  SET current_number = v_receipt_number
  WHERE id = v_series_rec.id;

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
    subtotal,
    discount,
    tax_amount,
    total,
    payment_method,
    cash_received,
    cash_change,
    customer_id,
    customer_name,
    customer_document,
    issued_by,
    issued_by_name,
    created_at
  ) VALUES (
    v_receipt_id,
    p_organization_id,
    v_order_id,
    p_shift_id,
    p_document_type,
    v_series_rec.series,
    v_receipt_number,
    v_full_number,
    v_taxable_base,
    v_discount,
    v_tax_amount,
    v_total,
    p_payment_method,
    v_cash_received,
    v_cash_change,
    v_customer_id,
    v_customer_name,
    p_customer_document,
    p_user_id,
    v_user_name,
    NOW()
  );

  -- 14. CONSTRUIR PAYLOAD DE RESPUESTA
  v_response := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'receipt_id', v_receipt_id,
    'receipt_number', v_full_number,
    'total', v_total,
    'subtotal', v_taxable_base,
    'tax_amount', v_tax_amount,
    'payment_method', p_payment_method,
    'cash_received', v_cash_received,
    'cash_change', v_cash_change,
    'customer_id', v_customer_id,
    'created_at', NOW()
  );

  -- 15. REGISTRAR EN TABLA DE IDEMPOTENCIA
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) <> '' THEN
    INSERT INTO public.pos_idempotency (
      id,
      organization_id,
      idempotency_key,
      order_id,
      receipt_id,
      response_payload,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      TRIM(p_idempotency_key),
      v_order_id,
      v_receipt_id,
      v_response,
      NOW()
    );
  END IF;

  RETURN v_response;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS REMEDIADAS (CRIT-01 y MED-01)
-- ------------------------------------------------------------------------------
-- CASH_REGISTERS
DROP POLICY IF EXISTS "Staff y admin gestionan cajas" ON public.cash_registers;
CREATE POLICY "Staff y admin gestionan cajas" ON public.cash_registers
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- CASH_SHIFTS
DROP POLICY IF EXISTS "Staff y admin gestionan turnos" ON public.cash_shifts;
CREATE POLICY "Staff y admin gestionan turnos" ON public.cash_shifts
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- CASH_MOVEMENTS
DROP POLICY IF EXISTS "Staff y admin insertan movimientos" ON public.cash_movements;
CREATE POLICY "Staff y admin insertan movimientos" ON public.cash_movements
  FOR INSERT WITH CHECK (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- SALES_RECEIPT_SERIES
DROP POLICY IF EXISTS "Staff y admin gestionan series" ON public.sales_receipt_series;
CREATE POLICY "Staff y admin gestionan series" ON public.sales_receipt_series
  FOR ALL USING (LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin'));

-- POS_IDEMPOTENCY (MED-01: Exclusivo para miembros autorizados de la organización)
DROP POLICY IF EXISTS "Miembros autorizados ven registros de idempotencia" ON public.pos_idempotency;
CREATE POLICY "Miembros autorizados ven registros de idempotencia" ON public.pos_idempotency
  FOR SELECT USING (
    public.is_member_of_org(organization_id) AND 
    LOWER(public.get_user_org_role(organization_id)) IN ('owner', 'admin', 'staff', 'super_admin')
  );
