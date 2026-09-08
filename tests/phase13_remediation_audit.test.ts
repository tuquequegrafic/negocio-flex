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

describe('FASE 13.1 — REMEDIACIÓN FORENSE: POS, CAJAS, PAGOS Y COMPROBANTES', () => {
  const orgA = 'org-tenant-a-111';
  const orgB = 'org-tenant-b-222';
  const userIdA = 'user-cashier-a';
  const userIdB = 'user-cashier-b';

  let stockMock: Map<string, number>;
  let deductCalls: any[];

  beforeEach(() => {
    PosDataSource.resetLocalStores();
    stockMock = new Map([
      ['prod-espresso', 100],
      ['prod-croissant', 50],
    ]);
    deductCalls = [];
  });

  const setupTestEnvironment = () => {
    const dataSource = new PosDataSource({
      deductStockFn: async (params: any) => {
        deductCalls.push(params);
        for (const item of params.items) {
          const current = stockMock.get(item.productId) ?? 0;
          if (current < item.quantity) {
            return {
              success: false,
              message: `Stock insuficiente para ${item.productName}.`,
            };
          }
          stockMock.set(item.productId, current - item.quantity);
        }
        return { success: true };
      },
    });

    const shiftRepo = new CashShiftRepositoryImpl(dataSource);
    const posRepo = new PosRepositoryImpl(dataSource);

    return {
      dataSource,
      shiftRepo,
      posRepo,
      getRegistersUseCase: new GetCashRegistersUseCase(shiftRepo),
      openShiftUseCase: new OpenCashShiftUseCase(shiftRepo),
      closeShiftUseCase: new CloseCashShiftUseCase(shiftRepo),
      recordMovementUseCase: new RecordCashMovementUseCase(shiftRepo),
      getActiveShiftUseCase: new GetActiveCashShiftUseCase(shiftRepo),
      processSaleUseCase: new ProcessPosSaleUseCase(posRepo),
    };
  };

  describe('1. REMEDIACIÓN CRIT-01: Discrepancia de Casing y Roles RBAC en POS', () => {
    it('debe autorizar roles canónicos en minúsculas (owner, admin, staff, super_admin)', () => {
      // Validación con roles en minúsculas (formato real de organization_members)
      expect(PosPermissions.canOperatePos('owner')).toBe(true);
      expect(PosPermissions.canOperatePos('admin')).toBe(true);
      expect(PosPermissions.canOperatePos('staff')).toBe(true);
      expect(PosPermissions.canOperatePos('super_admin')).toBe(true);

      // Cierre de turno y arqueo
      expect(PosPermissions.canCloseShift('owner')).toBe(true);
      expect(PosPermissions.canCloseShift('admin')).toBe(true);
      expect(PosPermissions.canCloseShift('staff')).toBe(true);
      expect(PosPermissions.canCloseShift('super_admin')).toBe(true);

      // Gestión y configuración de terminales (exclusivo owner/admin/super_admin)
      expect(PosPermissions.canManageRegisters('owner')).toBe(true);
      expect(PosPermissions.canManageRegisters('admin')).toBe(true);
      expect(PosPermissions.canManageRegisters('super_admin')).toBe(true);
      expect(PosPermissions.canManageRegisters('staff')).toBe(false);
    });

    it('debe denegar estrictamente a viewer y roles no autorizados', () => {
      expect(PosPermissions.canOperatePos('viewer')).toBe(false);
      expect(PosPermissions.canOperatePos('customer')).toBe(false);
      expect(PosPermissions.canOperatePos(null)).toBe(false);
      expect(PosPermissions.canOperatePos(undefined)).toBe(false);

      expect(PosPermissions.canCloseShift('viewer')).toBe(false);
      expect(PosPermissions.canManageRegisters('viewer')).toBe(false);
    });

    it('debe ser insensible a mayúsculas/minúsculas sin fallos por casing (OWNER vs owner)', () => {
      expect(PosPermissions.canOperatePos('OWNER')).toBe(true);
      expect(PosPermissions.canOperatePos('Owner')).toBe(true);
      expect(PosPermissions.canOperatePos('ADMIN')).toBe(true);
      expect(PosPermissions.canOperatePos('Staff')).toBe(true);
    });
  });

  describe('2. REMEDIACIÓN HIGH-01: Concurrencia en Cliente Anónimo (000000000)', () => {
    it('debe permitir múltiples ventas simultáneas para el cliente anónimo sin colisiones', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase } = setupTestEnvironment();

      const registers = await getRegistersUseCase.execute(orgA);
      const shift = await openShiftUseCase.execute({
        organizationId: orgA,
        cashRegisterId: registers[0].id,
        userId: userIdA,
        initialCash: 100.00,
      });

      // Simulación de dos ventas concurrentes procesadas por dos clientes sin identificar
      const sale1Promise = processSaleUseCase.execute({
        organizationId: orgA,
        cashRegisterId: registers[0].id,
        shiftId: shift.id,
        userId: userIdA,
        customer: { name: 'Público General', phone: '000000000' },
        items: [{ productId: 'prod-espresso', productName: 'Espresso', quantity: 1, unitPrice: 10.00 }],
        paymentMethod: 'CASH',
        cashReceived: 10.00,
      });

      const sale2Promise = processSaleUseCase.execute({
        organizationId: orgA,
        cashRegisterId: registers[0].id,
        shiftId: shift.id,
        userId: userIdA,
        customer: { name: 'Público General', phone: '000000000' },
        items: [{ productId: 'prod-croissant', productName: 'Croissant', quantity: 2, unitPrice: 7.50 }],
        paymentMethod: 'CASH',
        cashReceived: 20.00,
      });

      const [res1, res2] = await Promise.all([sale1Promise, sale2Promise]);

      expect(res1.orderId).toBeDefined();
      expect(res2.orderId).toBeDefined();
      expect(res1.orderId).not.toBe(res2.orderId);
      expect(res1.receiptNumber).toMatch(/^T001-\d{6}$/);
      expect(res2.receiptNumber).toMatch(/^T001-\d{6}$/);
      expect(res1.customerName).toBe('Público General');
      expect(res2.customerName).toBe('Público General');

      // Ambas deducciones de inventario se aplicaron correctamente
      expect(stockMock.get('prod-espresso')).toBe(99);
      expect(stockMock.get('prod-croissant')).toBe(48);
    });
  });

  describe('3. REMEDIACIÓN LOW-01: Exclusión Mutua en Apertura de Turnos (FOR UPDATE)', () => {
    it('debe impedir estrictamente la apertura de dos turnos simultáneos en la misma caja', async () => {
      const { getRegistersUseCase, openShiftUseCase } = setupTestEnvironment();

      const registers = await getRegistersUseCase.execute(orgA);
      const regId = registers[0].id;

      // Apertura del primer turno
      const shift1 = await openShiftUseCase.execute({
        organizationId: orgA,
        cashRegisterId: regId,
        userId: userIdA,
        initialCash: 150.00,
      });
      expect(shift1.status).toBe('OPEN');

      // Segundo intento de apertura sobre la misma caja
      await expect(
        openShiftUseCase.execute({
          organizationId: orgA,
          cashRegisterId: regId,
          userId: userIdA,
          initialCash: 50.00,
        })
      ).rejects.toThrow(/Ya existe un turno de caja abierto/);
    });

    it('permite abrir turnos en cajas diferentes de la misma organización simultáneamente', async () => {
      const { getRegistersUseCase, openShiftUseCase } = setupTestEnvironment();

      const registers = await getRegistersUseCase.execute(orgA);
      if (registers.length >= 2) {
        const shift1 = await openShiftUseCase.execute({
          organizationId: orgA,
          cashRegisterId: registers[0].id,
          userId: userIdA,
          initialCash: 100.00,
        });

        const shift2 = await openShiftUseCase.execute({
          organizationId: orgA,
          cashRegisterId: registers[1].id,
          userId: userIdA,
          initialCash: 120.00,
        });

        expect(shift1.status).toBe('OPEN');
        expect(shift2.status).toBe('OPEN');
        expect(shift1.cashRegisterId).not.toBe(shift2.cashRegisterId);
      }
    });
  });

  describe('4. REMEDIACIÓN MED-01 & Aislamiento Multi-Tenant', () => {
    it('debe aislar los turnos, cajas y movimientos entre Organizaciones distintas', async () => {
      const { getRegistersUseCase, openShiftUseCase, getActiveShiftUseCase } = setupTestEnvironment();

      const regsA = await getRegistersUseCase.execute(orgA);
      const regsB = await getRegistersUseCase.execute(orgB);

      // Cajas de orgA y orgB son independientes
      expect(regsA[0].id).not.toBe(regsB[0].id);

      // Abrir turno en orgA
      await openShiftUseCase.execute({
        organizationId: orgA,
        cashRegisterId: regsA[0].id,
        userId: userIdA,
        initialCash: 80.00,
      });

      // orgA tiene turno activo
      const activeA = await getActiveShiftUseCase.execute(orgA);
      expect(activeA).not.toBeNull();
      expect(activeA?.organizationId).toBe(orgA);

      // orgB NO tiene turno activo
      const activeB = await getActiveShiftUseCase.execute(orgB);
      expect(activeB).toBeNull();
    });
  });

  describe('5. Idempotencia Rigurosa de Ventas POS', () => {
    it('debe devolver la venta existente y no descontar stock duplicado si se repite la clave', async () => {
      const { getRegistersUseCase, openShiftUseCase, processSaleUseCase } = setupTestEnvironment();

      const registers = await getRegistersUseCase.execute(orgA);
      const shift = await openShiftUseCase.execute({
        organizationId: orgA,
        cashRegisterId: registers[0].id,
        userId: userIdA,
        initialCash: 50.00,
      });

      const params = {
        organizationId: orgA,
        cashRegisterId: registers[0].id,
        shiftId: shift.id,
        userId: userIdA,
        items: [{ productId: 'prod-espresso', productName: 'Espresso', quantity: 2, unitPrice: 12.00 }],
        paymentMethod: 'CASH' as const,
        cashReceived: 30.00,
        idempotencyKey: 'idem-key-remediation-test-777',
      };

      const sale1 = await processSaleUseCase.execute(params);
      expect(stockMock.get('prod-espresso')).toBe(98);

      // Repetición idéntica
      const sale2 = await processSaleUseCase.execute(params);
      expect(sale2.orderId).toBe(sale1.orderId);
      expect(sale2.receiptNumber).toBe(sale1.receiptNumber);

      // El stock permanece inalterado (no se dedujo dos veces)
      expect(stockMock.get('prod-espresso')).toBe(98);
      expect(deductCalls.length).toBe(1);
    });
  });
});
