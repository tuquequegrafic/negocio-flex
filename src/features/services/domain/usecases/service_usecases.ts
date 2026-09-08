/**
 * Negocio Flex - Service Use Cases (Fase 4.3)
 * Casos de uso de negocio para servicios profesionales con validaciones de dominio.
 */

import { ServiceRepository } from '../repositories/service_repository';
import {
  ServiceEntity,
  CreateServiceParams,
  UpdateServiceParams,
} from '../entities/service_entity';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetServicesUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(organizationId: string): Promise<ServiceEntity[]> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido para consultar servicios');
    }
    return this.repository.getServices(organizationId);
  }
}

export class GetServiceByIdUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(id: string): Promise<ServiceEntity | null> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del servicio es requerido');
    }
    return this.repository.getServiceById(id);
  }
}

export class CreateServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(params: CreateServiceParams): Promise<ServiceEntity> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new ValidationException('El servicio debe pertenecer a una organización');
    }

    if (!params.name || params.name.trim() === '') {
      throw new ValidationException('El nombre del servicio es obligatorio');
    }

    if (params.price === undefined || params.price === null || isNaN(params.price) || params.price < 0) {
      throw new ValidationException('El precio del servicio debe ser un número mayor o igual a 0');
    }

    if (params.promoPrice !== undefined && params.promoPrice !== null) {
      if (isNaN(params.promoPrice) || params.promoPrice < 0) {
        throw new ValidationException('El precio promocional debe ser mayor o igual a 0');
      }
      if (params.promoPrice >= params.price) {
        throw new ValidationException('El precio promocional debe ser menor que el precio regular');
      }
    }

    const duration = params.durationMinutes !== undefined && !isNaN(params.durationMinutes) && params.durationMinutes > 0
      ? Math.round(params.durationMinutes)
      : 30;

    return this.repository.createService({
      ...params,
      name: params.name.trim(),
      description: params.description?.trim() || '',
      durationMinutes: duration,
      imageUrl: params.imageUrl?.trim() || null,
      isActive: params.isActive ?? true,
      isFeatured: params.isFeatured ?? false,
      displayOrder: params.displayOrder ?? 0,
    });
  }
}

export class UpdateServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(id: string, params: UpdateServiceParams): Promise<ServiceEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del servicio es requerido para actualizar');
    }

    if (params.name !== undefined && params.name.trim() === '') {
      throw new ValidationException('El nombre del servicio no puede estar vacío');
    }

    if (params.price !== undefined && (isNaN(params.price) || params.price < 0)) {
      throw new ValidationException('El precio debe ser un número mayor o igual a 0');
    }

    if (params.promoPrice !== undefined && params.promoPrice !== null) {
      if (isNaN(params.promoPrice) || params.promoPrice < 0) {
        throw new ValidationException('El precio promocional debe ser mayor o igual a 0');
      }
    }

    return this.repository.updateService(id, params);
  }
}

export class DeleteServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del servicio es requerido para eliminar');
    }
    return this.repository.deleteService(id);
  }
}

export class ToggleServiceActiveUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(id: string, isActive: boolean): Promise<ServiceEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del servicio es requerido');
    }
    return this.repository.toggleServiceActive(id, isActive);
  }
}

export class ToggleServiceFeaturedUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(id: string, isFeatured: boolean): Promise<ServiceEntity> {
    if (!id || id.trim() === '') {
      throw new ValidationException('El ID del servicio es requerido');
    }
    return this.repository.toggleServiceFeatured(id, isFeatured);
  }
}

export class ReorderServicesUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    if (!organizationId || organizationId.trim() === '') {
      throw new ValidationException('El ID de la organización es requerido para reordenar servicios');
    }

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return;
    }

    return this.repository.reorderServices(organizationId, orderedItems);
  }
}
