-- ==============================================================================
-- NEGOCIO FLEX — FASE 12: CATÁLOGO INTEGRAL + INVENTORY LEDGER + STOCK ATÓMICO
-- Módulo de Catálogo, Libro Mayor Inmutable, Deducción Atómica e Idempotencia
-- ==============================================================================

-- 1. ACTUALIZAR TABLA PRODUCTS CON CAMPOS DE INVENTARIO Y COSTO
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
  ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice único para SKU por organización (para SKUs no nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_organization_sku 
  ON public.products (organization_id, UPPER(TRIM(sku))) 
  WHERE sku IS NOT NULL AND TRIM(sku) <> '';

-- Índices de búsqueda y optimización
CREATE INDEX IF NOT EXISTS idx_products_track_stock ON public.products (organization_id, track_inventory, stock);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (organization_id, barcode) WHERE barcode IS NOT NULL;

-- 2. TABLA: INVENTORY_MOVEMENTS (LIBRO MAYOR INMUTABLE DE INVENTARIO)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'PURCHASE',       -- Entrada por compra a proveedor
    'SALE',           -- Egreso por venta confirmada
    'RETURN',         -- Ingreso por devolución de cliente
    'ADJUSTMENT',     -- Ajuste manual (conteo / auditoría)
    'CANCELLATION',   -- Reversión por pedido cancelado
    'REVERSAL',       -- Reversión de movimiento compensatorio
    'INITIAL_LOAD'    -- Carga inicial de inventario
  )),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0),
  reference_type TEXT NOT NULL DEFAULT 'MANUAL' CHECK (reference_type IN (
    'ORDER',
    'PURCHASE_ORDER',
    'MANUAL_ADJUSTMENT',
    'INITIAL_INVENTORY',
    'IMPORT',
    'REVERSAL'
  )),
  reference_id TEXT, -- ID de pedido o referencia externa
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas operacionales y auditoría
CREATE INDEX IF NOT EXISTS idx_inventory_org_product ON public.inventory_movements (organization_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_org_created ON public.inventory_movements (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_reference ON public.inventory_movements (organization_id, reference_type, reference_id);

-- Constraint de Idempotencia: Evita duplicar movimientos automáticos para el mismo pedido y producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_idempotency_order 
  ON public.inventory_movements (organization_id, reference_type, reference_id, product_id, movement_type) 
  WHERE reference_id IS NOT NULL AND reference_type = 'ORDER';

-- HIGH-03: Validación dinámica de stock negativo según allow_negative_stock por producto
CREATE OR REPLACE FUNCTION public.check_inventory_movement_stock_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allow_negative BOOLEAN;
BEGIN
  SELECT allow_negative_stock INTO v_allow_negative
  FROM public.products
  WHERE id = NEW.product_id;

  IF COALESCE(v_allow_negative, FALSE) = FALSE AND NEW.stock_after < 0 THEN
    RAISE EXCEPTION 'Violación de regla de inventario: El stock resultante (%) no puede ser negativo para el producto con ID %.', NEW.stock_after, NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_inventory_movement_stock_limit ON public.inventory_movements;
CREATE TRIGGER trg_check_inventory_movement_stock_limit
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.check_inventory_movement_stock_limit();

-- HIGH-01: Prohibición de modificación directa de stock en products
CREATE OR REPLACE FUNCTION public.prevent_direct_product_stock_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    IF current_setting('inventory.internal_operation', TRUE) IS DISTINCT FROM 'TRUE' THEN
      RAISE EXCEPTION 'El stock de un producto no puede modificarse directamente vía UPDATE en public.products. Utilice las funciones del Kárdex (adjust_inventory, deduct_order_inventory, restore_order_inventory).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_direct_product_stock_mutation ON public.products;
CREATE TRIGGER trg_prevent_direct_product_stock_mutation
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_product_stock_mutation();

-- MED-01: Carga inicial automática de Kárdex al crear productos con stock > 0
CREATE OR REPLACE FUNCTION public.trg_product_initial_load_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.stock > 0 AND NEW.track_inventory THEN
    INSERT INTO public.inventory_movements (
      organization_id,
      product_id,
      movement_type,
      quantity,
      stock_before,
      stock_after,
      unit_cost,
      total_cost,
      reference_type,
      reference_id,
      reason,
      created_by
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'INITIAL_LOAD',
      NEW.stock,
      0,
      NEW.stock,
      NEW.cost_price,
      ROUND((NEW.cost_price * NEW.stock)::numeric, 2),
      'INITIAL_INVENTORY',
      NEW.id::TEXT,
      'Carga inicial de inventario al crear producto',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_initial_load_ledger ON public.products;
CREATE TRIGGER trg_product_initial_load_ledger
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_product_initial_load_ledger();

-- Inmutabilidad del Libro Mayor: Bloquear UPDATE y DELETE
CREATE OR REPLACE FUNCTION public.prevent_inventory_movements_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'El Libro Mayor de Inventario es inmutable. No se permite UPDATE ni DELETE sobre inventory_movements.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_inventory_movements_mutation ON public.inventory_movements;
CREATE TRIGGER trg_prevent_inventory_movements_mutation
  BEFORE UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inventory_movements_mutation();

-- 3. FUNCIONES ATÓMICAS POSTGRESQL (RPC) CON PROTECCIÓN DE CONCURRENCIA

-- A) Deducción Atómica de Stock por Pedido con Bloqueo Determinista FOR UPDATE
CREATE OR REPLACE FUNCTION public.deduct_order_inventory(
  p_organization_id UUID,
  p_order_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_items JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_json_item JSONB;
  v_product RECORD;
  v_order RECORD;
  v_new_stock INTEGER;
  v_items_processed INTEGER := 0;
  v_already_deducted BOOLEAN;
  v_prod_id UUID;
  v_qty INTEGER;
  v_reason_text TEXT;
BEGIN
  -- MED-02: Bloqueo a nivel de fila sobre el pedido para serializar llamadas concurrentes
  SELECT id, organization_id, order_number, status 
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND organization_id = p_organization_id
  FOR UPDATE;

  -- 1. Validar existencia del pedido si no se pasaron items en JSON
  IF NOT FOUND AND (p_items IS NULL OR jsonb_array_length(p_items) = 0) THEN
    RAISE EXCEPTION 'Pedido no encontrado o no pertenece a la organización.';
  END IF;

  v_reason_text := COALESCE(p_reason, CASE WHEN v_order.order_number IS NOT NULL THEN 'Venta confirmada en Pedido #' || v_order.order_number ELSE 'Venta por Pedido ' || p_order_id::TEXT END);

  -- 2. Validar idempotencia a nivel de pedido
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE organization_id = p_organization_id
      AND reference_type = 'ORDER'
      AND reference_id = p_order_id::TEXT
      AND movement_type = 'SALE'
  ) INTO v_already_deducted;

  IF v_already_deducted THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'idempotent', TRUE,
      'message', 'El inventario para este pedido ya fue descontado previamente.',
      'order_id', p_order_id
    );
  END IF;

  -- Habilitar bandera de sesión para permitir actualización de stock desde RPC
  PERFORM set_config('inventory.internal_operation', 'TRUE', TRUE);

  -- 3. Procesar artículos con bloqueo determinista ordenado por product_id para evitar deadlocks
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    -- Modo B: Artículos proporcionados directamente en JSONB
    FOR v_json_item IN 
      SELECT value FROM jsonb_array_elements(p_items)
      ORDER BY (value->>'product_id')::UUID ASC
    LOOP
      v_prod_id := (v_json_item->>'product_id')::UUID;
      v_qty := (v_json_item->>'quantity')::INTEGER;

      IF v_qty <= 0 THEN
        CONTINUE;
      END IF;

      -- Bloquear el producto atómicamente con FOR UPDATE
      SELECT id, name, stock, cost_price, track_inventory, allow_negative_stock
      INTO v_product
      FROM public.products
      WHERE id = v_prod_id AND organization_id = p_organization_id
      FOR UPDATE;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      IF NOT v_product.track_inventory THEN
        CONTINUE;
      END IF;

      IF NOT v_product.allow_negative_stock AND v_product.stock < v_qty THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto "%" (Disponible: %, Requerido: %)', 
          v_product.name, v_product.stock, v_qty;
      END IF;

      v_new_stock := v_product.stock - v_qty;

      UPDATE public.products
      SET stock = v_new_stock,
          updated_at = NOW()
      WHERE id = v_product.id;

      INSERT INTO public.inventory_movements (
        organization_id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        reason,
        created_by
      ) VALUES (
        p_organization_id,
        v_product.id,
        'SALE',
        v_qty,
        v_product.stock,
        v_new_stock,
        v_product.cost_price,
        ROUND((v_product.cost_price * v_qty)::numeric, 2),
        'ORDER',
        p_order_id::TEXT,
        v_reason_text,
        p_user_id
      );

      v_items_processed := v_items_processed + 1;
    END LOOP;
  ELSE
    -- Modo A: Leer artículos desde order_items de la orden persistida
    FOR v_item IN 
      SELECT oi.product_id, oi.quantity, oi.product_name
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
      ORDER BY oi.product_id ASC
    LOOP
      SELECT id, name, stock, cost_price, track_inventory, allow_negative_stock
      INTO v_product
      FROM public.products
      WHERE id = v_item.product_id AND organization_id = p_organization_id
      FOR UPDATE;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      IF NOT v_product.track_inventory THEN
        CONTINUE;
      END IF;

      IF NOT v_product.allow_negative_stock AND v_product.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto "%" (Disponible: %, Requerido: %)', 
          v_product.name, v_product.stock, v_item.quantity;
      END IF;

      v_new_stock := v_product.stock - v_item.quantity;

      UPDATE public.products
      SET stock = v_new_stock,
          updated_at = NOW()
      WHERE id = v_product.id;

      INSERT INTO public.inventory_movements (
        organization_id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        reason,
        created_by
      ) VALUES (
        p_organization_id,
        v_product.id,
        'SALE',
        v_item.quantity,
        v_product.stock,
        v_new_stock,
        v_product.cost_price,
        ROUND((v_product.cost_price * v_item.quantity)::numeric, 2),
        'ORDER',
        p_order_id::TEXT,
        v_reason_text,
        p_user_id
      );

      v_items_processed := v_items_processed + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'idempotent', FALSE,
    'items_processed', v_items_processed,
    'order_id', p_order_id
  );
END;
$$;

-- B) Reversión Compensatoria de Stock por Cancelación de Pedido
CREATE OR REPLACE FUNCTION public.restore_order_inventory(
  p_organization_id UUID,
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Cancelación de pedido',
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_mov RECORD;
  v_product RECORD;
  v_order RECORD;
  v_new_stock INTEGER;
  v_items_restored INTEGER := 0;
  v_already_restored BOOLEAN;
BEGIN
  -- RBAC: Validar autorización del usuario
  v_caller_role := public.get_user_org_role(p_organization_id);
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'staff', 'super_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: No tiene permisos para restaurar inventario en esta organización.';
  END IF;

  -- Bloquear pedido
  SELECT id, organization_id, order_number 
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado o no pertenece a la organización.';
  END IF;

  -- Validar que no se haya restaurado ya
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE organization_id = p_organization_id
      AND reference_type = 'ORDER'
      AND reference_id = p_order_id::TEXT
      AND movement_type = 'CANCELLATION'
  ) INTO v_already_restored;

  IF v_already_restored THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'idempotent', TRUE,
      'message', 'El inventario para este pedido ya fue restaurado previamente.',
      'order_id', p_order_id
    );
  END IF;

  PERFORM set_config('inventory.internal_operation', 'TRUE', TRUE);

  -- Buscar los movimientos de SALE asociados a este pedido ordenados
  FOR v_mov IN
    SELECT product_id, quantity, unit_cost
    FROM public.inventory_movements
    WHERE organization_id = p_organization_id
      AND reference_type = 'ORDER'
      AND reference_id = p_order_id::TEXT
      AND movement_type = 'SALE'
    ORDER BY product_id ASC
  LOOP
    SELECT id, name, stock, track_inventory
    INTO v_product
    FROM public.products
    WHERE id = v_mov.product_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF FOUND AND v_product.track_inventory THEN
      v_new_stock := v_product.stock + v_mov.quantity;

      UPDATE public.products
      SET stock = v_new_stock,
          updated_at = NOW()
      WHERE id = v_product.id;

      INSERT INTO public.inventory_movements (
        organization_id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        reason,
        created_by
      ) VALUES (
        p_organization_id,
        v_product.id,
        'CANCELLATION',
        v_mov.quantity,
        v_product.stock,
        v_new_stock,
        v_mov.unit_cost,
        ROUND((v_mov.unit_cost * v_mov.quantity)::numeric, 2),
        'ORDER',
        p_order_id::TEXT,
        COALESCE(p_reason, 'Restauración por cancelación de Pedido #' || v_order.order_number),
        p_user_id
      );

      v_items_restored := v_items_restored + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'idempotent', FALSE,
    'items_restored', v_items_restored,
    'order_id', p_order_id
  );
END;
$$;

-- C) CRIT-01 & HIGH-02: Ajuste Manual de Inventario con RBAC Estricto y Dirección
CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_organization_id UUID,
  p_product_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_unit_cost NUMERIC DEFAULT 0.00,
  p_reason TEXT DEFAULT 'Ajuste manual',
  p_reference_type TEXT DEFAULT 'MANUAL_ADJUSTMENT',
  p_reference_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_direction TEXT DEFAULT 'IN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_product RECORD;
  v_new_stock INTEGER;
  v_valid_types TEXT[] := ARRAY['PURCHASE', 'RETURN', 'ADJUSTMENT', 'INITIAL_LOAD', 'REVERSAL'];
  v_delta INTEGER;
BEGIN
  -- CRIT-01: Verificación estricta de autorización RBAC server-side
  v_caller_role := public.get_user_org_role(p_organization_id);
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Propietario o Administrador para realizar ajustes de inventario.';
  END IF;

  IF NOT (p_movement_type = ANY(v_valid_types)) THEN
    RAISE EXCEPTION 'Tipo de movimiento inválido para ajuste directo: %', p_movement_type;
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser un número entero positivo mayor a cero.';
  END IF;

  IF p_unit_cost < 0 THEN
    RAISE EXCEPTION 'El costo unitario no puede ser negativo.';
  END IF;

  -- Bloquear producto atómicamente
  SELECT id, name, stock, cost_price, allow_negative_stock
  INTO v_product
  FROM public.products
  WHERE id = p_product_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado en la organización especificada.';
  END IF;

  -- Calcular nuevo stock según tipo de movimiento y dirección
  IF p_movement_type IN ('PURCHASE', 'RETURN', 'INITIAL_LOAD') THEN
    v_new_stock := v_product.stock + p_quantity;
  ELSIF p_movement_type = 'REVERSAL' THEN
    v_new_stock := v_product.stock - p_quantity;
  ELSIF p_movement_type = 'ADJUSTMENT' THEN
    IF UPPER(COALESCE(p_direction, 'IN')) = 'OUT' THEN
      v_new_stock := v_product.stock - p_quantity;
    ELSIF UPPER(COALESCE(p_direction, 'IN')) = 'IN' THEN
      v_new_stock := v_product.stock + p_quantity;
    ELSE
      -- Conteo físico absoluto
      v_new_stock := p_quantity;
    END IF;
  END IF;

  IF v_new_stock < 0 AND NOT v_product.allow_negative_stock THEN
    RAISE EXCEPTION 'La operación resultaría en stock negativo para "%" (Stock actual: %, Resultado: %). No permitido.', v_product.name, v_product.stock, v_new_stock;
  END IF;

  PERFORM set_config('inventory.internal_operation', 'TRUE', TRUE);

  -- Actualizar producto
  UPDATE public.products
  SET stock = v_new_stock,
      cost_price = CASE WHEN p_unit_cost > 0 THEN p_unit_cost ELSE cost_price END,
      updated_at = NOW()
  WHERE id = v_product.id;

  v_delta := ABS(v_new_stock - v_product.stock);
  IF v_delta = 0 THEN
    v_delta := p_quantity;
  END IF;

  -- Registrar movimiento en Ledger inmutable
  INSERT INTO public.inventory_movements (
    organization_id,
    product_id,
    movement_type,
    quantity,
    stock_before,
    stock_after,
    unit_cost,
    total_cost,
    reference_type,
    reference_id,
    reason,
    created_by
  ) VALUES (
    p_organization_id,
    v_product.id,
    p_movement_type,
    p_quantity,
    v_product.stock,
    v_new_stock,
    CASE WHEN p_unit_cost > 0 THEN p_unit_cost ELSE v_product.cost_price END,
    ROUND(((CASE WHEN p_unit_cost > 0 THEN p_unit_cost ELSE v_product.cost_price END) * p_quantity)::numeric, 2),
    p_reference_type,
    p_reference_id,
    p_reason,
    p_user_id
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'product_id', p_product_id,
    'stock_before', v_product.stock,
    'stock_after', v_new_stock,
    'movement_type', p_movement_type
  );
END;
$$;

-- 4. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Miembros autenticados de la organización pueden consultar su propio libro mayor
DROP POLICY IF EXISTS "Members can read own inventory movements" ON public.inventory_movements;
CREATE POLICY "Members can read own inventory movements"
ON public.inventory_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = inventory_movements.organization_id
      AND om.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = inventory_movements.organization_id
      AND o.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_super_admin = TRUE
  )
);

-- Política INSERT: Solo miembros autorizados o mediante funciones SECURITY DEFINER
DROP POLICY IF EXISTS "Members can insert own inventory movements" ON public.inventory_movements;
CREATE POLICY "Members can insert own inventory movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = inventory_movements.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN', 'STAFF', 'SUPER_ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = inventory_movements.organization_id
      AND o.created_by = auth.uid()
  )
);

-- NO SE DEFINEN POLÍTICAS DE UPDATE NI DELETE (INMUTABILIDAD TOTAL)
REVOKE UPDATE, DELETE ON public.inventory_movements FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_order_inventory(UUID, UUID, UUID, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_inventory(UUID, UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(UUID, UUID, TEXT, INTEGER, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated, service_role;
