/**
 * Negocio Flex - Appointment Use Cases (Fase 6)
 * Casos de uso desacoplados que orquestan las operaciones de negocio de citas/reservas.
 */

import { AppointmentRepository } from '../repositories/appointment_repository';
import {
  AppointmentEntity,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  AppointmentFilterParams,
  AppointmentStatus,
} from '../entities/appointment_entity';
import { AppointmentStateMachine } from '../state_machine/appointment_state_machine';
import { AppointmentPermissions } from '../permissions/appointment_permissions';
import { ValidationException, UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class GetAppointmentsUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(organizationId: string, filters?: AppointmentFilterParams): Promise<AppointmentEntity[]> {
    if (!organizationId) {
      throw new Error('El ID de organización es requerido para consultar citas.');
    }
    return this.repository.getAppointments(organizationId, filters);
  }
}

export class GetAppointmentByIdUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(id: string): Promise<AppointmentEntity | null> {
    if (!id) {
      throw new Error('El ID de cita es requerido.');
    }
    return this.repository.getAppointmentById(id);
  }
}

export class CreateAppointmentUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(params: CreateAppointmentParams): Promise<AppointmentEntity> {
    if (!params.organizationId) {
      throw new Error('La organización es obligatoria.');
    }
    if (!params.customerName?.trim()) {
      throw new Error('El nombre del cliente es obligatorio.');
    }
    if (!params.customerPhone?.trim()) {
      throw new Error('El teléfono del cliente es obligatorio.');
    }
    if (!params.appointmentDate) {
      throw new Error('La fecha de la cita es obligatoria.');
    }
    if (!params.startTime) {
      throw new Error('La hora de inicio es obligatoria.');
    }

    // Calcular endTime si no viene provisto
    let calculatedEndTime = params.endTime;
    if (!calculatedEndTime && params.startTime) {
      const [hours, minutes] = params.startTime.split(':').map(Number);
      const totalMinutes = (hours * 60) + minutes + (params.durationMinutes || 30);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      calculatedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    // Validar que la hora fin no sea anterior o igual a la hora inicio
    if (calculatedEndTime && calculatedEndTime <= params.startTime) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
    }

    // Validar conflicto de horario antes de crear
    if (params.status !== 'CANCELLED') {
      const hasOverlap = await this.repository.checkOverlap(
        params.organizationId,
        params.appointmentDate,
        params.startTime,
        calculatedEndTime || params.startTime,
        params.staffName || undefined,
        params.id
      );
      if (hasOverlap) {
        throw new Error('Conflicto de horario: Ya existe otra cita activa en esa fecha y horario.');
      }
    }

    return this.repository.createAppointment({
      ...params,
      endTime: calculatedEndTime,
    });
  }
}

export class UpdateAppointmentUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(id: string, params: UpdateAppointmentParams): Promise<AppointmentEntity> {
    if (!id) {
      throw new Error('El ID de cita es requerido para actualizar.');
    }

    // Si se actualizan fecha, horas o especialista y la cita sigue activa, validar conflicto de solapamiento
    if (params.appointmentDate || params.startTime || params.endTime || params.staffName !== undefined) {
      const existing = await this.repository.getAppointmentById(id);
      if (existing && existing.status !== 'CANCELLED' && params.status !== 'CANCELLED') {
        const targetDate = params.appointmentDate || existing.appointmentDate;
        const targetStart = params.startTime || existing.startTime;
        const targetEnd = params.endTime || existing.endTime;
        const targetStaff = params.staffName !== undefined ? params.staffName : existing.staffName;

        const hasOverlap = await this.repository.checkOverlap(
          existing.organizationId,
          targetDate,
          targetStart,
          targetEnd,
          targetStaff || undefined,
          id
        );
        if (hasOverlap) {
          throw new Error('Conflicto de horario: Los nuevos datos de fecha u horario coinciden con otra cita activa.');
        }
      }
    }

    return this.repository.updateAppointment(id, params);
  }
}

export class UpdateAppointmentStatusUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(
    id: string,
    status: AppointmentStatus,
    options?: { role?: string; organizationId?: string }
  ): Promise<AppointmentEntity> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID de cita es requerido.');
    }

    const validStatuses: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationException(`Estado de cita inválido: ${status}`);
    }

    // 1. Validar RBAC si se provee rol
    if (options?.role) {
      AppointmentPermissions.assertCanUpdateStatus(options.role);
    }

    // 2. Obtener cita para verificar multi-tenant y máquina de estados
    const existing = await this.repository.getAppointmentById(id.trim());
    if (existing) {
      if (options?.organizationId && existing.organizationId !== options.organizationId) {
        throw new UnauthorizedException('No tiene autorización para modificar citas de otra organización.');
      }

      // Validación estricta de la máquina de estados
      AppointmentStateMachine.assertCanTransition(existing.status, status);
    }

    return this.repository.updateAppointmentStatus(id.trim(), status);
  }
}

export class DeleteAppointmentUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(
    id: string,
    options?: { role?: string; organizationId?: string }
  ): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID de cita es requerido para eliminar.');
    }

    // 1. Validar RBAC si se provee rol
    if (options?.role) {
      AppointmentPermissions.assertCanDelete(options.role);
    }

    // 2. Validar multi-tenancy
    const existing = await this.repository.getAppointmentById(id.trim());
    if (existing && options?.organizationId && existing.organizationId !== options.organizationId) {
      throw new UnauthorizedException('No tiene autorización para eliminar citas de otra organización.');
    }

    return this.repository.deleteAppointment(id.trim());
  }
}

export class CheckAppointmentOverlapUseCase {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    return this.repository.checkOverlap(
      organizationId,
      date,
      startTime,
      endTime,
      staffName,
      excludeAppointmentId
    );
  }
}
