/**
 * Negocio Flex - Category Model (Fase 4.1)
 * Mapeo estricto entre Database['public']['Tables']['categories'] y CategoryEntity.
 */

import { Database } from '../../../../types/database.types';
import { CategoryEntity, CategoryType } from '../../domain/entities/category_entity';

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export class CategoryModel implements CategoryEntity {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  type: CategoryType;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: {
    id: string;
    organizationId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    icon?: string | null;
    type: CategoryType;
    displayOrder: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  }) {
    this.id = data.id;
    this.organizationId = data.organizationId;
    this.name = data.name;
    this.description = data.description;
    this.imageUrl = data.imageUrl;
    this.icon = data.icon;
    this.type = data.type;
    this.displayOrder = data.displayOrder;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromRow(row: CategoryRow): CategoryModel {
    return new CategoryModel({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      icon: row.icon,
      type: (row.type as CategoryType) || 'PRODUCT',
      displayOrder: row.display_order ?? 0,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static fromJson(json: Record<string, any>): CategoryModel {
    return new CategoryModel({
      id: json.id,
      organizationId: json.organization_id || json.organizationId,
      name: json.name || '',
      description: json.description,
      imageUrl: json.image_url || json.imageUrl,
      icon: json.icon,
      type: (json.type as CategoryType) || 'PRODUCT',
      displayOrder: json.display_order ?? json.displayOrder ?? 0,
      isActive: json.is_active ?? json.isActive ?? true,
      createdAt: json.created_at || json.createdAt,
      updatedAt: json.updated_at || json.updatedAt,
    });
  }

  toRow(): CategoryRow {
    return {
      id: this.id,
      organization_id: this.organizationId,
      name: this.name,
      description: this.description ?? null,
      image_url: this.imageUrl ?? null,
      icon: this.icon ?? null,
      type: this.type,
      display_order: this.displayOrder,
      is_active: this.isActive,
      created_at: this.createdAt || new Date().toISOString(),
      updated_at: this.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Representación compatible con la interfaz legacy Category de src/types.ts
   */
  toLegacy(): {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    image_url?: string;
    icon?: string;
    type: 'PRODUCT' | 'SERVICE';
    display_order: number;
    is_active: boolean;
    created_at?: string;
  } {
    return {
      id: this.id,
      organization_id: this.organizationId,
      name: this.name,
      description: this.description || undefined,
      image_url: this.imageUrl || undefined,
      icon: this.icon || undefined,
      type: this.type,
      display_order: this.displayOrder,
      is_active: this.isActive,
      created_at: this.createdAt,
    };
  }
}
