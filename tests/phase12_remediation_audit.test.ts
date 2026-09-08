import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InventoryMovementEntity,
  InventoryRepository,
  DeductStockUseCase,
  RestoreStockUseCase,
  AdjustInventoryUseCase,
  GetInventoryLedgerUseCase,
  GetCurrentStockUseCase,
  InventoryPermissions,
} from '../src/features/inventory';
import { InventoryDataSource } from '../src/features/inventory/data/datasources/inventory_datasource';
import { InventoryRepositoryImpl } from '../src/features/inventory/data/repositories/inventory_repository_impl';
import { ValidationException, UnauthorizedException } from '../src/core/errors/app_exceptions';
import { supabaseService } from '../src/core/network/supabase_client';

describe('FASE 12.1 — REMEDIACIÓN FORENSE Y AUDITORÍA DE INVENTARIO Y KÁRDEX', () => {
  const ORG_ID = 'org-tenant-remediation-1';
  const PROD_ID = 'prod-burger-deluxe';

  let localDataSource: InventoryDataSource;
  let repo: InventoryRepository;
  let adjustUseCase: AdjustInventoryUseCase;
  let deductUseCase: DeductStockUseCase;
  let restoreUseCase: RestoreStockUseCase;
  let getLedgerUseCase: GetInventoryLedgerUseCase;

  const mockProductStore = new Map<string, {
    stock: number;
    name: string;
    costPrice: number;
    trackInventory: boolean;
    allowNegativeStock: boolean;
  }>();

  beforeEach(() => {
    mockProductStore.clear();
    mockProductStore.set(PROD_ID, {
      stock: 50,
      name: 'Burger Deluxe',
      costPrice: 15.5,
      trackInventory: true,
      allowNegativeStock: false,
    });

    localDataSource = new InventoryDataSource();
    repo = new InventoryRepositoryImpl(localDataSource, {
      getProductStockFn: (id) => mockProductStore.get(id) || { stock: 0, name: 'Unknown', costPrice: 0 },
      updateProductStockFn: (id, newStock, newCost) => {
        const p = mockProductStore.get(id);
        if (p) {
          p.stock = newStock;
          if (newCost !== undefined && newCost > 0) p.costPrice = newCost;
        }
      },
    });

    adjustUseCase = new AdjustInventoryUseCase(repo);
    deductUseCase = new DeductStockUseCase(repo);
    restoreUseCase = new RestoreStockUseCase(repo);
    getLedgerUseCase = new GetInventoryLedgerUseCase(repo);
  });

  describe('CRIT-01: Control de Acceso Basado en Roles (RBAC) en Ajustes de Inventario', () => {
    it('debe permitir ajustes a roles autorizados (OWNER y ADMIN)', async () => {
      const movementOwner = await adjustUseCase.execute({
        organizationId: ORG_ID,
        productId: PROD_ID,
        movementType: 'ADJUSTMENT',
        quantity: 10,
        direction: 'IN',
        reason: 'Ajuste de inventario por conteo físico',
        userRole: 'OWNER',
      });

      expect(movementOwner).toBeDefined();
      expect(movementOwner.stockAfter).toBe(60);

      const movementAdmin = await adjustUseCase.execute({
        organizationId: ORG_ID,
        productId: PROD_ID,
        movementType: 'PURCHASE',
        quantity: 20,
        unitCost: 14.0,
        reason: 'Ingreso por compra a proveedor',
        userRole: 'ADMIN',
      });

      expect(movementAdmin).toBeDefined();
      expect(movementAdmin.stockAfter).toBe(80);
    });

    it('debe rechazar ajustes ejecutados por roles no autorizados (CLIENT, GUEST)', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'ADJUSTMENT',
          quantity: 10,
          reason: 'Intento de manipulación de inventario por cliente',
          userRole: 'CLIENT',
        })
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'PURCHASE',
          quantity: 5,
          reason: 'Intento de ingreso sin privilegios',
          userRole: 'GUEST',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar modificación de costo de adquisición por roles sin permiso (STAFF)', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'PURCHASE',
          quantity: 5,
          unitCost: 25.0, // Modificación de costo
          reason: 'Ingreso intentando alterar costo',
          userRole: 'STAFF',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('CRIT-02 & Integridad Transaccional: Deducción Atómica e Idempotente', () => {
    it('debe descontar stock atómicamente y registrar movimiento SALE inmutable', async () => {
      const orderId = 'order-crit02-001';
      const res = await deductUseCase.execute({
        organizationId: ORG_ID,
        orderId,
        items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 5 }],
      });

      expect(res.success).toBe(true);
      expect(res.idempotent).toBe(false);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(45);

      const movements = await getLedgerUseCase.execute(ORG_ID);
      expect(movements.length).toBe(1);
      expect(movements[0].movementType).toBe('SALE');
      expect(movements[0].quantity).toBe(5);
      expect(movements[0].stockBefore).toBe(50);
      expect(movements[0].stockAfter).toBe(45);
      expect(movements[0].referenceId).toBe(orderId);
    });

    it('debe ser estrictamente idempotente si se reintenta la misma orden', async () => {
      const orderId = 'order-crit02-idempotent';
      const first = await deductUseCase.execute({
        organizationId: ORG_ID,
        orderId,
        items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 10 }],
      });
      expect(first.idempotent).toBe(false);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(40);

      const retry = await deductUseCase.execute({
        organizationId: ORG_ID,
        orderId,
        items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 10 }],
      });
      expect(retry.idempotent).toBe(true);
      expect(retry.itemsProcessed).toBe(0);
      // El stock NO debe descontarse dos veces
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(40);
    });

    it('debe revertir de forma compensatoria e idempotente al cancelar un pedido', async () => {
      const orderId = 'order-crit02-revert';
      await deductUseCase.execute({
        organizationId: ORG_ID,
        orderId,
        items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 8 }],
      });
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(42);

      const restoreRes = await restoreUseCase.execute({
        organizationId: ORG_ID,
        orderId,
      });
      expect(restoreRes.success).toBe(true);
      expect(restoreRes.idempotent).toBe(false);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(50);

      // Reintento de reversión no debe duplicar stock
      const doubleRestore = await restoreUseCase.execute({
        organizationId: ORG_ID,
        orderId,
      });
      expect(doubleRestore.idempotent).toBe(true);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(50);
    });
  });

  describe('HIGH-01: Prevención de Bypass del Kárdex', () => {
    it('no debe permitir editar directamente el stock sin registrar movimiento en Kárdex', async () => {
      // Intentar forzar ajuste sin razón válida debe ser rechazado
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'ADJUSTMENT',
          quantity: 20,
          reason: 'ab', // Motivo muy corto (< 3 caracteres)
          userRole: 'ADMIN',
        })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('HIGH-02: Salidas/Mermas con Cantidad Positiva y Semántica de Dirección', () => {
    it('debe rechazar cantidades negativas en la llamada de ajuste', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'ADJUSTMENT',
          quantity: -10, // Cantidad negativa no permitida
          reason: 'Merma por producto caducado',
          userRole: 'ADMIN',
        })
      ).rejects.toThrow(ValidationException);
    });

    it('debe procesar mermas correctamente utilizando cantidad positiva y direction="OUT"', async () => {
      const movement = await adjustUseCase.execute({
        organizationId: ORG_ID,
        productId: PROD_ID,
        movementType: 'ADJUSTMENT',
        quantity: 15,
        direction: 'OUT',
        reason: 'Merma por merma de almacén',
        userRole: 'ADMIN',
      });

      expect(movement.quantity).toBe(15);
      expect(movement.stockBefore).toBe(50);
      expect(movement.stockAfter).toBe(35);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(35);
    });
  });

  describe('HIGH-03: Control de Stock Negativo y Parámetro allow_negative_stock', () => {
    it('debe bloquear operaciones que generen stock negativo si allow_negative_stock es falso', async () => {
      await expect(
        deductUseCase.execute({
          organizationId: ORG_ID,
          orderId: 'order-overflow',
          items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 999 }],
        })
      ).rejects.toThrow(ValidationException);

      await expect(
        adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'ADJUSTMENT',
          quantity: 100,
          direction: 'OUT',
          reason: 'Ajuste excesivo hacia abajo',
          userRole: 'ADMIN',
        })
      ).rejects.toThrow(ValidationException);
    });

    it('debe permitir stock negativo si allow_negative_stock es verdadero en el producto', async () => {
      const prod = mockProductStore.get(PROD_ID)!;
      prod.allowNegativeStock = true;

      const movement = await adjustUseCase.execute({
        organizationId: ORG_ID,
        productId: PROD_ID,
        movementType: 'ADJUSTMENT',
        quantity: 60,
        direction: 'OUT',
        reason: 'Venta con stock negativo permitido',
        userRole: 'ADMIN',
      });

      expect(movement.stockAfter).toBe(-10);
      expect(mockProductStore.get(PROD_ID)?.stock).toBe(-10);
    });
  });

  describe('MED-01: Registro de Carga Inicial (INITIAL_LOAD) en Creación de Producto', () => {
    it('debe permitir y registrar movimientos de tipo INITIAL_LOAD', async () => {
      const initLoad = await adjustUseCase.execute({
        organizationId: ORG_ID,
        productId: PROD_ID,
        movementType: 'INITIAL_LOAD',
        quantity: 100,
        unitCost: 12.5,
        reason: 'Carga inicial de inventario de apertura',
        userRole: 'OWNER',
      });

      expect(initLoad.movementType).toBe('INITIAL_LOAD');
      expect(initLoad.quantity).toBe(100);
      expect(initLoad.stockAfter).toBe(150);
      expect(initLoad.unitCost).toBe(12.5);
    });
  });

  describe('LOW-02: Paginación y Filtrado en Consulta del Libro Mayor', () => {
    it('debe soportar limit y offset para paginación de movimientos', async () => {
      // Registrar 5 movimientos
      for (let i = 1; i <= 5; i++) {
        await adjustUseCase.execute({
          organizationId: ORG_ID,
          productId: PROD_ID,
          movementType: 'PURCHASE',
          quantity: i * 2,
          reason: `Compra lote #${i}`,
          userRole: 'ADMIN',
        });
      }

      const page1 = await getLedgerUseCase.execute(ORG_ID, { limit: 2, offset: 0 });
      expect(page1.length).toBe(2);

      const page2 = await getLedgerUseCase.execute(ORG_ID, { limit: 2, offset: 2 });
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);

      const purchasesOnly = await getLedgerUseCase.execute(ORG_ID, { movementType: 'PURCHASE' });
      expect(purchasesOnly.every(m => m.movementType === 'PURCHASE')).toBe(true);
    });
  });

  describe('Integridad Estricta: Prohibición de Fallbacks Silenciosos en Supabase', () => {
    it('debe propagar excepciones explícitas cuando la llamada a RPC falla en Supabase', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'relation "inventory_movements" does not exist' },
      });

      const isConfiguredSpy = vi.spyOn(supabaseService, 'isConfigured', 'get').mockReturnValue(true);
      const getClientSpy = vi.spyOn(supabaseService, 'getClient').mockReturnValue({
        rpc: mockRpc,
      } as any);

      try {
        const strictDs = new InventoryDataSource();

        await expect(
          strictDs.deductOrderStock({
            organizationId: ORG_ID,
            orderId: 'order-fail',
            items: [{ productId: PROD_ID, productName: 'Burger Deluxe', quantity: 5 }],
          })
        ).rejects.toThrow('relation "inventory_movements" does not exist');
      } finally {
        isConfiguredSpy.mockRestore();
        getClientSpy.mockRestore();
      }
    });
  });
});
