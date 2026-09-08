/**
 * Negocio Flex - Inventory Repository Contract (Fase 12)
 * Contrato de repositorio desacoplado para el Libro Mayor de Inventario y Operaciones Atómicas.
 */

import {
  InventoryMovementEntity,
  DeductOrderStockParams,
  RestoreOrderStockParams,
  AdjustInventoryParams,
  DeductStockResult,
  RestoreStockResult,
} from '../entities/inventory_movement_entity';

export interface InventoryMovementFilterOptions {
  limit?: number;
  offset?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
}

export interface InventoryRepository {
  /**
   * Ejecuta deducción atómica de inventario para los artículos de un pedido.
   * Garantiza idempotencia y bloqueo por concurrencia.
   */
  deductOrderStock(params: DeductOrderStockParams): Promise<DeductStockResult>;

  /**
   * Ejecuta la reversión compensatoria de inventario al cancelar un pedido.
   * Inserta movimientos de tipo CANCELLATION garantizando no revertir dos veces.
   */
  restoreOrderStock(params: RestoreOrderStockParams): Promise<RestoreStockResult>;

  /**
   * Realiza un ajuste manual de inventario (PURCHASE, RETURN, ADJUSTMENT, etc.).
   */
  adjustInventory(params: AdjustInventoryParams): Promise<InventoryMovementEntity>;

  /**
   * Obtiene los movimientos históricos del Libro Mayor para una organización o producto.
   * Soporta paginación y filtros opcionales (LOW-02).
   */
  getMovements(
    organizationId: string,
    productId?: string,
    options?: InventoryMovementFilterOptions
  ): Promise<InventoryMovementEntity[]>;

  /**
   * Obtiene el stock actual de un producto específico.
   */
  getStock(organizationId: string, productId: string): Promise<number>;
}
