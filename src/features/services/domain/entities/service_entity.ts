/**
 * Negocio Flex - Service Entity & Contracts (Fase 4.3)
 * Entidad de dominio pura para servicios profesionales y contratos de parámetros.
 */

export interface ServiceEntity {
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
}

export interface CreateServiceParams {
  organizationId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
  price: number;
  promoPrice?: number | null;
  durationMinutes?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  categoryName?: string;
}

export interface UpdateServiceParams {
  categoryId?: string | null;
  name?: string;
  description?: string;
  price?: number;
  promoPrice?: number | null;
  durationMinutes?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  categoryName?: string;
}
