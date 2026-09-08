/**
 * Negocio Flex - Customer Repository Implementation (Fase 4.4)
 * Implementación del contrato CustomerRepository delegando al DataSource con normalización de errores.
 */

import { CustomerRepository } from '../../domain/repositories/customer_repository';
import {
  CustomerEntity,
  CreateCustomerParams,
  UpdateCustomerParams,
  CustomerProfile360,
  CustomerFilterParams,
} from '../../domain/entities/customer_entity';
import { CustomerDataSource } from '../datasources/customer_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class CustomerRepositoryImpl implements CustomerRepository {
  constructor(private readonly dataSource: CustomerDataSource) {}

  async getCustomers(organizationId: string, filter?: CustomerFilterParams): Promise<CustomerEntity[]> {
    try {
      return await this.dataSource.fetchCustomersByOrg(organizationId, filter);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getCustomerById(id: string): Promise<CustomerEntity | null> {
    try {
      return await this.dataSource.fetchCustomerById(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getCustomerProfile360(organizationId: string, customerId: string): Promise<CustomerProfile360 | null> {
    try {
      return await this.dataSource.fetchCustomerProfile360(organizationId, customerId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createCustomer(params: CreateCustomerParams): Promise<CustomerEntity> {
    try {
      return await this.dataSource.createCustomer(params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async findOrCreateCustomer(params: CreateCustomerParams): Promise<CustomerEntity> {
    try {
      return await this.dataSource.findOrCreateCustomer(params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateCustomer(id: string, params: UpdateCustomerParams): Promise<CustomerEntity> {
    try {
      return await this.dataSource.updateCustomer(id, params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.dataSource.deleteCustomer(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async searchCustomers(organizationId: string, query: string): Promise<CustomerEntity[]> {
    try {
      return await this.dataSource.searchCustomers(organizationId, query);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
