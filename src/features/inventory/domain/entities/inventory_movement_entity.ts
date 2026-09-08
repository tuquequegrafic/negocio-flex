/**
 * Negocio Flex - Inventory Movement Entity & Domain Types (Fase 12)
 * Entidad pura de Libro Mayor Inmutable de Inventario y Contratos de Dominio.
 */

import type {
  InventoryMovementType,
  InventoryReferenceType,
  StockAlertLevel,
} from '../../../../types';

export type { InventoryMovementType, InventoryReferenceType, StockAlertLevel };

export interface InventoryMovementEntity {
  id: string;
  organizationId: string;
  productId: string;
  productName?: string;
  movementType: InventoryMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost: number;
  totalCost: number;
  referenceType: InventoryReferenceType;
  referenceId?: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface DeductOrderStockParams {
  organizationId: string;
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  userId?: string;
  reason?: string;
}

export interface RestoreOrderStockParams {
  organizationId: string;
  orderId: string;
  reason?: string;
  userId?: string;
}

export interface AdjustInventoryParams {
  organizationId: string;
  productId: string;
  movementType: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL_LOAD' | 'REVERSAL';
  quantity: number;
  direction?: 'IN' | 'OUT';
  unitCost?: number;
  reason: string;
  referenceType?: InventoryReferenceType;
  referenceId?: string;
  userId?: string;
  userRole?: string;
}

export interface DeductStockResult {
  success: boolean;
  idempotent: boolean;
  orderId: string;
  itemsProcessed: number;
  message?: string;
}

export interface RestoreStockResult {
  success: boolean;
  idempotent: boolean;
  orderId: string;
  itemsRestored: number;
  message?: string;
}
