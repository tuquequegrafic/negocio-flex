/**
 * Negocio Flex - Service Repository Contract (Fase 4.3)
 * Interfaz formal para las operaciones de servicios en la capa de dominio.
 */

import {
  ServiceEntity,
  CreateServiceParams,
  UpdateServiceParams,
} from '../entities/service_entity';

export interface ServiceRepository {
  /**
   * Obtiene todos los servicios de una organización
   */
  getServices(organizationId: string): Promise<ServiceEntity[]>;

  /**
   * Obtiene un servicio por su ID
   */
  getServiceById(id: string): Promise<ServiceEntity | null>;

  /**
   * Crea un nuevo servicio
   */
  createService(params: CreateServiceParams): Promise<ServiceEntity>;

  /**
   * Actualiza un servicio existente
   */
  updateService(id: string, params: UpdateServiceParams): Promise<ServiceEntity>;

  /**
   * Elimina un servicio por ID
   */
  deleteService(id: string): Promise<void>;

  /**
   * Alterna el estado activo / inactivo de un servicio
   */
  toggleServiceActive(id: string, isActive: boolean): Promise<ServiceEntity>;

  /**
   * Alterna el estado destacado de un servicio
   */
  toggleServiceFeatured(id: string, isFeatured: boolean): Promise<ServiceEntity>;

  /**
   * Reordena servicios en la organización
   */
  reorderServices(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void>;
}
