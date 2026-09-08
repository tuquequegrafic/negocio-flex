/**
 * Negocio Flex - Category Entity (Fase 4.1)
 * Entidad de dominio pura para categorías de Productos y Servicios.
 */

export type CategoryType = 'PRODUCT' | 'SERVICE';

export interface CategoryEntity {
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
}

export interface CreateCategoryParams {
  organizationId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  type: CategoryType;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryParams {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  type?: CategoryType;
  displayOrder?: number;
  isActive?: boolean;
}
