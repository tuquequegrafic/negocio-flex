/**
 * Negocio Flex - Product Use Cases (Fase 4.2)
 * Casos de uso de negocio para productos con validaciones de dominio.
 */

import { ProductRepository } from '../repositories/product_repository';
import {
  ProductEntity,
  CreateProductParams,
  UpdateProductParams,
} from '../entities/product_entity';
import { InventoryPermissions } from '../../../inventory/domain/permissions/inventory_permissions';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(organizationId: string): Promise<ProductEntity[]> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido para consultar productos');
    }
    return this.repository.getProducts(organizationId);
  }
}

export class GetProductByIdUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string): Promise<ProductEntity | null> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del producto es requerido');
    }
    return this.repository.getProductById(id);
  }
}

export class CreateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(
    params: CreateProductParams,
    options?: { userRole?: string }
  ): Promise<ProductEntity> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('El producto debe pertenecer a una organización');
    }

    if (!params.name || params.name.trim() === '') {
      throw new ValidationException('El nombre del producto es obligatorio');
    }

    if (params.price === undefined || params.price === null || isNaN(params.price) || params.price < 0) {
      throw new ValidationException('El precio del producto debe ser un número mayor o igual a 0');
    }

    if (params.costPrice !== undefined && params.costPrice !== null) {
      if (isNaN(params.costPrice) || params.costPrice < 0) {
        throw new ValidationException('El precio de costo no puede ser negativo');
      }
      if (options?.userRole) {
        InventoryPermissions.assertCanModifyCost(options.userRole);
      }
    }

    if (params.promoPrice !== undefined && params.promoPrice !== null) {
      if (isNaN(params.promoPrice) || params.promoPrice < 0) {
        throw new ValidationException('El precio promocional debe ser mayor o igual a 0');
      }
      if (params.promoPrice >= params.price) {
        throw new ValidationException('El precio promocional debe ser menor que el precio regular');
      }
    }

    // Validación de unicidad de SKU en la organización
    if (params.sku && params.sku.trim() !== '') {
      const trimmedSku = params.sku.trim().toUpperCase();
      const existingWithSku = await this.repository.findBySku(params.organizationId, trimmedSku);
      if (existingWithSku) {
        throw new ValidationException(`Ya existe un producto con el código SKU "${trimmedSku}" en esta organización.`);
      }
    }

    return this.repository.createProduct({
      ...params,
      name: params.name.trim(),
      sku: params.sku ? params.sku.trim().toUpperCase() : undefined,
      barcode: params.barcode ? params.barcode.trim() : undefined,
      description: params.description?.trim() || '',
      costPrice: params.costPrice !== undefined && params.costPrice >= 0 ? params.costPrice : 0,
      stock: params.stock !== undefined && params.stock >= 0 ? params.stock : 999,
      trackInventory: params.trackInventory ?? true,
      minStockAlert: params.minStockAlert !== undefined && params.minStockAlert >= 0 ? params.minStockAlert : 5,
      allowNegativeStock: params.allowNegativeStock ?? false,
      isActive: params.isActive ?? true,
      isFeatured: params.isFeatured ?? false,
      displayOrder: params.displayOrder ?? 0,
      images: params.images || [],
    });
  }
}

export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(
    id: string,
    params: UpdateProductParams,
    options?: { userRole?: string; organizationId?: string }
  ): Promise<ProductEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del producto es requerido para actualizar');
    }

    if (params.name !== undefined && params.name.trim() === '') {
      throw new ValidationException('El nombre del producto no puede estar vacío');
    }

    if (params.price !== undefined && (isNaN(params.price) || params.price < 0)) {
      throw new ValidationException('El precio debe ser un número mayor o igual a 0');
    }

    if (params.costPrice !== undefined) {
      if (isNaN(params.costPrice) || params.costPrice < 0) {
        throw new ValidationException('El precio de costo no puede ser negativo');
      }
      if (options?.userRole) {
        InventoryPermissions.assertCanModifyCost(options.userRole);
      }
    }

    // Si se modifica el SKU, verificar unicidad
    if (params.sku && params.sku.trim() !== '' && options?.organizationId) {
      const trimmedSku = params.sku.trim().toUpperCase();
      const existingWithSku = await this.repository.findBySku(options.organizationId, trimmedSku);
      if (existingWithSku && existingWithSku.id !== id) {
        throw new ValidationException(`Ya existe otro producto con el código SKU "${trimmedSku}" en esta organización.`);
      }
    }

    return this.repository.updateProduct(id, {
      ...params,
      sku: params.sku ? params.sku.trim().toUpperCase() : undefined,
    });
  }
}

export class GetLowStockProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(organizationId: string): Promise<ProductEntity[]> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido.');
    }
    const products = await this.repository.getProducts(organizationId);
    return products.filter(p => p.trackInventory && (p.stockAlertLevel === 'LOW_STOCK' || p.stockAlertLevel === 'OUT_OF_STOCK'));
  }
}


export class DeleteProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del producto es requerido para eliminar');
    }
    return this.repository.deleteProduct(id);
  }
}

export class ToggleProductActiveUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string, isActive: boolean): Promise<ProductEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del producto es requerido');
    }
    return this.repository.toggleProductActive(id, isActive);
  }
}

export class ToggleProductFeaturedUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string, isFeatured: boolean): Promise<ProductEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del producto es requerido');
    }
    return this.repository.toggleProductFeatured(id, isFeatured);
  }
}

export class ReorderProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido para reordenar productos');
    }

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return;
    }

    return this.repository.reorderProducts(organizationId, orderedItems);
  }
}
