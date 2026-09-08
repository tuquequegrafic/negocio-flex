/**
 * Negocio Flex - Service Model (Fase 4.3)
 * Mapeo estricto entre Database['public']['Tables']['services'] y ServiceEntity / ServiceItem legacy.
 */

import { Database } from '../../../../types/database.types';
import { ServiceEntity } from '../../domain/entities/service_entity';
import { ServiceItem } from '../../../../types';

export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export class ServiceModel implements ServiceEntity {
  id: string;
  organizationId: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  promoPrice: number | null;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: {
    id: string;
    organizationId: string;
    categoryId: string | null;
    name: string;
    description: string;
    price: number;
    promoPrice: number | null;
    durationMinutes: number;
    imageUrl: string | null;
    isActive: boolean;
    isFeatured: boolean;
    displayOrder: number;
    categoryName?: string;
    createdAt?: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.organizationId = data.organizationId;
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.promoPrice = data.promoPrice;
    this.durationMinutes = data.durationMinutes;
    this.imageUrl = data.imageUrl;
    this.isActive = data.isActive;
    this.isFeatured = data.isFeatured;
    this.displayOrder = data.displayOrder;
    this.categoryName = data.categoryName;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromRow(row: ServiceRow, categoryName?: string): ServiceModel {
    return new ServiceModel({
      id: row.id,
      organizationId: row.organization_id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description || '',
      price: Number(row.price),
      promoPrice: row.promo_price !== null && row.promo_price !== undefined ? Number(row.promo_price) : null,
      durationMinutes: row.duration_minutes ?? 30,
      imageUrl: row.image_url,
      isActive: row.is_active ?? true,
      isFeatured: row.is_featured ?? false,
      displayOrder: row.display_order ?? 0,
      categoryName: categoryName,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  toRow(): ServiceRow {
    return {
      id: this.id,
      organization_id: this.organizationId,
      category_id: this.categoryId,
      name: this.name,
      description: this.description,
      price: this.price,
      promo_price: this.promoPrice,
      duration_minutes: this.durationMinutes,
      image_url: this.imageUrl,
      is_active: this.isActive,
      is_featured: this.isFeatured,
      display_order: this.displayOrder,
      created_at: this.createdAt || new Date().toISOString(),
      updated_at: this.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Representación compatible con la interfaz legacy ServiceItem de src/types.ts
   */
  toLegacy(): ServiceItem {
    return {
      id: this.id,
      organization_id: this.organizationId,
      category_id: this.categoryId || undefined,
      name: this.name,
      description: this.description,
      image_url: this.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      price: this.price,
      promo_price: this.promoPrice !== null ? this.promoPrice : undefined,
      duration_minutes: this.durationMinutes,
      is_active: this.isActive,
      is_featured: this.isFeatured,
      display_order: this.displayOrder,
      category_name: this.categoryName,
      created_at: this.createdAt || new Date().toISOString(),
      updated_at: this.updatedAt,
    };
  }
}
