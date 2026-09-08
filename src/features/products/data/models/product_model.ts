/**
 * Negocio Flex - Product Model (Fase 12: Catálogo Integral y Stock)
 * Mapeo estricto entre Database['public']['Tables']['products'] y ProductEntity / Product legacy.
 */

import { Database } from '../../../../types/database.types';
import { ProductEntity, StockAlertLevel, calculateStockAlert } from '../../domain/entities/product_entity';
import { Product } from '../../../../types';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export class ProductModel implements ProductEntity {
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

  constructor(data: {
    id: string;
    organizationId: string;
    categoryId: string | null;
    name: string;
    description: string;
    sku?: string;
    barcode?: string;
    price: number;
    promoPrice: number | null;
    costPrice?: number;
    stock: number;
    trackInventory?: boolean;
    minStockAlert?: number;
    allowNegativeStock?: boolean;
    isActive: boolean;
    isFeatured: boolean;
    displayOrder: number;
    images: string[];
    categoryName?: string;
    createdAt?: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.organizationId = data.organizationId;
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.description = data.description;
    this.sku = data.sku;
    this.barcode = data.barcode;
    this.price = data.price;
    this.promoPrice = data.promoPrice;
    this.costPrice = data.costPrice ?? 0;
    this.stock = data.stock;
    this.trackInventory = data.trackInventory ?? true;
    this.minStockAlert = data.minStockAlert ?? 5;
    this.allowNegativeStock = data.allowNegativeStock ?? false;
    this.stockAlertLevel = calculateStockAlert(this.stock, this.minStockAlert, this.trackInventory);
    this.isActive = data.isActive;
    this.isFeatured = data.isFeatured;
    this.displayOrder = data.displayOrder;
    this.images = data.images;
    this.categoryName = data.categoryName;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private static parseImages(rawImages: unknown): string[] {
    if (Array.isArray(rawImages)) {
      return rawImages.map(img => String(img));
    }
    if (typeof rawImages === 'string') {
      try {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed)) {
          return parsed.map(img => String(img));
        }
      } catch {
        return rawImages.trim() ? [rawImages] : [];
      }
    }
    return [];
  }

  static fromRow(row: any, categoryName?: string): ProductModel {
    return new ProductModel({
      id: row.id,
      organizationId: row.organization_id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description || '',
      sku: row.sku || undefined,
      barcode: row.barcode || undefined,
      price: Number(row.price),
      promoPrice: row.promo_price !== null && row.promo_price !== undefined ? Number(row.promo_price) : null,
      costPrice: row.cost_price !== undefined ? Number(row.cost_price) : 0,
      stock: row.stock ?? 0,
      trackInventory: row.track_inventory !== undefined ? Boolean(row.track_inventory) : true,
      minStockAlert: row.min_stock_alert !== undefined ? Number(row.min_stock_alert) : 5,
      allowNegativeStock: row.allow_negative_stock !== undefined ? Boolean(row.allow_negative_stock) : false,
      isActive: row.is_active ?? true,
      isFeatured: row.is_featured ?? false,
      displayOrder: row.display_order ?? 0,
      images: ProductModel.parseImages(row.images),
      categoryName: categoryName,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static fromJson(json: Record<string, any>): ProductModel {
    return new ProductModel({
      id: json.id,
      organizationId: json.organization_id || json.organizationId,
      categoryId: json.category_id || json.categoryId || null,
      name: json.name || '',
      description: json.description || '',
      sku: json.sku || undefined,
      barcode: json.barcode || undefined,
      price: Number(json.price) || 0,
      promoPrice: json.promo_price !== undefined ? json.promo_price : json.promoPrice !== undefined ? json.promoPrice : null,
      costPrice: json.cost_price !== undefined ? Number(json.cost_price) : json.costPrice !== undefined ? Number(json.costPrice) : 0,
      stock: json.stock !== undefined ? Number(json.stock) : 0,
      trackInventory: json.track_inventory !== undefined ? Boolean(json.track_inventory) : json.trackInventory !== undefined ? Boolean(json.trackInventory) : true,
      minStockAlert: json.min_stock_alert !== undefined ? Number(json.min_stock_alert) : json.minStockAlert !== undefined ? Number(json.minStockAlert) : 5,
      allowNegativeStock: json.allow_negative_stock !== undefined ? Boolean(json.allow_negative_stock) : json.allowNegativeStock !== undefined ? Boolean(json.allowNegativeStock) : false,
      isActive: json.is_active !== undefined ? Boolean(json.is_active) : json.isActive !== undefined ? Boolean(json.isActive) : true,
      isFeatured: json.is_featured !== undefined ? Boolean(json.is_featured) : json.isFeatured !== undefined ? Boolean(json.isFeatured) : false,
      displayOrder: json.display_order !== undefined ? Number(json.display_order) : json.displayOrder !== undefined ? Number(json.displayOrder) : 0,
      images: ProductModel.parseImages(json.images),
      categoryName: json.category_name || json.categoryName,
      createdAt: json.created_at || json.createdAt,
      updatedAt: json.updated_at || json.updatedAt,
    });
  }

  toRow(): any {
    return {
      id: this.id,
      organization_id: this.organizationId,
      category_id: this.categoryId,
      name: this.name,
      description: this.description,
      sku: this.sku,
      barcode: this.barcode,
      price: this.price,
      promo_price: this.promoPrice,
      cost_price: this.costPrice,
      stock: this.stock,
      track_inventory: this.trackInventory,
      min_stock_alert: this.minStockAlert,
      allow_negative_stock: this.allowNegativeStock,
      is_active: this.isActive,
      is_featured: this.isFeatured,
      display_order: this.displayOrder,
      images: this.images,
      created_at: this.createdAt || new Date().toISOString(),
      updated_at: this.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Representación compatible con la interfaz legacy Product de src/types.ts
   */
  toLegacy(): Product {
    return {
      id: this.id,
      organization_id: this.organizationId,
      category_id: this.categoryId || undefined,
      name: this.name,
      description: this.description,
      sku: this.sku,
      barcode: this.barcode,
      price: this.price,
      promo_price: this.promoPrice !== null ? this.promoPrice : undefined,
      cost_price: this.costPrice,
      stock: this.stock,
      track_inventory: this.trackInventory,
      min_stock_alert: this.minStockAlert,
      allow_negative_stock: this.allowNegativeStock,
      is_active: this.isActive,
      is_featured: this.isFeatured,
      display_order: this.displayOrder,
      images: this.images.length > 0 ? this.images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'],
      category_name: this.categoryName,
      created_at: this.createdAt || new Date().toISOString(),
      updated_at: this.updatedAt,
    };
  }
}
