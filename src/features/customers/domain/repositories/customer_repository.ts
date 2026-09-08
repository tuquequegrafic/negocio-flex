/**
 * Negocio Flex - Customer Repository Contract (Fase 4.4)
 * Contrato formal para la persistencia y consulta del módulo de Clientes en Dominio.
 */

import {
  CustomerEntity,
  CreateCustomerParams,
  UpdateCustomerParams,
  CustomerProfile360,
  CustomerFilterParams,
} from '../entities/customer_entity';

export interface CustomerRepository {
  /**
   * Obtiene todos los clientes de una organización ordenados por fecha de creación o compras.
   */
  getCustomers(organizationId: string, filter?: CustomerFilterParams): Promise<CustomerEntity[]>;

  /**
   * Obtiene un cliente por su ID único.
   */
  getCustomerById(id: string): Promise<CustomerEntity | null>;

  /**
   * Obtiene la ficha consolidada 360° del cliente con pedidos, citas y métricas.
   */
  getCustomerProfile360(organizationId: string, customerId: string): Promise<CustomerProfile360 | null>;

  /**
   * Registra un nuevo cliente en la organización.
   */
  createCustomer(params: CreateCustomerParams): Promise<CustomerEntity>;

  /**
   * Busca cliente por teléfono en la organización; si existe lo actualiza, si no lo crea.
   */
  findOrCreateCustomer(params: CreateCustomerParams): Promise<CustomerEntity>;

  /**
   * Actualiza datos de un cliente existente.
   */
  updateCustomer(id: string, params: UpdateCustomerParams): Promise<CustomerEntity>;

  /**
   * Elimina un cliente por su ID.
   */
  deleteCustomer(id: string): Promise<void>;

  /**
   * Busca clientes en la organización por nombre, teléfono, email o dirección.
   */
  searchCustomers(organizationId: string, query: string): Promise<CustomerEntity[]>;
}
