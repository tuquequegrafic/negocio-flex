/**
 * Negocio Flex - Category Repository Interface (Fase 4.1)
 * Contrato de repositorio para operaciones CRUD y reordenamiento de categorías.
 */

import {
  CategoryEntity,
  CreateCategoryParams,
  UpdateCategoryParams,
} from '../entities/category_entity';

export interface CategoryRepository {
  /**
   * Obtiene todas las categorías asociadas a una organización específica
   */
  getCategories(organizationId: string): Promise<CategoryEntity[]>;

  /**
   * Obtiene una categoría individual por su ID
   */
  getCategoryById(id: string): Promise<CategoryEntity | null>;

  /**
   * Crea una nueva categoría en la organización autorizada
   */
  createCategory(params: CreateCategoryParams): Promise<CategoryEntity>;

  /**
   * Actualiza los datos de una categoría existente
   */
  updateCategory(id: string, params: UpdateCategoryParams): Promise<CategoryEntity>;

  /**
   * Elimina una categoría por su ID
   */
  deleteCategory(id: string): Promise<void>;

  /**
   * Actualiza el orden de visualización de múltiples categorías
   */
  reorderCategories(organizationId: string, orderedItems: { id: string; displayOrder: number }[]): Promise<void>;
}
