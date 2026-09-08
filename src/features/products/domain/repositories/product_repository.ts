/**
 * Negocio Flex - Product Repository Contract (Fase 4.2)
 * Interfaz formal para las operaciones de productos en la capa de dominio.
 */

import {
  ProductEntity,
  CreateProductParams,
  UpdateProductParams,
} from '../entities/product_entity';

export interface ProductRepository {
  /**
   * Obtiene todos los productos de una organización
   */
  getProducts(organizationId: string): Promise<ProductEntity[]>;

  /**
   * Obtiene un producto por su ID
   */
  getProductById(id: string): Promise<ProductEntity | null>;

  /**
   * Obtiene un producto por SKU dentro de la organización
   */
  findBySku(organizationId: string, sku: string): Promise<ProductEntity | null>;

  /**
   * Crea un nuevo producto
   */
  createProduct(params: CreateProductParams): Promise<ProductEntity>;

  /**
   * Actualiza un producto existente
   */
  updateProduct(id: string, params: UpdateProductParams): Promise<ProductEntity>;

  /**
   * Elimina un producto por ID
   */
  deleteProduct(id: string): Promise<void>;

  /**
   * Alterna el estado activo / inactivo de un producto
   */
  toggleProductActive(id: string, isActive: boolean): Promise<ProductEntity>;

  /**
   * Alterna el estado destacado de un producto
   */
  toggleProductFeatured(id: string, isFeatured: boolean): Promise<ProductEntity>;

  /**
   * Reordena productos en la organización
   */
  reorderProducts(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void>;
}
