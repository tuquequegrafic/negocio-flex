/**
 * Negocio Flex - Product Repository Implementation (Fase 4.2)
 * Implementación del contrato ProductRepository delegando al DataSource con normalización de errores.
 */

import { ProductRepository } from '../../domain/repositories/product_repository';
import {
  ProductEntity,
  CreateProductParams,
  UpdateProductParams,
} from '../../domain/entities/product_entity';
import { ProductDataSource } from '../datasources/product_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class ProductRepositoryImpl implements ProductRepository {
  constructor(private readonly dataSource: ProductDataSource) {}

  async getProducts(organizationId: string): Promise<ProductEntity[]> {
    try {
      return await this.dataSource.fetchProductsByOrg(organizationId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getProductById(id: string): Promise<ProductEntity | null> {
    try {
      return await this.dataSource.fetchProductById(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async findBySku(organizationId: string, sku: string): Promise<ProductEntity | null> {
    try {
      return await this.dataSource.fetchProductBySku(organizationId, sku);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createProduct(params: CreateProductParams): Promise<ProductEntity> {
    try {
      return await this.dataSource.createProduct(params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateProduct(id: string, params: UpdateProductParams): Promise<ProductEntity> {
    try {
      return await this.dataSource.updateProduct(id, params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.dataSource.deleteProduct(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async toggleProductActive(id: string, isActive: boolean): Promise<ProductEntity> {
    try {
      return await this.dataSource.toggleProductActive(id, isActive);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async toggleProductFeatured(id: string, isFeatured: boolean): Promise<ProductEntity> {
    try {
      return await this.dataSource.toggleProductFeatured(id, isFeatured);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async reorderProducts(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    try {
      await this.dataSource.reorderProducts(organizationId, orderedItems);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
