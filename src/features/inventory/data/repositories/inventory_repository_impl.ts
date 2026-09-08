/**
 * Negocio Flex - Inventory Repository Implementation (Fase 12)
 * Implementación desacoplada del contrato InventoryRepository.
 */

import { InventoryRepository } from '../../domain/repositories/inventory_repository';
import {
  InventoryMovementEntity,
  DeductOrderStockParams,
  RestoreOrderStockParams,
  AdjustInventoryParams,
  DeductStockResult,
  RestoreStockResult,
} from '../../domain/entities/inventory_movement_entity';
import { InventoryDataSource } from '../datasources/inventory_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class InventoryRepositoryImpl implements InventoryRepository {
  constructor(
    private readonly dataSource: InventoryDataSource,
    private readonly hooks?: {
      getProductStockFn?: (productId: string) => { stock: number; name: string; costPrice: number; trackInventory?: boolean; allowNegativeStock?: boolean };
      updateProductStockFn?: (productId: string, newStock: number, newCost?: number) => void;
    }
  ) {}

  async deductOrderStock(params: DeductOrderStockParams): Promise<DeductStockResult> {
    try {
      return await this.dataSource.deductOrderStock(params, this.hooks);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async restoreOrderStock(params: RestoreOrderStockParams): Promise<RestoreStockResult> {
    try {
      return await this.dataSource.restoreOrderStock(params, this.hooks);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async adjustInventory(params: AdjustInventoryParams): Promise<InventoryMovementEntity> {
    try {
      return await this.dataSource.adjustInventory(params, this.hooks);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getMovements(
    organizationId: string,
    productId?: string,
    options?: import('../../domain/repositories/inventory_repository').InventoryMovementFilterOptions
  ): Promise<InventoryMovementEntity[]> {
    try {
      return await this.dataSource.getMovements(organizationId, productId, options);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getStock(organizationId: string, productId: string): Promise<number> {
    try {
      return await this.dataSource.getStock(organizationId, productId);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
