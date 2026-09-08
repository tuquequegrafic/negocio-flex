import { supabaseService } from '../../../../core/network/supabase_client';
import { ValidationException, ServerException } from '../../../../core/errors/app_exceptions';
import { CashRegisterEntity } from '../../domain/entities/cash_register_entity';
import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashMovementEntity } from '../../domain/entities/cash_movement_entity';
import { SalesReceiptEntity } from '../../domain/entities/sales_receipt_entity';
import { PosSaleRequest, PosSaleResult } from '../../domain/entities/pos_sale_entity';
import { OpenShiftParams, CloseShiftParams, RecordCashMovementParams } from '../../domain/repositories/cash_shift_repository';

export interface PosDataSourceDependencies {
  deductStockFn?: (params: {
    organizationId: string;
    orderId: string;
    userId: string;
    reason: string;
    items: { productId: string; productName: string; quantity: number }[];
  }) => Promise<{ success: boolean; message?: string }>;
  createOrderFn?: (order: any) => Promise<any>;
  findOrCreateCustomerFn?: (customer: { organizationId: string; name: string; phone: string }) => Promise<any>;
}

export class PosDataSource {
  // Almacenes locales para modo sin Supabase o desarrollo
  private static localRegisters: Map<string, CashRegisterEntity[]> = new Map();
  private static localShifts: Map<string, CashShiftEntity[]> = new Map();
  private static localMovements: Map<string, CashMovementEntity[]> = new Map();
  private static localReceipts: Map<string, SalesReceiptEntity[]> = new Map();
  private static localReceiptCounters: Map<string, number> = new Map();
  private static localIdempotency: Map<string, PosSaleResult> = new Map();

  constructor(private readonly deps?: PosDataSourceDependencies) {}

  private getClient() {
    return supabaseService.getClient();
  }

  // ==========================================
  // CAJAS REGISTRADORAS
  // ==========================================

  async getCashRegisters(organizationId: string): Promise<CashRegisterEntity[]> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('cash_registers')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new ServerException(`Error al consultar cajas: ${error.message}`);
      }

      return (data || []).map(r => ({
        id: r.id,
        organizationId: r.organization_id,
        name: r.name,
        code: r.code,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    // Modo local / test
    let registers = PosDataSource.localRegisters.get(organizationId);
    if (!registers || registers.length === 0) {
      const defaultRegister: CashRegisterEntity = {
        id: `reg-${organizationId}-main`,
        organizationId,
        name: 'Caja Principal',
        code: 'CAJA-01',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      registers = [defaultRegister];
      PosDataSource.localRegisters.set(organizationId, registers);
    }
    return registers;
  }

  async createCashRegister(organizationId: string, name: string, code: string): Promise<CashRegisterEntity> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('cash_registers')
        .insert({
          organization_id: organizationId,
          name,
          code,
        })
        .select()
        .single();

      if (error) {
        throw new ServerException(`Error al crear caja registradora: ${error.message}`);
      }

      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        code: data.code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const registers = await this.getCashRegisters(organizationId);
    if (registers.some(r => r.code.toUpperCase() === code.toUpperCase())) {
      throw new ValidationException(`Ya existe una caja con el código "${code}".`, 'code');
    }

    const newReg: CashRegisterEntity = {
      id: crypto.randomUUID(),
      organizationId,
      name,
      code,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    registers.push(newReg);
    PosDataSource.localRegisters.set(organizationId, registers);
    return newReg;
  }

  // ==========================================
  // TURNOS DE CAJA (CASH SHIFTS)
  // ==========================================

  async getActiveShift(organizationId: string, cashRegisterId?: string): Promise<CashShiftEntity | null> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      let query = client
        .from('cash_shifts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'OPEN');

      if (cashRegisterId) {
        query = query.eq('cash_register_id', cashRegisterId);
      }

      const { data, error } = await query.order('opened_at', { ascending: false }).limit(1);

      if (error) {
        throw new ServerException(`Error al consultar turno activo: ${error.message}`);
      }

      if (!data || data.length === 0) return null;
      const s = data[0];
      return {
        id: s.id,
        organizationId: s.organization_id,
        cashRegisterId: s.cash_register_id,
        openedBy: s.opened_by,
        openedByName: s.opened_by_name,
        status: s.status,
        initialCash: Number(s.initial_cash),
        salesCashTotal: Number(s.sales_cash_total),
        salesDigitalTotal: Number(s.sales_digital_total),
        cashInTotal: Number(s.cash_in_total),
        cashOutTotal: Number(s.cash_out_total),
        expectedCash: Number(s.expected_cash),
        actualCash: s.actual_cash !== null ? Number(s.actual_cash) : null,
        difference: s.difference !== null ? Number(s.difference) : null,
        openedAt: s.opened_at,
        closedAt: s.closed_at,
        closedBy: s.closed_by,
        closedByName: s.closed_by_name,
        notes: s.notes,
      };
    }

    const shifts = PosDataSource.localShifts.get(organizationId) || [];
    const active = shifts.find(
      s => s.status === 'OPEN' && (!cashRegisterId || s.cashRegisterId === cashRegisterId)
    );
    return active ? { ...active } : null;
  }

  async getShifts(organizationId: string, limit: number = 20): Promise<CashShiftEntity[]> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('cash_shifts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('opened_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new ServerException(`Error al listar turnos: ${error.message}`);
      }

      return (data || []).map(s => ({
        id: s.id,
        organizationId: s.organization_id,
        cashRegisterId: s.cash_register_id,
        openedBy: s.opened_by,
        openedByName: s.opened_by_name,
        status: s.status,
        initialCash: Number(s.initial_cash),
        salesCashTotal: Number(s.sales_cash_total),
        salesDigitalTotal: Number(s.sales_digital_total),
        cashInTotal: Number(s.cash_in_total),
        cashOutTotal: Number(s.cash_out_total),
        expectedCash: Number(s.expected_cash),
        actualCash: s.actual_cash !== null ? Number(s.actual_cash) : null,
        difference: s.difference !== null ? Number(s.difference) : null,
        openedAt: s.opened_at,
        closedAt: s.closed_at,
        closedBy: s.closed_by,
        closedByName: s.closed_by_name,
        notes: s.notes,
      }));
    }

    const shifts = PosDataSource.localShifts.get(organizationId) || [];
    return [...shifts].reverse().slice(0, limit);
  }

  async openShift(params: OpenShiftParams): Promise<CashShiftEntity> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data: _data, error } = await client.rpc('open_cash_shift', {
        p_organization_id: params.organizationId,
        p_cash_register_id: params.cashRegisterId,
        p_user_id: params.userId,
        p_initial_cash: params.initialCash,
        p_notes: params.notes || null,
      });

      if (error) {
        throw new ServerException(error.message);
      }

      const active = await this.getActiveShift(params.organizationId, params.cashRegisterId);
      if (!active) {
        throw new ServerException('No se pudo recuperar el turno recién abierto.');
      }
      return active;
    }

    // Modo local / test
    const shifts = PosDataSource.localShifts.get(params.organizationId) || [];
    const openExists = shifts.some(
      s => s.cashRegisterId === params.cashRegisterId && s.status === 'OPEN'
    );
    if (openExists) {
      throw new ValidationException('Ya existe un turno de caja abierto para esta caja registradora.', 'status');
    }

    const newShift: CashShiftEntity = {
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      cashRegisterId: params.cashRegisterId,
      openedBy: params.userId,
      openedByName: 'Cajero Principal',
      status: 'OPEN',
      initialCash: params.initialCash,
      salesCashTotal: 0,
      salesDigitalTotal: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      expectedCash: params.initialCash,
      actualCash: null,
      difference: null,
      openedAt: new Date().toISOString(),
      closedAt: null,
      closedBy: null,
      closedByName: null,
      notes: params.notes || null,
    };

    shifts.push(newShift);
    PosDataSource.localShifts.set(params.organizationId, shifts);

    if (params.initialCash > 0) {
      const movements = PosDataSource.localMovements.get(newShift.id) || [];
      movements.push({
        id: crypto.randomUUID(),
        organizationId: params.organizationId,
        shiftId: newShift.id,
        movementType: 'CASH_IN',
        amount: params.initialCash,
        reason: 'Fondo inicial de apertura de caja',
        referenceId: null,
        paymentMethod: 'CASH',
        createdBy: params.userId,
        createdByName: 'Cajero',
        createdAt: new Date().toISOString(),
      });
      PosDataSource.localMovements.set(newShift.id, movements);
    }

    return newShift;
  }

  async closeShift(params: CloseShiftParams): Promise<CashShiftEntity> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client.rpc('close_cash_shift', {
        p_organization_id: params.organizationId,
        p_shift_id: params.shiftId,
        p_user_id: params.userId,
        p_actual_cash: params.actualCash,
        p_notes: params.notes || null,
      });

      if (error) {
        throw new ServerException(error.message);
      }

      const res = data as any;
      return {
        id: params.shiftId,
        organizationId: params.organizationId,
        cashRegisterId: '',
        openedBy: null,
        openedByName: '',
        status: 'CLOSED',
        initialCash: Number(res.initial_cash || 0),
        salesCashTotal: Number(res.sales_cash_total || 0),
        salesDigitalTotal: Number(res.sales_digital_total || 0),
        cashInTotal: Number(res.cash_in_total || 0),
        cashOutTotal: Number(res.cash_out_total || 0),
        expectedCash: Number(res.expected_cash || 0),
        actualCash: Number(res.actual_cash || 0),
        difference: Number(res.difference || 0),
        openedAt: '',
        closedAt: res.closed_at || new Date().toISOString(),
        closedBy: params.userId,
        closedByName: 'Cajero',
        notes: params.notes || null,
      };
    }

    const shifts = PosDataSource.localShifts.get(params.organizationId) || [];
    const shiftIndex = shifts.findIndex(s => s.id === params.shiftId);
    if (shiftIndex === -1) {
      throw new ValidationException('Turno de caja no encontrado.', 'shiftId');
    }

    const shift = shifts[shiftIndex];
    if (shift.status !== 'OPEN') {
      throw new ValidationException('El turno de caja ya se encuentra cerrado.', 'status');
    }

    const difference = params.actualCash - shift.expectedCash;
    const closedShift: CashShiftEntity = {
      ...shift,
      status: 'CLOSED',
      actualCash: params.actualCash,
      difference,
      closedAt: new Date().toISOString(),
      closedBy: params.userId,
      closedByName: 'Cajero',
      notes: params.notes || shift.notes,
    };

    shifts[shiftIndex] = closedShift;
    PosDataSource.localShifts.set(params.organizationId, shifts);
    return closedShift;
  }

  // ==========================================
  // MOVIMIENTOS DE CAJA
  // ==========================================

  async recordCashMovement(params: RecordCashMovementParams): Promise<CashMovementEntity> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client.rpc('record_cash_movement', {
        p_organization_id: params.organizationId,
        p_shift_id: params.shiftId,
        p_user_id: params.userId,
        p_movement_type: params.movementType,
        p_amount: params.amount,
        p_reason: params.reason,
        p_payment_method: params.paymentMethod || 'CASH',
      });

      if (error) {
        throw new ServerException(error.message);
      }

      const res = data as any;
      return {
        id: res.movement_id,
        organizationId: params.organizationId,
        shiftId: params.shiftId,
        movementType: params.movementType,
        amount: params.amount,
        reason: params.reason,
        referenceId: null,
        paymentMethod: params.paymentMethod || 'CASH',
        createdBy: params.userId,
        createdByName: 'Cajero',
        createdAt: new Date().toISOString(),
      };
    }

    const shifts = PosDataSource.localShifts.get(params.organizationId) || [];
    const shift = shifts.find(s => s.id === params.shiftId);
    if (!shift || shift.status !== 'OPEN') {
      throw new ValidationException('El turno no existe o está cerrado.', 'shiftId');
    }

    if (params.movementType === 'CASH_OUT' && params.amount > shift.expectedCash) {
      throw new ValidationException(
        `Fondos insuficientes en caja. (Disponible: ${shift.expectedCash}, Solicitado: ${params.amount})`,
        'amount'
      );
    }

    const movement: CashMovementEntity = {
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      shiftId: params.shiftId,
      movementType: params.movementType,
      amount: params.amount,
      reason: params.reason,
      referenceId: null,
      paymentMethod: params.paymentMethod || 'CASH',
      createdBy: params.userId,
      createdByName: 'Cajero',
      createdAt: new Date().toISOString(),
    };

    if (params.movementType === 'CASH_IN') {
      shift.cashInTotal += params.amount;
      shift.expectedCash += params.amount;
    } else if (params.movementType === 'CASH_OUT') {
      shift.cashOutTotal += params.amount;
      shift.expectedCash -= params.amount;
    }

    const movements = PosDataSource.localMovements.get(params.shiftId) || [];
    movements.push(movement);
    PosDataSource.localMovements.set(params.shiftId, movements);

    return movement;
  }

  async getShiftMovements(shiftId: string): Promise<CashMovementEntity[]> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('cash_movements')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new ServerException(`Error al consultar movimientos: ${error.message}`);
      }

      return (data || []).map(m => ({
        id: m.id,
        organizationId: m.organization_id,
        shiftId: m.shift_id,
        movementType: m.movement_type as any,
        amount: Number(m.amount),
        reason: m.reason,
        referenceId: m.reference_id,
        paymentMethod: m.payment_method,
        createdBy: m.created_by,
        createdByName: m.created_by_name,
        createdAt: m.created_at,
      }));
    }

    return PosDataSource.localMovements.get(shiftId) || [];
  }

  // ==========================================
  // PROCESO ATÓMICO DE VENTA POS
  // ==========================================

  async processSale(request: PosSaleRequest): Promise<PosSaleResult> {
    // 1. Verificar idempotencia
    if (request.idempotencyKey) {
      const cached = PosDataSource.localIdempotency.get(request.idempotencyKey);
      if (cached) {
        return cached;
      }
    }

    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client.rpc('process_pos_sale', {
        p_organization_id: request.organizationId,
        p_cash_register_id: request.cashRegisterId,
        p_shift_id: request.shiftId,
        p_user_id: request.userId,
        p_customer_id: request.customer?.id || null,
        p_customer_name: request.customer?.name || null,
        p_customer_phone: request.customer?.phone || null,
        p_customer_document: request.customer?.document || null,
        p_items: request.items.map(it => ({
          product_id: it.productId,
          product_name: it.productName,
          quantity: it.quantity,
          unit_price: it.unitPrice,
        })),
        p_payment_method: request.paymentMethod,
        p_cash_received: request.cashReceived || 0.00,
        p_discount: request.discount || 0.00,
        p_tax_rate: request.taxRate || 0.00,
        p_document_type: request.documentType || 'TICKET',
        p_idempotency_key: request.idempotencyKey || null,
        p_notes: request.notes || null,
      });

      if (error) {
        throw new ServerException(error.message);
      }

      const res = data as any;
      const result: PosSaleResult = {
        success: true,
        orderId: res.order_id,
        orderNumber: res.order_number,
        receiptId: res.receipt_id,
        receiptNumber: res.receipt_number,
        documentType: res.document_type,
        subtotal: Number(res.subtotal),
        discount: Number(res.discount),
        taxAmount: Number(res.tax_amount),
        total: Number(res.total),
        paymentMethod: res.payment_method,
        cashReceived: Number(res.cash_received),
        cashChange: Number(res.cash_change),
        customerName: res.customer_name,
        shiftId: res.shift_id,
        issuedAt: res.issued_at,
      };

      if (request.idempotencyKey) {
        PosDataSource.localIdempotency.set(request.idempotencyKey, result);
      }

      return result;
    }

    // ==========================================
    // MODO LOCAL / TEST: TRANSACCIÓN ATÓMICA FIEL
    // ==========================================

    // 1. Validar turno abierto
    const shifts = PosDataSource.localShifts.get(request.organizationId) || [];
    const shift = shifts.find(s => s.id === request.shiftId && s.status === 'OPEN');
    if (!shift) {
      throw new ValidationException('No se puede procesar la venta: La caja se encuentra CERRADA.', 'shiftId');
    }

    // 2. Calcular importes
    let subtotal = 0;
    for (const item of request.items) {
      subtotal += item.quantity * item.unitPrice;
    }
    const discount = Math.max(0, request.discount || 0);
    const taxRate = Math.max(0, request.taxRate || 0);
    const taxableBase = Math.max(0, subtotal - discount);
    const taxAmount = Math.round(taxableBase * taxRate * 100) / 100;
    const total = taxableBase + taxAmount;

    // 3. Validar pagos y cambio
    let cashReceived = request.cashReceived || 0;
    let cashChange = 0;
    let cashPaid = 0;
    let digitalPaid = 0;

    if (request.paymentMethod === 'CASH') {
      if (cashReceived < total) {
        throw new ValidationException(
          `Efectivo recibido (S/ ${cashReceived.toFixed(2)}) insuficiente para pagar el total (S/ ${total.toFixed(2)}).`,
          'cashReceived'
        );
      }
      cashChange = cashReceived - total;
      cashPaid = total;
    } else {
      cashReceived = 0;
      cashChange = 0;
      digitalPaid = total;
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `#POS-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    // 4. Deducción atómica de inventario vía Kárdex oficial (Fase 12.1)
    if (this.deps?.deductStockFn) {
      const deductRes = await this.deps.deductStockFn({
        organizationId: request.organizationId,
        orderId,
        userId: request.userId,
        reason: `Venta en Mostrador POS ${orderNumber}`,
        items: request.items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
        })),
      });

      if (!deductRes.success) {
        throw new ValidationException(deductRes.message || 'Error al descontar inventario en Kárdex.', 'stock');
      }
    }

    // 5. Actualizar caja y registrar movimientos
    if (cashPaid > 0) {
      shift.salesCashTotal += cashPaid;
      shift.expectedCash += cashPaid;

      const movements = PosDataSource.localMovements.get(shift.id) || [];
      movements.push({
        id: crypto.randomUUID(),
        organizationId: request.organizationId,
        shiftId: shift.id,
        movementType: 'SALE_CASH',
        amount: cashPaid,
        reason: `Venta POS ${orderNumber}`,
        referenceId: orderId,
        paymentMethod: 'CASH',
        createdBy: request.userId,
        createdByName: 'Cajero',
        createdAt: new Date().toISOString(),
      });
      PosDataSource.localMovements.set(shift.id, movements);
    }

    if (digitalPaid > 0) {
      shift.salesDigitalTotal += digitalPaid;

      const movements = PosDataSource.localMovements.get(shift.id) || [];
      movements.push({
        id: crypto.randomUUID(),
        organizationId: request.organizationId,
        shiftId: shift.id,
        movementType: 'SALE_DIGITAL',
        amount: digitalPaid,
        reason: `Venta POS Digital ${orderNumber} (${request.paymentMethod})`,
        referenceId: orderId,
        paymentMethod: request.paymentMethod,
        createdBy: request.userId,
        createdByName: 'Cajero',
        createdAt: new Date().toISOString(),
      });
      PosDataSource.localMovements.set(shift.id, movements);
    }

    // 6. Generar comprobante con serie y correlativo
    const docType = request.documentType || 'TICKET';
    const seriesPrefix = docType === 'BOLETA' ? 'B001' : docType === 'FACTURA' ? 'F001' : 'T001';
    const counterKey = `${request.organizationId}-${seriesPrefix}`;
    const nextNum = (PosDataSource.localReceiptCounters.get(counterKey) || 0) + 1;
    PosDataSource.localReceiptCounters.set(counterKey, nextNum);

    const fullNumber = `${seriesPrefix}-${String(nextNum).padStart(6, '0')}`;
    const receiptId = crypto.randomUUID();

    const receipt: SalesReceiptEntity = {
      id: receiptId,
      organizationId: request.organizationId,
      orderId,
      cashShiftId: shift.id,
      documentType: docType,
      series: seriesPrefix,
      number: nextNum,
      fullNumber,
      customerName: request.customer?.name || 'Público General',
      customerDocument: request.customer?.document || null,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total,
      paymentMethod: request.paymentMethod,
      cashReceived,
      cashChange,
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
    };

    const receipts = PosDataSource.localReceipts.get(request.organizationId) || [];
    receipts.push(receipt);
    PosDataSource.localReceipts.set(request.organizationId, receipts);

    const result: PosSaleResult = {
      success: true,
      orderId,
      orderNumber,
      receiptId,
      receiptNumber: fullNumber,
      documentType: docType,
      subtotal,
      discount,
      taxAmount,
      total,
      paymentMethod: request.paymentMethod,
      cashReceived,
      cashChange,
      customerName: request.customer?.name || 'Público General',
      shiftId: shift.id,
      issuedAt: receipt.issuedAt,
    };

    if (request.idempotencyKey) {
      PosDataSource.localIdempotency.set(request.idempotencyKey, result);
    }

    return result;
  }

  async getReceiptById(receiptId: string): Promise<SalesReceiptEntity | null> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('sales_receipts')
        .select('*')
        .eq('id', receiptId)
        .single();

      if (error) {
        throw new ServerException(`Error al consultar comprobante: ${error.message}`);
      }

      if (!data) return null;
      return {
        id: data.id,
        organizationId: data.organization_id,
        orderId: data.order_id,
        cashShiftId: data.cash_shift_id,
        documentType: data.document_type,
        series: data.series,
        number: data.number,
        fullNumber: data.full_number,
        customerName: data.customer_name,
        customerDocument: data.customer_document,
        subtotal: Number(data.subtotal),
        discount: Number(data.discount),
        taxRate: Number(data.tax_rate),
        taxAmount: Number(data.tax_amount),
        total: Number(data.total),
        paymentMethod: data.payment_method,
        cashReceived: Number(data.cash_received),
        cashChange: Number(data.cash_change),
        status: data.status,
        issuedAt: data.issued_at,
      };
    }

    for (const list of PosDataSource.localReceipts.values()) {
      const found = list.find(r => r.id === receiptId);
      if (found) return { ...found };
    }
    return null;
  }

  async getReceiptsByShift(shiftId: string): Promise<SalesReceiptEntity[]> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('sales_receipts')
        .select('*')
        .eq('cash_shift_id', shiftId)
        .order('issued_at', { ascending: false });

      if (error) {
        throw new ServerException(`Error al consultar comprobantes del turno: ${error.message}`);
      }

      return (data || []).map(r => ({
        id: r.id,
        organizationId: r.organization_id,
        orderId: r.order_id,
        cashShiftId: r.cash_shift_id,
        documentType: r.document_type,
        series: r.series,
        number: r.number,
        fullNumber: r.full_number,
        customerName: r.customer_name,
        customerDocument: r.customer_document,
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        taxRate: Number(r.tax_rate),
        taxAmount: Number(r.tax_amount),
        total: Number(r.total),
        paymentMethod: r.payment_method,
        cashReceived: Number(r.cash_received),
        cashChange: Number(r.cash_change),
        status: r.status,
        issuedAt: r.issued_at,
      }));
    }

    const results: SalesReceiptEntity[] = [];
    for (const list of PosDataSource.localReceipts.values()) {
      results.push(...list.filter(r => r.cashShiftId === shiftId));
    }
    return results;
  }

  /**
   * Limpiar estado local para propósitos de pruebas unitarias
   */
  static resetLocalStores(): void {
    PosDataSource.localRegisters.clear();
    PosDataSource.localShifts.clear();
    PosDataSource.localMovements.clear();
    PosDataSource.localReceipts.clear();
    PosDataSource.localReceiptCounters.clear();
    PosDataSource.localIdempotency.clear();
  }
}
