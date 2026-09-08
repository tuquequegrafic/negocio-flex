import { describe, it, expect, beforeEach } from 'vitest';
import {
  InventoryMovementEntity,
  InventoryRepository,
  DeductStockUseCase,
  RestoreStockUseCase,
  AdjustInventoryUseCase,
  GetInventoryLedgerUseCase,
  GetCurrentStockUseCase,
  DeductOrderStockParams,
  RestoreOrderStockParams,
  AdjustInventoryParams,
  DeductStockResult,
  RestoreStockResult,
  InventoryPermissions
} from '../src/features/inventory';
import { ValidationException, UnauthorizedException } from '../src/core/errors/app_exceptions';

/**
 * Mock in-memory repository implementing the domain InventoryRepository contract
 */
class InMemoryInventoryRepository implements InventoryRepository {
  public movements: InventoryMovementEntity[] = [];
  public products: Map<string, { id: string; organizationId: string; stock: number; costPrice: number }> = new Map();
  public processedOrders: Set<string> = new Set();
  public restoredOrders: Set<string> = new Set();

  async deductOrderStock(params: DeductOrderStockParams): Promise<DeductStockResult> {
    if (this.processedOrders.has(params.orderId)) {
      return {
        success: true,
        idempotent: true,
        orderId: params.orderId,
        itemsProcessed: 0,
        message: 'Inventario ya descontado previamente para esta orden (idempotente).'
      };
    }

    // Verify all products have enough stock atomically
    for (const item of params.items) {
      const prod = this.products.get(item.productId);
      if (!prod) {
        throw new ValidationException(`Producto con ID ${item.productId} no encontrado.`);
      }
      if (prod.stock < item.quantity) {
        throw new ValidationException(`Stock insuficiente para "${item.productName}". Disponible: ${prod.stock}, Solicitado: ${item.quantity}.`);
      }
    }

    // Deduct stock and record movements
    for (const item of params.items) {
      const prod = this.products.get(item.productId)!;
      const stockBefore = prod.stock;
      prod.stock = stockBefore - item.quantity;
      const stockAfter = prod.stock;

      const movement: InventoryMovementEntity = {
        id: `mov-deduct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        organizationId: params.organizationId,
        productId: item.productId,
        productName: item.productName,
        movementType: 'SALE',
        quantity: -item.quantity,
        stockBefore,
        stockAfter,
        unitCost: prod.costPrice,
        totalCost: item.quantity * prod.costPrice,
        referenceType: 'ORDER',
        referenceId: params.orderId,
        reason: params.reason || `Venta Orden #${params.orderId}`,
        createdBy: params.userId || 'system',
        createdAt: new Date().toISOString()
      };

      this.movements.push(movement);
    }

    this.processedOrders.add(params.orderId);

    return {
      success: true,
      idempotent: false,
      orderId: params.orderId,
      itemsProcessed: params.items.length
    };
  }

  async restoreOrderStock(params: RestoreOrderStockParams): Promise<RestoreStockResult> {
    if (!this.processedOrders.has(params.orderId)) {
      return {
        success: true,
        idempotent: true,
        orderId: params.orderId,
        itemsRestored: 0,
        message: 'La orden no tenía deducción previa o ya fue cancelada.'
      };
    }

    if (this.restoredOrders.has(params.orderId)) {
      return {
        success: true,
        idempotent: true,
        orderId: params.orderId,
        itemsRestored: 0,
        message: 'El stock de esta orden ya fue restaurado previamente.'
      };
    }

    // Find original SALE movements for this order
    const saleMovements = this.movements.filter(
      m => m.referenceId === params.orderId && m.movementType === 'SALE'
    );

    let restoredCount = 0;
    for (const sm of saleMovements) {
      const prod = this.products.get(sm.productId);
      if (prod) {
        const qtyToRestore = Math.abs(sm.quantity);
        const stockBefore = prod.stock;
        prod.stock = stockBefore + qtyToRestore;
        const stockAfter = prod.stock;

        const returnMovement: InventoryMovementEntity = {
          id: `mov-return-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organizationId: params.organizationId,
          productId: sm.productId,
          productName: sm.productName,
          movementType: 'CANCELLATION',
          quantity: qtyToRestore,
          stockBefore,
          stockAfter,
          unitCost: sm.unitCost,
          totalCost: qtyToRestore * sm.unitCost,
          referenceType: 'ORDER',
          referenceId: params.orderId,
          reason: params.reason || `Cancelación/Devolución Orden #${params.orderId}`,
          createdBy: params.userId || 'system',
          createdAt: new Date().toISOString()
        };

        this.movements.push(returnMovement);
        restoredCount++;
      }
    }

    this.restoredOrders.add(params.orderId);

    return {
      success: true,
      idempotent: false,
      orderId: params.orderId,
      itemsRestored: restoredCount
    };
  }

  async adjustInventory(params: AdjustInventoryParams): Promise<InventoryMovementEntity> {
    const prod = this.products.get(params.productId);
    if (!prod) {
      throw new ValidationException('Producto no encontrado');
    }

    const stockBefore = prod.stock;
    let netChange = params.quantity;
    if (params.movementType === 'REVERSAL') {
      netChange = -Math.abs(params.quantity);
    }

    const stockAfter = stockBefore + netChange;
    if (stockAfter < 0) {
      throw new ValidationException(`Stock insuficiente: disponible ${stockBefore}, resultante ${stockAfter}.`);
    }

    prod.stock = stockAfter;
    if (params.unitCost !== undefined && params.unitCost > 0) {
      prod.costPrice = params.unitCost;
    }

    const unitCost = params.unitCost ?? prod.costPrice;
    const movement: InventoryMovementEntity = {
      id: `mov-adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: params.organizationId,
      productId: params.productId,
      productName: 'Producto Test',
      movementType: params.movementType,
      quantity: netChange,
      stockBefore,
      stockAfter,
      unitCost,
      totalCost: Math.abs(netChange) * unitCost,
      referenceType: params.referenceType || 'MANUAL_ADJUSTMENT',
      referenceId: params.referenceId,
      reason: params.reason,
      createdBy: params.userId || 'system',
      createdAt: new Date().toISOString()
    };

    this.movements.push(movement);
    return movement;
  }

  async getMovements(
    organizationId: string,
    productId?: string,
    options?: import('../src/features/inventory').InventoryMovementFilterOptions
  ): Promise<InventoryMovementEntity[]> {
    let list = this.movements.filter(m => m.organizationId === organizationId);
    if (productId) {
      list = list.filter(m => m.productId === productId);
    }
    if (options?.movementType) {
      list = list.filter(m => m.movementType === options.movementType);
    }
    if (options?.limit !== undefined && options.limit > 0) {
      const offset = options.offset ?? 0;
      list = list.slice(offset, offset + options.limit);
    }
    return list;
  }

  async getStock(organizationId: string, productId: string): Promise<number> {
    const prod = this.products.get(productId);
    if (!prod || prod.organizationId !== organizationId) {
      return 0;
    }
    return prod.stock;
  }
}

describe('Fase 12 — Clean Architecture & Inventory Ledger Unit Tests', () => {
  let repo: InMemoryInventoryRepository;
  let deductUseCase: DeductStockUseCase;
  let restoreUseCase: RestoreStockUseCase;
  let adjustUseCase: AdjustInventoryUseCase;
  let getLedgerUseCase: GetInventoryLedgerUseCase;
  let getStockUseCase: GetCurrentStockUseCase;

  const ORG_A = 'org-tenant-alpha';
  const ORG_B = 'org-tenant-beta';
  const PROD_1 = 'prod-burger-supreme';
  const PROD_2 = 'prod-coca-cola';

  beforeEach(() => {
    repo = new InMemoryInventoryRepository();
    deductUseCase = new DeductStockUseCase(repo);
    restoreUseCase = new RestoreStockUseCase(repo);
    adjustUseCase = new AdjustInventoryUseCase(repo);
    getLedgerUseCase = new GetInventoryLedgerUseCase(repo);
    getStockUseCase = new GetCurrentStockUseCase(repo);

    repo.products.set(PROD_1, {
      id: PROD_1,
      organizationId: ORG_A,
      stock: 20,
      costPrice: 15.0
    });

    repo.products.set(PROD_2, {
      id: PROD_2,
      organizationId: ORG_A,
      stock: 50,
      costPrice: 3.5
    });
  });

  describe('1. Inmutabilidad y Auditoría del Libro Mayor (Kardex)', () => {
    it('debe registrar un movimiento de compra/ajuste con trazabilidad completa', async () => {
      const movement = await adjustUseCase.execute({
        organizationId: ORG_A,
        productId: PROD_1,
        movementType: 'PURCHASE',
        quantity: 10,
        unitCost: 14.5,
        reason: 'Reabastecimiento semanal de carne y panes',
        userId: 'admin-usr-1',
        userRole: 'admin'
      });

      expect(movement.id).toBeDefined();
      expect(movement.organizationId).toBe(ORG_A);
      expect(movement.productId).toBe(PROD_1);
      expect(movement.movementType).toBe('PURCHASE');
      expect(movement.quantity).toBe(10);
      expect(movement.stockBefore).toBe(20);
      expect(movement.stockAfter).toBe(30);
      expect(movement.unitCost).toBe(14.5);
      expect(movement.totalCost).toBe(145.0); // 10 * 14.5
      expect(movement.reason).toBe('Reabastecimiento semanal de carne y panes');
      expect(movement.createdBy).toBe('admin-usr-1');
      expect(movement.createdAt).toBeDefined();

      // Check current stock updated
      const currentStock = await getStockUseCase.execute(ORG_A, PROD_1);
      expect(currentStock).toBe(30);
    });

    it('debe registrar y auditar salidas de inventario por reversión', async () => {
      const movement = await adjustUseCase.execute({
        organizationId: ORG_A,
        productId: PROD_2,
        movementType: 'REVERSAL',
        quantity: 5,
        reason: 'Merma por botellas vencidas',
        userId: 'owner-usr-1',
        userRole: 'owner'
      });

      expect(movement.stockBefore).toBe(50);
      expect(movement.stockAfter).toBe(45);
      expect(movement.quantity).toBe(-5);
      expect(movement.totalCost).toBe(17.5); // 5 * 3.5

      const currentStock = await getStockUseCase.execute(ORG_A, PROD_2);
      expect(currentStock).toBe(45);
    });
  });

  describe('2. Invariante: Bloqueo de Stock Negativo y Transaccionalidad Atómica', () => {
    it('debe rechazar ajuste manual que provoque stock negativo', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_A,
          productId: PROD_1,
          movementType: 'REVERSAL',
          quantity: 35, // Stock es 20
          reason: 'Ajuste excesivo',
          userRole: 'admin'
        })
      ).rejects.toThrow(/Stock insuficiente/);

      // Stock must remain unchanged
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(20);
      expect(repo.movements.length).toBe(0);
    });

    it('debe rechazar venta atómica completa si un artículo tiene stock insuficiente', async () => {
      await expect(
        deductUseCase.execute({
          organizationId: ORG_A,
          orderId: 'ord-fail-1',
          items: [
            { productId: PROD_1, productName: 'Hamburguesa', quantity: 2 },
            { productId: PROD_2, productName: 'Coca Cola', quantity: 100 } // Supera el stock de 50
          ]
        })
      ).rejects.toThrow(/Stock insuficiente para "Coca Cola"/);

      // Verify ATOMICITY: No items should be deducted
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(20);
      expect(await getStockUseCase.execute(ORG_A, PROD_2)).toBe(50);
      expect(repo.movements.length).toBe(0);
    });
  });

  describe('3. Deducción Atómica e Idempotencia por Orden', () => {
    it('debe descontar correctamente el inventario asociando el referenceId con la orden', async () => {
      const result = await deductUseCase.execute({
        organizationId: ORG_A,
        orderId: 'ord-success-100',
        items: [
          { productId: PROD_1, productName: 'Hamburguesa', quantity: 5 },
          { productId: PROD_2, productName: 'Coca Cola', quantity: 10 }
        ],
        reason: 'Venta Mostrador #ord-success-100'
      });

      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(false);
      expect(result.itemsProcessed).toBe(2);

      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(15);
      expect(await getStockUseCase.execute(ORG_A, PROD_2)).toBe(40);

      const movements = await getLedgerUseCase.execute(ORG_A);
      expect(movements.length).toBe(2);
      expect(movements.every(m => m.referenceId === 'ord-success-100')).toBe(true);
      expect(movements.every(m => m.movementType === 'SALE')).toBe(true);
    });

    it('debe garantizar IDEMPOTENCIA si la misma orden se envía repetidamente', async () => {
      const payload: DeductOrderStockParams = {
        organizationId: ORG_A,
        orderId: 'ord-idem-200',
        items: [{ productId: PROD_1, productName: 'Hamburguesa', quantity: 3 }]
      };

      // 1ra ejecución
      const firstRes = await deductUseCase.execute(payload);
      expect(firstRes.idempotent).toBe(false);
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(17);

      // 2da ejecución idéntica
      const secondRes = await deductUseCase.execute(payload);
      expect(secondRes.idempotent).toBe(true);
      expect(secondRes.itemsProcessed).toBe(0);

      // El stock sigue siendo 17, NO se descuenta doble
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(17);
    });
  });

  describe('4. Cancelación de Pedidos y Reversión Compensatoria (CANCELLATION)', () => {
    it('debe restaurar el inventario deduciendo con orden cancelada', async () => {
      // 1. Descontar
      await deductUseCase.execute({
        organizationId: ORG_A,
        orderId: 'ord-cancel-300',
        items: [{ productId: PROD_1, productName: 'Hamburguesa', quantity: 4 }]
      });
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(16);

      // 2. Cancelar y restaurar
      const restoreRes = await restoreUseCase.execute({
        organizationId: ORG_A,
        orderId: 'ord-cancel-300',
        reason: 'Cliente canceló el pedido por demora'
      });

      expect(restoreRes.success).toBe(true);
      expect(restoreRes.idempotent).toBe(false);
      expect(restoreRes.itemsRestored).toBe(1);

      // Stock recuperado
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(20);

      // Movimiento compensatorio CANCELLATION registrado
      const movements = await getLedgerUseCase.execute(ORG_A, { productId: PROD_1 });
      const returnMov = movements.find(m => m.movementType === 'CANCELLATION');
      expect(returnMov).toBeDefined();
      expect(returnMov?.quantity).toBe(4);
      expect(returnMov?.stockAfter).toBe(20);
    });

    it('no debe duplicar la reposición si se llama restore múltiples veces', async () => {
      await deductUseCase.execute({
        organizationId: ORG_A,
        orderId: 'ord-cancel-400',
        items: [{ productId: PROD_1, productName: 'Hamburguesa', quantity: 2 }]
      });

      // 1st restore
      const res1 = await restoreUseCase.execute({ organizationId: ORG_A, orderId: 'ord-cancel-400' });
      expect(res1.idempotent).toBe(false);
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(20);

      // 2nd duplicate restore
      const res2 = await restoreUseCase.execute({ organizationId: ORG_A, orderId: 'ord-cancel-400' });
      expect(res2.idempotent).toBe(true);
      expect(res2.itemsRestored).toBe(0);
      expect(await getStockUseCase.execute(ORG_A, PROD_1)).toBe(20); // No incrementa a 22
    });
  });

  describe('5. Matriz de Autorización y Permisos RBAC', () => {
    it('debe rechazar ajuste manual de inventario si el rol no es admin/owner', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_A,
          productId: PROD_1,
          movementType: 'ADJUSTMENT',
          quantity: 5,
          reason: 'Ajuste no autorizado',
          userRole: 'staff' // Staff no puede hacer ajustes manuales arbitrarios
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar modificación de costo unitario si el rol es staff o viewer', async () => {
      await expect(
        adjustUseCase.execute({
          organizationId: ORG_A,
          productId: PROD_1,
          movementType: 'ADJUSTMENT',
          quantity: 2,
          unitCost: 20.0,
          reason: 'Modificación de costo',
          userRole: 'viewer'
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe permitir a admin y owner realizar ajustes y ver el Kardex', async () => {
      expect(InventoryPermissions.canAdjustInventory('admin')).toBe(true);
      expect(InventoryPermissions.canAdjustInventory('owner')).toBe(true);
      expect(InventoryPermissions.canModifyCostPrice('admin')).toBe(true);
      expect(InventoryPermissions.canViewLedger('staff')).toBe(true);
      expect(InventoryPermissions.canViewLedger('viewer')).toBe(true);
    });
  });

  describe('6. Aislamiento Multi-Tenant de Movimientos', () => {
    it('debe filtrar movimientos exclusivamente por organización', async () => {
      // Ajuste Org A
      await adjustUseCase.execute({
        organizationId: ORG_A,
        productId: PROD_1,
        movementType: 'PURCHASE',
        quantity: 5,
        reason: 'Carga Org A',
        userRole: 'admin'
      });

      // Ajuste Org B
      repo.products.set('prod-tenant-b', {
        id: 'prod-tenant-b',
        organizationId: ORG_B,
        stock: 10,
        costPrice: 5
      });
      await adjustUseCase.execute({
        organizationId: ORG_B,
        productId: 'prod-tenant-b',
        movementType: 'PURCHASE',
        quantity: 15,
        reason: 'Carga Org B',
        userRole: 'admin'
      });

      const movementsA = await getLedgerUseCase.execute(ORG_A);
      expect(movementsA.length).toBe(1);
      expect(movementsA[0].organizationId).toBe(ORG_A);

      const movementsB = await getLedgerUseCase.execute(ORG_B);
      expect(movementsB.length).toBe(1);
      expect(movementsB[0].organizationId).toBe(ORG_B);
    });
  });
});
