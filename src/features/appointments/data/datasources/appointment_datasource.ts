/**
 * Negocio Flex - Appointment DataSource (Fase 6)
 * Integración directa con Supabase PostgreSQL para la tabla `appointments`.
 * Respeta aislamiento multi-inquilino (organization_id) y políticas RLS.
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { AppointmentModel } from '../models/appointment_model';
import {
  CreateAppointmentParams,
  UpdateAppointmentParams,
  AppointmentFilterParams,
  AppointmentStatus,
} from '../../domain/entities/appointment_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class AppointmentDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado.');
    }
    return client;
  }

  /**
   * Obtiene la lista de citas de una organización con filtros opcionales.
   */
  async fetchAppointmentsByOrg(
    organizationId: string,
    filters?: AppointmentFilterParams
  ): Promise<AppointmentModel[]> {
    logger.info('Consultando citas en Supabase...', { organizationId, filters });
    const client = this.getClient();

    let query = client
      .from('appointments')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', AppointmentModel.normalizeStatus(filters.status));
    }

    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    } else {
      if (filters?.startDate) {
        query = query.gte('appointment_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('appointment_date', filters.endDate);
      }
    }

    if (filters?.serviceId) {
      query = query.eq('service_id', filters.serviceId);
    }

    // Ordenar cronológicamente: fecha descendente y hora ascendente
    query = query
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('Error al consultar citas en Supabase:', error);
      throw new Error(`Error al consultar citas: ${error.message}`);
    }

    let results = (data || []).map((row: Database['public']['Tables']['appointments']['Row']) =>
      AppointmentModel.fromRow(row)
    );

    // Filtrado adicional en memoria si hay término de búsqueda
    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.trim().toLowerCase();
      results = results.filter(
        a =>
          a.customerName.toLowerCase().includes(term) ||
          a.customerPhone.includes(term) ||
          a.serviceName.toLowerCase().includes(term) ||
          (a.staffName && a.staffName.toLowerCase().includes(term)) ||
          (a.notes && a.notes.toLowerCase().includes(term))
      );
    }

    return results;
  }

  /**
   * Obtiene una cita por su ID.
   */
  async fetchAppointmentById(id: string): Promise<AppointmentModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al obtener cita por ID en Supabase:', error);
      throw new Error(`Error al obtener cita: ${error.message}`);
    }

    if (!data) return null;
    return AppointmentModel.fromRow(data);
  }

  /**
   * Inserta una nueva cita en Supabase PostgreSQL.
   */
  async insertAppointment(params: CreateAppointmentParams): Promise<AppointmentModel> {
    logger.info('Insertando nueva cita en Supabase...', {
      org: params.organizationId,
      customer: params.customerName,
      date: params.appointmentDate,
      time: params.startTime,
    });
    const client = this.getClient();

    const normalizedStatus = AppointmentModel.normalizeStatus(params.status || 'PENDING');
    const appointmentId = params.id && params.id.includes('-') && !params.id.startsWith('apt-')
      ? params.id
      : crypto.randomUUID();

    const insertPayload: Database['public']['Tables']['appointments']['Insert'] = {
      id: appointmentId,
      organization_id: params.organizationId,
      service_id: params.serviceId || null,
      service_name: params.serviceName,
      service_price: Number(params.servicePrice || 0),
      duration_minutes: Number(params.durationMinutes || 30),
      staff_id: params.staffId || null,
      staff_name: params.staffName || null,
      customer_name: params.customerName.trim(),
      customer_phone: params.customerPhone.trim(),
      customer_email: params.customerEmail ? params.customerEmail.trim() : null,
      appointment_date: params.appointmentDate,
      start_time: params.startTime,
      end_time: params.endTime || params.startTime,
      status: normalizedStatus,
      notes: params.notes ? params.notes.trim() : null,
    };

    const { data, error } = await client
      .from('appointments')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('Error al insertar cita en Supabase:', error);
      if (error.message?.includes('CONFLICT_OVERLAP') || (error as any).code === '23P01') {
        throw new Error('Conflicto de concurrencia: El horario seleccionado acaba de ser reservado por otro usuario. Por favor elige otro horario.');
      }
      throw new Error(`Error al registrar cita: ${error.message}`);
    }

    return AppointmentModel.fromRow(data);
  }

  /**
   * Actualiza una cita existente en Supabase PostgreSQL.
   */
  async updateAppointment(id: string, params: UpdateAppointmentParams): Promise<AppointmentModel> {
    logger.info('Actualizando cita en Supabase...', { id, params });
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['appointments']['Update'] = {};

    if (params.serviceId !== undefined) updatePayload.service_id = params.serviceId;
    if (params.serviceName !== undefined) updatePayload.service_name = params.serviceName;
    if (params.servicePrice !== undefined) updatePayload.service_price = Number(params.servicePrice);
    if (params.durationMinutes !== undefined) updatePayload.duration_minutes = Number(params.durationMinutes);
    if (params.staffId !== undefined) updatePayload.staff_id = params.staffId;
    if (params.staffName !== undefined) updatePayload.staff_name = params.staffName;
    if (params.customerName !== undefined) updatePayload.customer_name = params.customerName.trim();
    if (params.customerPhone !== undefined) updatePayload.customer_phone = params.customerPhone.trim();
    if (params.customerEmail !== undefined) updatePayload.customer_email = params.customerEmail ? params.customerEmail.trim() : null;
    if (params.appointmentDate !== undefined) updatePayload.appointment_date = params.appointmentDate;
    if (params.startTime !== undefined) updatePayload.start_time = params.startTime;
    if (params.endTime !== undefined) updatePayload.end_time = params.endTime;
    if (params.status !== undefined) updatePayload.status = AppointmentModel.normalizeStatus(params.status);
    if (params.notes !== undefined) updatePayload.notes = params.notes ? params.notes.trim() : null;

    const { data, error } = await client
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar cita en Supabase:', error);
      if (error.message?.includes('CONFLICT_OVERLAP') || (error as any).code === '23P01') {
        throw new Error('Conflicto de concurrencia: El nuevo horario seleccionado ya se encuentra ocupado.');
      }
      throw new Error(`Error al actualizar cita: ${error.message}`);
    }

    return AppointmentModel.fromRow(data);
  }

  /**
   * Actualiza el estado de una cita.
   */
  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentModel> {
    logger.info('Actualizando estado de cita en Supabase...', { id, status });
    const client = this.getClient();

    const normalized = AppointmentModel.normalizeStatus(status);

    const { data, error } = await client
      .from('appointments')
      .update({ status: normalized })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al cambiar estado de cita en Supabase:', error);
      throw new Error(`Error al cambiar estado de cita: ${error.message}`);
    }

    return AppointmentModel.fromRow(data);
  }

  /**
   * Elimina una cita de Supabase.
   */
  async deleteAppointment(id: string): Promise<void> {
    logger.info('Eliminando cita en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar cita en Supabase:', error);
      throw new Error(`Error al eliminar cita: ${error.message}`);
    }
  }

  /**
   * Verifica solapamiento de citas en una fecha y rango de horas dado.
   * Utiliza la función RPC segura get_public_appointment_slots para permitir comprobación
   * tanto a usuarios anónimos (tienda pública) como a miembros, garantizando 0 fuga de PII.
   */
  async checkOverlap(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const client = this.getClient();

    // 1. Prioridad: RPC seguro de disponibilidad pública (sin exposición de datos privados de clientes)
    try {
      const { data: slots, error: rpcError } = await client.rpc('get_public_appointment_slots', {
        p_organization_id: organizationId,
        p_date: date,
      });

      if (!rpcError && Array.isArray(slots)) {
        return slots.some((existing: { start_time: string; end_time: string; staff_name?: string }) => {
          if (staffName && existing.staff_name && staffName.trim().toLowerCase() !== existing.staff_name.trim().toLowerCase()) {
            return false;
          }
          return existing.start_time < endTime && existing.end_time > startTime;
        });
      }
    } catch (e) {
      logger.warning('RPC get_public_appointment_slots no disponible, intentando consulta directa con RLS:', e);
    }

    // 2. Fallback: Consulta directa con RLS (para miembros autenticados del negocio)
    let query = client
      .from('appointments')
      .select('id, start_time, end_time, staff_name, status')
      .eq('organization_id', organizationId)
      .eq('appointment_date', date)
      .neq('status', 'CANCELLED');

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      logger.warning('Error consultando solapamiento en Supabase, omitiendo bloqueo estricto:', error);
      return false;
    }

    if (!data || data.length === 0) return false;

    // Verificar si algún rango de hora [start_time, end_time) se intersecta con [startTime, endTime)
    // Intersección: existingStart < newEnd && existingEnd > newStart
    return data.some(existing => {
      // Si ambos tienen especialista especificado y son distintos, no hay solapamiento de recurso
      if (staffName && existing.staff_name && staffName.trim().toLowerCase() !== existing.staff_name.trim().toLowerCase()) {
        return false;
      }
      return existing.start_time < endTime && existing.end_time > startTime;
    });
  }
}
