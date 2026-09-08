/**
 * Negocio Flex - Service Repository Implementation (Fase 4.3)
 * Implementación del contrato ServiceRepository delegando al DataSource con normalización de errores.
 */

import { ServiceRepository } from '../../domain/repositories/service_repository';
import {
  ServiceEntity,
  CreateServiceParams,
  UpdateServiceParams,
} from '../../domain/entities/service_entity';
import { ServiceDataSource } from '../datasources/service_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class ServiceRepositoryImpl implements ServiceRepository {
  constructor(private readonly dataSource: ServiceDataSource) {}

  async getServices(organizationId: string): Promise<ServiceEntity[]> {
    try {
      return await this.dataSource.fetchServicesByOrg(organizationId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getServiceById(id: string): Promise<ServiceEntity | null> {
    try {
      return await this.dataSource.fetchServiceById(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createService(params: CreateServiceParams): Promise<ServiceEntity> {
    try {
      return await this.dataSource.createService(params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateService(id: string, params: UpdateServiceParams): Promise<ServiceEntity> {
    try {
      return await this.dataSource.updateService(id, params);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      await this.dataSource.deleteService(id);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async toggleServiceActive(id: string, isActive: boolean): Promise<ServiceEntity> {
    try {
      return await this.dataSource.toggleServiceActive(id, isActive);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async toggleServiceFeatured(id: string, isFeatured: boolean): Promise<ServiceEntity> {
    try {
      return await this.dataSource.toggleServiceFeatured(id, isFeatured);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async reorderServices(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    try {
      await this.dataSource.reorderServices(organizationId, orderedItems);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
