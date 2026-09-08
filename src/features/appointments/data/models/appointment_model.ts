/**
 * Negocio Flex - Appointment Model (Fase 6)
 * Modelo de datos con mapeo bidireccional entre la tabla `appointments` de Supabase PostgreSQL,
 * la entidad de Dominio `AppointmentEntity` y la interfaz UI legacy `Appointment`.
 */

import { Database } from '../../../../types/database.types';
import { AppointmentEntity, AppointmentStatus } from '../../domain/entities/appointment_entity';
import { Appointment } from '../../../../types';

export class AppointmentModel implements AppointmentEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly serviceName: string,
    public readonly servicePrice: number,
    public readonly durationMinutes: number,
    public readonly customerName: string,
    public readonly customerPhone: string,
    public readonly appointmentDate: string,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly status: AppointmentStatus = 'PENDING',
    public readonly serviceId?: string | null,
    public readonly staffId?: string | null,
    public readonly staffName?: string | null,
    public readonly customerEmail?: string | null,
    public readonly notes?: string | null,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt?: string
  ) {}

  /**
   * Normaliza el estado para respetar el CHECK constraint de la base de datos:
   * CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))
   */
  static normalizeStatus(raw?: string | null): AppointmentStatus {
    if (!raw) return 'PENDING';
    const upper = raw.trim().toUpperCase();
    if (upper === 'PENDIENTE' || upper === 'PENDING') return 'PENDING';
    if (upper === 'CONFIRMADA' || upper === 'CONFIRMADO' || upper === 'CONFIRMED') return 'CONFIRMED';
    if (upper === 'COMPLETADA' || upper === 'COMPLETADO' || upper === 'COMPLETED' || upper === 'FINALIZADO') return 'COMPLETED';
    if (upper === 'CANCELADA' || upper === 'CANCELADO' || upper === 'CANCELLED' || upper === 'NO_ASISTIO') return 'CANCELLED';
    return 'PENDING';
  }

  /**
   * Mapea una fila devuelta por Supabase PostgreSQL (appointments)
   */
  static fromRow(row: Database['public']['Tables']['appointments']['Row']): AppointmentModel {
    return new AppointmentModel(
      row.id,
      row.organization_id,
      row.service_name || 'Servicio General',
      Number(row.service_price ?? 0),
      Number(row.duration_minutes ?? 30),
      row.customer_name || 'Cliente',
      row.customer_phone || '',
      row.appointment_date,
      row.start_time,
      row.end_time,
      AppointmentModel.normalizeStatus(row.status),
      row.service_id,
      row.staff_id,
      row.staff_name,
      row.customer_email,
      row.notes,
      row.created_at || new Date().toISOString(),
      row.updated_at
    );
  }

  /**
   * Genera el payload para INSERT o UPDATE en la tabla Supabase PostgreSQL `appointments`.
   */
  toRow(): Partial<Database['public']['Tables']['appointments']['Insert']> {
    return {
      organization_id: this.organizationId,
      service_id: this.serviceId || null,
      service_name: this.serviceName,
      service_price: this.servicePrice,
      duration_minutes: this.durationMinutes,
      staff_id: this.staffId || null,
      staff_name: this.staffName || null,
      customer_name: this.customerName,
      customer_phone: this.customerPhone,
      customer_email: this.customerEmail || null,
      appointment_date: this.appointmentDate,
      start_time: this.startTime,
      end_time: this.endTime,
      status: this.status,
      notes: this.notes || null,
    };
  }

  /**
   * Convierte la entidad de Dominio a la interfaz UI legacy `Appointment`
   */
  toLegacy(): Appointment {
    return {
      id: this.id,
      organization_id: this.organizationId,
      service_id: this.serviceId || '',
      service_name: this.serviceName,
      service_price: this.servicePrice,
      duration_minutes: this.durationMinutes,
      staff_id: this.staffId || undefined,
      staff_name: this.staffName || undefined,
      customer_name: this.customerName,
      customer_phone: this.customerPhone,
      customer_email: this.customerEmail || undefined,
      appointment_date: this.appointmentDate,
      start_time: this.startTime,
      end_time: this.endTime,
      status: this.status,
      notes: this.notes || undefined,
      created_at: this.createdAt,
    };
  }

  /**
   * Convierte desde la interfaz UI legacy `Appointment`
   */
  static fromLegacy(legacy: Appointment): AppointmentModel {
    return new AppointmentModel(
      legacy.id,
      legacy.organization_id,
      legacy.service_name,
      Number(legacy.service_price || 0),
      Number(legacy.duration_minutes || 30),
      legacy.customer_name,
      legacy.customer_phone,
      legacy.appointment_date,
      legacy.start_time,
      legacy.end_time,
      AppointmentModel.normalizeStatus(legacy.status),
      legacy.service_id || null,
      legacy.staff_id || null,
      legacy.staff_name || null,
      legacy.customer_email || null,
      legacy.notes || null,
      legacy.created_at || new Date().toISOString()
    );
  }
}
