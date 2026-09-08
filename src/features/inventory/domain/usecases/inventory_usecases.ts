/**
 * Negocio Flex - Inventory Domain Use Cases (Fase 12)
 * Casos de uso de negocio para Libro Mayor, Deducción Atómica, Reversión Compensatoria y Ajustes.
 */

import { InventoryRepository } from '../repositories/inventory_repository';
import {
  InventoryMovementEntity,
  DeductOrderStockParams,
  RestoreOrderStockParams,
  AdjustInventoryParams,
  DeductStockResult,
  RestoreStockResult,
} from '../entities/inventory_movement_entity';
import { InventoryPermissions } from '../permissions/inventory_permissions';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class DeductStockUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  async execute(params: DeductOrderStockParams): Promise<DeductStockResult> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es obligatorio para la deducción de inventario.');
    }

    if (!params.orderId || params.orderId.trim() === '') {
      throw new ValidationException('El ID del pedido es obligatorio para la deducción de inventario.');
    }

    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      throw new ValidationException('Debe incluir al menos un artículo para procesar la deducción.');
    }

    for (const [idx, item] of params.items.entries()) {
      if (!item.productId || item.productId.trim() === '') {
        throw new ValidationException(`El artículo #${idx + 1} no especifica un ID de producto válido.`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new ValidationException(`La cantidad para el artículo #${idx + 1} debe ser un entero positivo.`);
      }
    }

    return this.repository.deductOrderStock(params);
  }
}

export class RestoreStockUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  async execute(params: RestoreOrderStockParams): Promise<RestoreStockResult> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es obligatorio para restaurar inventario.');
    }

    if (!params.orderId || params.orderId.trim() === '') {
      throw new ValidationException('El ID del pedido es obligatorio para restaurar inventario.');
    }

    return this.repository.restoreOrderStock(params);
  }
}

export class AdjustInventoryUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  async execute(params: AdjustInventoryParams): Promise<InventoryMovementEntity> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('El ID de organización es obligatorio.');
    }

    if (!params.productId || params.productId.trim() === '') {
      throw new ValidationException('El ID del producto es obligatorio para el ajuste.');
    }

    const validTypes = ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'INITIAL_LOAD', 'REVERSAL'];
    if (!validTypes.includes(params.movementType)) {
      throw new ValidationException(`Tipo de movimiento inválido: ${params.movementType}`);
    }

    if (typeof params.quantity !== 'number' || params.quantity <= 0 || !Number.isInteger(params.quantity)) {
      throw new ValidationException('La cantidad del movimiento debe ser un entero positivo mayor a cero.');
    }

    if (!params.reason || params.reason.trim().length < 3) {
      throw new ValidationException('Debe proporcionar un motivo claro para el movimiento (mínimo 3 caracteres).');
    }

    // Validación estricta de permisos RBAC
    if (params.userRole) {
      InventoryPermissions.assertCanAdjust(params.userRole);
      if (params.unitCost !== undefined && params.unitCost > 0) {
        InventoryPermissions.assertCanModifyCost(params.userRole);
      }
    }

    return this.repository.adjustInventory(params);
  }
}

export class GetInventoryLedgerUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  async execute(
    organizationId: string,
    options?: {
      productId?: string;
      userRole?: string;
      limit?: number;
      offset?: number;
      movementType?: string;
    }
  ): Promise<InventoryMovementEntity[]> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de organización es obligatorio.');
    }

    if (options?.userRole && !InventoryPermissions.canViewLedger(options.userRole)) {
      throw new ValidationException('No tiene permisos para consultar el libro mayor de inventario.');
    }

    return this.repository.getMovements(organizationId.trim(), options?.productId?.trim(), {
      limit: options?.limit,
      offset: options?.offset,
      movementType: options?.movementType,
    });
  }
}

export class GetCurrentStockUseCase {
  constructor(private readonly repository: InventoryRepository) {}

  async execute(organizationId: string, productId: string): Promise<number> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de organización es obligatorio.');
    }
    if (!productId || productId.trim() === '') {
      throw new ValidationException('El ID de producto es obligatorio.');
    }

    return this.repository.getStock(organizationId.trim(), productId.trim());
  }
}
