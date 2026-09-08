/**
 * Negocio Flex - Product Entity & Contracts (Fase 12: Catálogo Integral y Stock)
 * Entidad de dominio pura para productos con soporte de SKU, costo, control de inventario y alertas.
 */

export type StockAlertLevel = 'STOCK_OK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function calculateStockAlert(
  stock: number,
  minStockAlert: number = 5,
  trackInventory: boolean = true
): StockAlertLevel {
  if (!trackInventory) return 'STOCK_OK';
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= minStockAlert) return 'LOW_STOCK';
  return 'STOCK_OK';
}

export interface ProductEntity {
  id: string;
  organizationId: string;
  categoryId: string | null;
  name: string;
  description: string;
  sku?: string;
  barcode?: string;
  price: number;
  promoPrice: number | null;
  costPrice: number;
  stock: number;
  trackInventory: boolean;
  minStockAlert: number;
  allowNegativeStock: boolean;
  stockAlertLevel: StockAlertLevel;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  images: string[];
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductParams {
  organizationId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  promoPrice?: number | null;
  costPrice?: number;
  stock?: number;
  trackInventory?: boolean;
  minStockAlert?: number;
  allowNegativeStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  images?: string[];
  categoryName?: string;
}

export interface UpdateProductParams {
  categoryId?: string | null;
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price?: number;
  promoPrice?: number | null;
  costPrice?: number;
  stock?: number;
  trackInventory?: boolean;
  minStockAlert?: number;
  allowNegativeStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  images?: string[];
  categoryName?: string;
}

