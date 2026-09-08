/**
 * Negocio Flex - Category Repository Implementation (Fase 4.1)
 * Implementación del contrato CategoryRepository delegando al DataSource con manejo de errores.
 */

import { CategoryRepository } from '../../domain/repositories/category_repository';
import {
  CategoryEntity,
  CreateCategoryParams,
  UpdateCategoryParams,
} from '../../domain/entities/category_entity';
import { CategoryDataSource } from '../datasources/category_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly dataSource: CategoryDataSource) {}

  async getCategories(organizationId: string): Promise<CategoryEntity[]> {
    try {
      return await this.dataSource.fetchCategoriesByOrg(organizationId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getCategoryById(id: string): Promise<CategoryEntity | null> {
    try {
      return await this.dataSource.fetchCategoryById(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createCategory(params: CreateCategoryParams): Promise<CategoryEntity> {
    try {
      return await this.dataSource.createCategory(params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateCategory(id: string, params: UpdateCategoryParams): Promise<CategoryEntity> {
    try {
      return await this.dataSource.updateCategory(id, params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await this.dataSource.deleteCategory(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async reorderCategories(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    try {
      await this.dataSource.reorderCategories(organizationId, orderedItems);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
