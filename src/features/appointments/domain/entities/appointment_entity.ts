/**
 * Negocio Flex - Appointment Domain Entity & Parameters (Fase 6)
 * Entidades y tipos de dominio para el módulo de Citas y Reservas.
 */

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentEntity {
  id: string;
  organizationId: string;
  serviceId?: string | null;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  staffId?: string | null;
  staffName?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  appointmentDate: string; // Formato YYYY-MM-DD
  startTime: string;       // Formato HH:mm
  endTime: string;         // Formato HH:mm
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentParams {
  id?: string;
  organizationId: string;
  serviceId?: string | null;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  staffId?: string | null;
  staffName?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface UpdateAppointmentParams {
  serviceId?: string | null;
  serviceName?: string;
  servicePrice?: number;
  durationMinutes?: number;
  staffId?: string | null;
  staffName?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface AppointmentFilterParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus | 'ALL';
  serviceId?: string;
  searchTerm?: string;
}
