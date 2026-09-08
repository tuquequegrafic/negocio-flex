/**
 * Negocio Flex - Appointment Repository Implementation (Fase 6)
 * Implementación del contrato de repositorio delegando a AppointmentDataSource.
 */

import { AppointmentRepository } from '../../domain/repositories/appointment_repository';
import { AppointmentDataSource } from '../datasources/appointment_datasource';
import {
  AppointmentEntity,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  AppointmentFilterParams,
  AppointmentStatus,
} from '../../domain/entities/appointment_entity';

export class AppointmentRepositoryImpl implements AppointmentRepository {
  constructor(private readonly dataSource: AppointmentDataSource) {}

  async getAppointments(
    organizationId: string,
    filters?: AppointmentFilterParams
  ): Promise<AppointmentEntity[]> {
    return this.dataSource.fetchAppointmentsByOrg(organizationId, filters);
  }

  async getAppointmentById(id: string): Promise<AppointmentEntity | null> {
    return this.dataSource.fetchAppointmentById(id);
  }

  async createAppointment(params: CreateAppointmentParams): Promise<AppointmentEntity> {
    return this.dataSource.insertAppointment(params);
  }

  async updateAppointment(id: string, params: UpdateAppointmentParams): Promise<AppointmentEntity> {
    return this.dataSource.updateAppointment(id, params);
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentEntity> {
    return this.dataSource.updateAppointmentStatus(id, status);
  }

  async deleteAppointment(id: string): Promise<void> {
    return this.dataSource.deleteAppointment(id);
  }

  async checkOverlap(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    return this.dataSource.checkOverlap(
      organizationId,
      date,
      startTime,
      endTime,
      staffName,
      excludeAppointmentId
    );
  }
}
