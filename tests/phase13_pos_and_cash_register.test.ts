import { describe, it, expect, beforeEach } from 'vitest';
import {
  PosDataSource,
  CashShiftRepositoryImpl,
  PosRepositoryImpl,
  OpenCashShiftUseCase,
  CloseCashShiftUseCase,
  RecordCashMovementUseCase,
  GetActiveCashShiftUseCase,
  GetCashRegistersUseCase,
  ProcessPosSaleUseCase,
  PosPermissions,
} from '../src/features/pos';
import { ValidationException } from '../src/core/errors/app_exceptions';

describe('FASE 13 - POS + CAJAS + PAGOS + COMPROBANTES', () => {
  const orgId = 'org-test-pos-123';
  const userId = 'user-cashier-456';
  let registerId: string;

  // Mock de inventario kárdex (Fase 12.1)
  let stockMock: Map<string, number>;
  let deductStockCalls: any[];

  beforeEach(() => {
    PosDataSource.resetLocalStores();
    stockMock = new Map([
      ['prod-1', 50],
      ['prod-2', 5],
    ]);
    deductStockCalls = [];
  });

  const createDependencies = () => ({
    deductStockFn: async (params: any) => {
      deductStockCalls.push(params);
      for (const item of params.items) {
        const current = stockMock.get(item.productId) ?? 0;
        if (current < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para producto ${item.productName}. (Disponible: ${current}, Solicitado: ${item.quantity})`,
          };
        }
        stockMock.set(item.productId, current - item.quantity);
      }
      return { success: true };
    },
  });

  const setupServices = () => {
    const deps = createDependencies();
    const dataSource = new PosDataSource(deps);
    const shiftRepo = new CashShiftRepositoryImpl(dataSource);
    const posRepo = new PosRepositoryImpl(dataSource);

    return {
      dataSource,
      shiftRepo,
      posRepo,
      openShiftUseCase: new OpenCashShiftUseCase(shiftRepo),
      closeShiftUseCase: new CloseCashShiftUseCase(shiftRepo),
      recordMovementUseCase: new RecordCashMovementUseCase(shiftRepo),
      getActiveShiftUseCase: new GetActiveCashShiftUseCase(shiftRepo),
      getRegistersUseCase: new GetCashRegistersUseCase(shiftRepo),
      processSaleUseCase: new ProcessPosSaleUseCase(posRepo),
    };
  };

  describe('1. Ciclo de Vida de Cajas y Turnos (Cash Shifts)', () => {
    it('debe listar o crear cajas registradoras para la organización', async () => {
      const { getRegistersUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      expect(registers.length).toBeGreaterThanOrEqual(1);
      expect(registers[0].code).toBe('CAJA-01');

      // Crear segunda caja
      const newBox = await getRegistersUseCase.create(orgId, 'Caja Barra Express', 'CAJA-02');
      expect(newBox.code).toBe('CAJA-02');
      expect(newBox.name).toBe('Caja Barra Express');

      const all = await getRegistersUseCase.execute(orgId);
      expect(all.length).toBe(2);
    });

    it('debe abrir turno con fondo inicial y registrar movimiento inicial CASH_IN', async () => {
      const { getRegistersUseCase, openShiftUseCase, getActiveShiftUseCase, shiftRepo } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 150.00,
        notes: 'Apertura de turno matutino',
      });

      expect(shift.status).toBe('OPEN');
      expect(shift.initialCash).toBe(150.00);
      expect(shift.expectedCash).toBe(150.00);

      // Debe aparecer como turno activo
      const active = await getActiveShiftUseCase.execute(orgId, registerId);
      expect(active).not.toBeNull();
      expect(active?.id).toBe(shift.id);

      // Se debió registrar el movimiento de apertura
      const movements = await shiftRepo.getShiftMovements(shift.id);
      expect(movements.length).toBe(1);
      expect(movements[0].movementType).toBe('CASH_IN');
      expect(movements[0].amount).toBe(150.00);
    });

    it('debe prohibir abrir dos turnos concurrentes en la misma caja registradora', async () => {
      const { getRegistersUseCase, openShiftUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      // Intento de abrir segundo turno en la misma caja
      await expect(
        openShiftUseCase.execute({
          organizationId: orgId,
          cashRegisterId: registerId,
          userId: 'other-user',
          initialCash: 50.00,
        })
      ).rejects.toThrow(ValidationException);
    });

    it('debe cerrar el turno realizando el arqueo y calculando la diferencia', async () => {
      const { getRegistersUseCase, openShiftUseCase, closeShiftUseCase, getActiveShiftUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 200.00,
      });

      // Se cierra con arqueo físico de 205 (sobrante de S/ 5.00)
      const closed = await closeShiftUseCase.execute({
        organizationId: orgId,
        shiftId: shift.id,
        userId,
        actualCash: 205.00,
        notes: 'Arqueo conforme con sobrante de S/ 5',
      });

      expect(closed.status).toBe('CLOSED');
      expect(closed.expectedCash).toBe(200.00);
      expect(closed.actualCash).toBe(205.00);
      expect(closed.difference).toBe(5.00);
      expect(closed.closedAt).not.toBeNull();

      // Ya no debe haber turno activo en esa caja
      const active = await getActiveShiftUseCase.execute(orgId, registerId);
      expect(active).toBeNull();

      // No se puede cerrar dos veces
      await expect(
        closeShiftUseCase.execute({
          organizationId: orgId,
          shiftId: shift.id,
          userId,
          actualCash: 205.00,
        })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('2. Movimientos de Caja (CASH_IN / CASH_OUT)', () => {
    it('debe registrar entrada y salida de efectivo actualizando el saldo esperado', async () => {
      const { getRegistersUseCase, openShiftUseCase, recordMovementUseCase, shiftRepo } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      // Ingreso de efectivo adicional (S/ 50)
      await recordMovementUseCase.execute({
        organizationId: orgId,
        shiftId: shift.id,
        userId,
        movementType: 'CASH_IN',
        amount: 50.00,
        reason: 'Aporte de sencillo por administración',
      });

      // Retiro para compra de insumos (S/ 30)
      await recordMovementUseCase.execute({
        organizationId: orgId,
        shiftId: shift.id,
        userId,
        movementType: 'CASH_OUT',
        amount: 30.00,
        reason: 'Pago de hielo y bolsas',
      });

      const movements = await shiftRepo.getShiftMovements(shift.id);
      expect(movements.length).toBe(3); // Apertura + Entrada + Salida

      // Verificar totales acumulados en turno
      const currentShift = (await shiftRepo.getShifts(orgId))[0];
      expect(currentShift.initialCash).toBe(100.00);
      expect(currentShift.cashInTotal).toBe(50.00); // Ingreso adicional
      expect(currentShift.cashOutTotal).toBe(30.00);
      expect(currentShift.expectedCash).toBe(120.00); // 100 + 50 - 30
    });

    it('debe rechazar retiro CASH_OUT que supere el efectivo disponible en caja', async () => {
      const { getRegistersUseCase, openShiftUseCase, recordMovementUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 50.00,
      });

      // Intento de retirar S/ 100 cuando solo hay S/ 50
      await expect(
        recordMovementUseCase.execute({
          organizationId: orgId,
          shiftId: shift.id,
          userId,
          movementType: 'CASH_OUT',
          amount: 100.00,
          reason: 'Retiro excesivo',
        })
      ).rejects.toThrow(/Fondos insuficientes/);
    });
  });

  describe('3. Transacción Atómica de Venta POS con Deducción de Stock (Fase 12.1)', () => {
    it('debe procesar venta en efectivo: genera orden, descuenta stock kárdex, actualiza caja y crea comprobante', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase, shiftRepo, posRepo } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      const result = await processSaleUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        shiftId: shift.id,
        userId,
        customer: {
          name: 'Carlos Mendoza',
          document: '47891234',
        },
        items: [
          { productId: 'prod-1', productName: 'Café Espresso', quantity: 2, unitPrice: 15.00 },
        ],
        paymentMethod: 'CASH',
        cashReceived: 50.00, // Total = 30.00, cambio = 20.00
        documentType: 'BOLETA',
      });

      expect(result.success).toBe(true);
      expect(result.total).toBe(30.00);
      expect(result.cashReceived).toBe(50.00);
      expect(result.cashChange).toBe(20.00);
      expect(result.receiptNumber).toMatch(/^B001-\d{6}$/);

      // Verificar que el inventario Kárdex fue deducido (50 - 2 = 48)
      expect(stockMock.get('prod-1')).toBe(48);
      expect(deductStockCalls.length).toBe(1);

      // Verificar que el dinero en caja aumentó en S/ 30.00 (de 100 a 130)
      const currentShift = (await shiftRepo.getShifts(orgId))[0];
      expect(currentShift.salesCashTotal).toBe(30.00);
      expect(currentShift.expectedCash).toBe(130.00);

      // Verificar comprobante emitido
      const receipt = await posRepo.getReceiptById(result.receiptId);
      expect(receipt).not.toBeNull();
      expect(receipt?.customerName).toBe('Carlos Mendoza');
      expect(receipt?.total).toBe(30.00);
      expect(receipt?.status).toBe('ISSUED');
    });

    it('debe abortar la venta si el stock es insuficiente (Transacción Atómica)', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase, shiftRepo } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      // prod-2 solo tiene 5 unidades en stock. Solicitamos 10.
      await expect(
        processSaleUseCase.execute({
          organizationId: orgId,
          cashRegisterId: registerId,
          shiftId: shift.id,
          userId,
          items: [
            { productId: 'prod-2', productName: 'Torta de Chocolate', quantity: 10, unitPrice: 20.00 },
          ],
          paymentMethod: 'CASH',
          cashReceived: 200.00,
        })
      ).rejects.toThrow(/Stock insuficiente/);

      // El stock no debió cambiar
      expect(stockMock.get('prod-2')).toBe(5);

      // La caja no debió ser alterada
      const currentShift = (await shiftRepo.getShifts(orgId))[0];
      expect(currentShift.salesCashTotal).toBe(0);
      expect(currentShift.expectedCash).toBe(100.00);
    });

    it('debe procesar pagos digitales sin sumar al efectivo físico de la gaveta', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase, shiftRepo } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      const result = await processSaleUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        shiftId: shift.id,
        userId,
        items: [
          { productId: 'prod-1', productName: 'Café Espresso', quantity: 1, unitPrice: 15.00 },
        ],
        paymentMethod: 'YAPE',
        documentType: 'TICKET',
      });

      expect(result.success).toBe(true);
      expect(result.total).toBe(15.00);
      expect(result.paymentMethod).toBe('YAPE');

      // En caja: ventas digitales aumentan a 15, pero expectedCash (efectivo físico) sigue en 100
      const currentShift = (await shiftRepo.getShifts(orgId))[0];
      expect(currentShift.salesDigitalTotal).toBe(15.00);
      expect(currentShift.salesCashTotal).toBe(0);
      expect(currentShift.expectedCash).toBe(100.00);
    });

    it('debe rechazar ventas si la caja registradora está cerrada', async () => {
      const { getRegistersUseCase, processSaleUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      await expect(
        processSaleUseCase.execute({
          organizationId: orgId,
          cashRegisterId: registerId,
          shiftId: 'non-existent-or-closed-shift',
          userId,
          items: [
            { productId: 'prod-1', productName: 'Café Espresso', quantity: 1, unitPrice: 15.00 },
          ],
          paymentMethod: 'CASH',
          cashReceived: 20.00,
        })
      ).rejects.toThrow(/CERRADA/);
    });
  });

  describe('4. Idempotencia y Concurrencia de Venta', () => {
    it('debe responder con el mismo comprobante ante duplicación del idempotencyKey sin re-deducir stock', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase } = setupServices();
      const registers = await getRegistersUseCase.execute(orgId);
      registerId = registers[0].id;

      const shift = await openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: registerId,
        userId,
        initialCash: 100.00,
      });

      const saleParams = {
        organizationId: orgId,
        cashRegisterId: registerId,
        shiftId: shift.id,
        userId,
        items: [
          { productId: 'prod-1', productName: 'Café Espresso', quantity: 1, unitPrice: 15.00 },
        ],
        paymentMethod: 'CASH' as const,
        cashReceived: 20.00,
        idempotencyKey: 'tx-unique-pos-abc-999',
      };

      const result1 = await processSaleUseCase.execute(saleParams);
      expect(result1.receiptNumber).toMatch(/^T001-\d{6}$/);
      expect(stockMock.get('prod-1')).toBe(49);

      // Reenvío de la misma petición con el mismo idempotencyKey
      const result2 = await processSaleUseCase.execute(saleParams);
      expect(result2.orderId).toBe(result1.orderId);
      expect(result2.receiptId).toBe(result1.receiptId);
      expect(result2.receiptNumber).toBe(result1.receiptNumber);

      // El stock NO se descontó dos veces (sigue en 49)
      expect(stockMock.get('prod-1')).toBe(49);
    });
  });

  describe('5. Matriz RBAC de Permisos POS', () => {
    it('debe autorizar a OWNER, ADMIN y STAFF para operar en el punto de venta', () => {
      expect(PosPermissions.canOperatePos('OWNER')).toBe(true);
      expect(PosPermissions.canOperatePos('ADMIN')).toBe(true);
      expect(PosPermissions.canOperatePos('STAFF')).toBe(true);
      expect(PosPermissions.canOperatePos('SUPER_ADMIN')).toBe(true);
    });

    it('debe bloquear estrictamente a usuarios con rol VIEWER u otros no autorizados', () => {
      expect(PosPermissions.canOperatePos('VIEWER')).toBe(false);
      expect(PosPermissions.canOperatePos(null)).toBe(false);
      expect(PosPermissions.canOperatePos(undefined)).toBe(false);
      expect(PosPermissions.canOperatePos('GUEST')).toBe(false);

      expect(PosPermissions.canCloseShift('VIEWER')).toBe(false);
      expect(PosPermissions.canManageRegisters('STAFF')).toBe(false);
      expect(PosPermissions.canManageRegisters('VIEWER')).toBe(false);
    });
  });
});
