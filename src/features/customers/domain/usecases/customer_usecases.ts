/**
 * Negocio Flex - Customer Use Cases (Fase 4.4 & Fase 8)
 * Capa de Aplicación - Lógica pura de negocio para el módulo de Clientes / CRM.
 * Desacoplada de frameworks, UI y fuentes de datos directas.
 */

import { CustomerRepository } from '../repositories/customer_repository';
import {
  CustomerEntity,
  CreateCustomerParams,
  UpdateCustomerParams,
  CustomerProfile360,
  CustomerFilterParams,
} from '../entities/customer_entity';
import { ValidationException } from '../../../../core/errors/app_exceptions';
import { normalizePhone } from '../../../../core/utils/phone_utils';

/**
 * Caso de uso: Obtener todos los clientes de una organización
 */
export class GetCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(organizationId: string, filter?: CustomerFilterParams): Promise<CustomerEntity[]> {
    if (!organizationId || !organizationId.trim()) {
      throw new ValidationException('El ID de organización es obligatorio');
    }
    return this.repository.getCustomers(organizationId, filter);
  }
}

/**
 * Caso de uso: Obtener cliente por ID
 */
export class GetCustomerByIdUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string): Promise<CustomerEntity | null> {
    if (!id || !id.trim()) {
      throw new ValidationException('El ID del cliente es obligatorio');
    }
    return this.repository.getCustomerById(id);
  }
}

/**
 * Caso de uso: Obtener la ficha 360° consolidada del cliente
 */
export class GetCustomerProfile360UseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(organizationId: string, customerId: string): Promise<CustomerProfile360 | null> {
    if (!organizationId || !organizationId.trim()) {
      throw new ValidationException('El ID de organización es obligatorio');
    }
    if (!customerId || !customerId.trim()) {
      throw new ValidationException('El ID del cliente es obligatorio');
    }
    return this.repository.getCustomerProfile360(organizationId, customerId);
  }
}

/**
 * Caso de uso: Buscar o crear cliente automáticamente (Idempotente para Checkout y Citas)
 */
export class FindOrCreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(params: CreateCustomerParams): Promise<CustomerEntity> {
    if (!params.organizationId || !params.organizationId.trim()) {
      throw new ValidationException('El ID de organización es obligatorio');
    }
    const trimmedName = params.name ? params.name.trim() : '';
    if (!trimmedName || trimmedName.length < 2) {
      throw new ValidationException('El nombre del cliente debe tener al menos 2 caracteres');
    }
    
    const canonicalPhone = normalizePhone(params.phone);
    if (!canonicalPhone || canonicalPhone.length < 6) {
      throw new ValidationException('El teléfono debe tener al menos 6 dígitos válidos');
    }

    return this.repository.findOrCreateCustomer({
      ...params,
      name: trimmedName,
      phone: canonicalPhone,
      email: params.email?.trim() || undefined,
      address: params.address?.trim() || undefined,
      reference: params.reference?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
    });
  }
}

/**
 * Caso de uso: Registrar un nuevo cliente con validaciones de negocio
 */
export class CreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(params: CreateCustomerParams): Promise<CustomerEntity> {
    if (!params.organizationId || !params.organizationId.trim()) {
      throw new ValidationException('El ID de organización es requerido para registrar el cliente');
    }

    const trimmedName = params.name ? params.name.trim() : '';
    if (!trimmedName) {
      throw new ValidationException('El nombre del cliente es obligatorio');
    }
    if (trimmedName.length < 2) {
      throw new ValidationException('El nombre del cliente debe tener al menos 2 caracteres');
    }

    const canonicalPhone = normalizePhone(params.phone);
    if (!canonicalPhone || canonicalPhone.length < 6) {
      throw new ValidationException('El número de teléfono debe tener al menos 6 dígitos válidos');
    }

    if (params.email && params.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email.trim())) {
        throw new ValidationException('El formato del correo electrónico ingresado no es válido');
      }
    }

    return this.repository.createCustomer({
      ...params,
      name: trimmedName,
      phone: canonicalPhone,
      email: params.email?.trim() || undefined,
      address: params.address?.trim() || undefined,
      reference: params.reference?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      totalOrders: params.totalOrders ?? 0,
      totalSpent: params.totalSpent ?? 0,
    });
  }
}

/**
 * Caso de uso: Actualizar datos de un cliente existente
 */
export class UpdateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string, params: UpdateCustomerParams): Promise<CustomerEntity> {
    if (!id || !id.trim()) {
      throw new ValidationException('El ID del cliente es obligatorio para actualizar');
    }

    if (params.name !== undefined) {
      const trimmedName = params.name.trim();
      if (!trimmedName) {
        throw new ValidationException('El nombre del cliente no puede estar vacío');
      }
      if (trimmedName.length < 2) {
        throw new ValidationException('El nombre del cliente debe tener al menos 2 caracteres');
      }
    }

    let canonicalPhone: string | undefined = undefined;
    if (params.phone !== undefined) {
      canonicalPhone = normalizePhone(params.phone);
      if (!canonicalPhone || canonicalPhone.length < 6) {
        throw new ValidationException('El número de teléfono debe tener al menos 6 dígitos válidos');
      }
    }

    if (params.email !== undefined && params.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email.trim())) {
        throw new ValidationException('El formato del correo electrónico ingresado no es válido');
      }
    }

    return this.repository.updateCustomer(id, {
      ...params,
      name: params.name !== undefined ? params.name.trim() : undefined,
      phone: canonicalPhone,
      email: params.email !== undefined ? (params.email.trim() || undefined) : undefined,
      address: params.address !== undefined ? (params.address.trim() || undefined) : undefined,
      reference: params.reference !== undefined ? (params.reference.trim() || undefined) : undefined,
      notes: params.notes !== undefined ? (params.notes.trim() || undefined) : undefined,
    });
  }
}

/**
 * Caso de uso: Eliminar un cliente por su ID
 */
export class DeleteCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new ValidationException('El ID del cliente a eliminar es obligatorio');
    }
    return this.repository.deleteCustomer(id);
  }
}

/**
 * Caso de uso: Buscar clientes por texto en una organización
 */
export class SearchCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(organizationId: string, query: string): Promise<CustomerEntity[]> {
    if (!organizationId || !organizationId.trim()) {
      throw new ValidationException('El ID de organización es requerido');
    }
    return this.repository.searchCustomers(organizationId, query.trim());
  }
}
