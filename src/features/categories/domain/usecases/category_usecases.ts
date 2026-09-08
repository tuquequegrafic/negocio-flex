/**
 * Negocio Flex - Category Use Cases (Fase 4.1)
 * Casos de uso de negocio para gestión de categorías.
 */

import {
  CategoryEntity,
  CreateCategoryParams,
  UpdateCategoryParams,
} from '../entities/category_entity';
import { CategoryRepository } from '../repositories/category_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(organizationId: string): Promise<CategoryEntity[]> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de organización es requerido para consultar categorías');
    }
    return await this.repository.getCategories(organizationId);
  }
}

export class GetCategoryByIdUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string): Promise<CategoryEntity | null> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID de la categoría es requerido');
    }
    return await this.repository.getCategoryById(id);
  }
}

export class CreateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(params: CreateCategoryParams): Promise<CategoryEntity> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('La categoría debe estar vinculada a una organización válida');
    }
    if (!params.name || params.name.trim() === '') {
      throw new ValidationException('El nombre de la categoría es obligatorio');
    }
    if (!params.type || (params.type !== 'PRODUCT' && params.type !== 'SERVICE')) {
      throw new ValidationException('El tipo de categoría debe ser PRODUCT o SERVICE');
    }

    return await this.repository.createCategory({
      ...params,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      icon: params.icon?.trim() || '🏷️',
      displayOrder: params.displayOrder ?? 0,
      isActive: params.isActive ?? true,
    });
  }
}

export class UpdateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string, params: UpdateCategoryParams): Promise<CategoryEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID de la categoría es requerido para actualizar');
    }
    if (params.name !== undefined && params.name.trim() === '') {
      throw new ValidationException('El nombre de la categoría no puede estar vacío');
    }
    if (params.type !== undefined && params.type !== 'PRODUCT' && params.type !== 'SERVICE') {
      throw new ValidationException('El tipo de categoría debe ser PRODUCT o SERVICE');
    }

    return await this.repository.updateCategory(id, {
      ...params,
      name: params.name !== undefined ? params.name.trim() : undefined,
      description: params.description !== undefined ? params.description?.trim() || null : undefined,
    });
  }
}

export class DeleteCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID de la categoría es requerido para eliminar');
    }
    await this.repository.deleteCategory(id);
  }
}

export class ReorderCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(organizationId: string, orderedItems: { id: string; displayOrder: number }[]): Promise<void> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido para reordenar');
    }
    if (!orderedItems || orderedItems.length === 0) {
      return;
    }
    await this.repository.reorderCategories(organizationId, orderedItems);
  }
}
