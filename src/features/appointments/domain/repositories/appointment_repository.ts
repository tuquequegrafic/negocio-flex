/**
 * Negocio Flex - Appointment Repository Contract (Fase 6)
 * Contrato de repositorio abstracto para operaciones sobre citas y reservas.
 */

import {
  AppointmentEntity,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  AppointmentFilterParams,
  AppointmentStatus,
} from '../entities/appointment_entity';

export interface AppointmentRepository {
  /**
   * Obtiene la lista de citas filtradas por organización.
   */
  getAppointments(organizationId: string, filters?: AppointmentFilterParams): Promise<AppointmentEntity[]>;

  /**
   * Obtiene una cita específica por su ID.
   */
  getAppointmentById(id: string): Promise<AppointmentEntity | null>;

  /**
   * Crea una nueva cita persistida en Supabase.
   */
  createAppointment(params: CreateAppointmentParams): Promise<AppointmentEntity>;

  /**
   * Actualiza los datos de una cita existente.
   */
  updateAppointment(id: string, params: UpdateAppointmentParams): Promise<AppointmentEntity>;

  /**
   * Actualiza únicamente el estado de una cita.
   */
  updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentEntity>;

  /**
   * Elimina una cita de la base de datos.
   */
  deleteAppointment(id: string): Promise<void>;

  /**
   * Comprueba si existe conflicto de solapamiento de horarios en la fecha y rango indicado.
   */
  checkOverlap(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string
  ): Promise<boolean>;
}
