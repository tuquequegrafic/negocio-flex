import { describe, it, expect } from 'vitest';
import {
  AppointmentStateMachine,
  AppointmentPermissions,
  AppointmentEntity,
  AppointmentStatus,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  AppointmentFilterParams,
  AppointmentRepository,
  CreateAppointmentUseCase,
  UpdateAppointmentStatusUseCase,
  DeleteAppointmentUseCase,
  CheckAppointmentOverlapUseCase,
} from '../src/features/appointments';
import { ValidationException, UnauthorizedException } from '../src/core/errors/app_exceptions';

// Mock Repository for unit testing Appointments
class MockAppointmentRepository implements AppointmentRepository {
  public appointments: AppointmentEntity[] = [];

  async getAppointments(organizationId: string, filters?: AppointmentFilterParams): Promise<AppointmentEntity[]> {
    return this.appointments.filter(a => {
      if (a.organizationId !== organizationId) return false;
      if (filters?.status && filters.status !== 'ALL' && a.status !== filters.status) return false;
      if (filters?.date && a.appointmentDate !== filters.date) return false;
      return true;
    });
  }

  async getAppointmentById(id: string): Promise<AppointmentEntity | null> {
    return this.appointments.find(a => a.id === id) || null;
  }

  async createAppointment(params: CreateAppointmentParams): Promise<AppointmentEntity> {
    const newApt: AppointmentEntity = {
      id: params.id || `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: params.organizationId,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      servicePrice: params.servicePrice,
      durationMinutes: params.durationMinutes,
      staffId: params.staffId,
      staffName: params.staffName,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      appointmentDate: params.appointmentDate,
      startTime: params.startTime,
      endTime: params.endTime || '11:00',
      status: params.status || 'CONFIRMED',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    this.appointments.push(newApt);
    return newApt;
  }

  async updateAppointment(id: string, params: UpdateAppointmentParams): Promise<AppointmentEntity> {
    const idx = this.appointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    this.appointments[idx] = { ...this.appointments[idx], ...params } as AppointmentEntity;
    return this.appointments[idx];
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentEntity> {
    const idx = this.appointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    this.appointments[idx] = { ...this.appointments[idx], status };
    return this.appointments[idx];
  }

  async deleteAppointment(id: string): Promise<void> {
    this.appointments = this.appointments.filter(a => a.id !== id);
  }

  async checkOverlap(
    organizationId: string,
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    return this.appointments.some(a => {
      if (a.organizationId !== organizationId) return false;
      if (a.appointmentDate !== date) return false;
      if (a.status === 'CANCELLED') return false;
      if (excludeAppointmentId && a.id === excludeAppointmentId) return false;

      // Si ambos tienen especialista especificado y son distintos, no hay solapamiento
      if (staffName && a.staffName && staffName.trim().toLowerCase() !== a.staffName.trim().toLowerCase()) {
        return false;
      }

      // Solapamiento: existingStart < newEnd && existingEnd > newStart
      return a.startTime < endTime && a.endTime > startTime;
    });
  }
}

describe('Fase 11: Appointments - Máquina de Estados, Concurrencia y Clean Architecture', () => {
  describe('AppointmentStateMachine', () => {
    it('debe permitir el flujo operativo estándar (PENDING -> CONFIRMED -> COMPLETED)', () => {
      expect(AppointmentStateMachine.canTransition('PENDING', 'CONFIRMED').valid).toBe(true);
      expect(AppointmentStateMachine.canTransition('CONFIRMED', 'COMPLETED').valid).toBe(true);
    });

    it('debe permitir cancelaciones válidas desde PENDING y CONFIRMED', () => {
      expect(AppointmentStateMachine.canTransition('PENDING', 'CANCELLED').valid).toBe(true);
      expect(AppointmentStateMachine.canTransition('CONFIRMED', 'CANCELLED').valid).toBe(true);
    });

    it('debe rechazar cancelaciones ilegales desde citas ya realizadas (COMPLETED)', () => {
      const res = AppointmentStateMachine.canTransition('COMPLETED', 'CANCELLED');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('terminal');
    });

    it('debe rechazar transiciones regresivas o reactivaciones desde CANCELLED', () => {
      const res1 = AppointmentStateMachine.canTransition('CANCELLED', 'CONFIRMED');
      expect(res1.valid).toBe(false);
      expect(res1.reason).toContain('terminal');

      const res2 = AppointmentStateMachine.canTransition('COMPLETED', 'PENDING');
      expect(res2.valid).toBe(false);
    });

    it('debe listar correctamente los próximos estados posibles', () => {
      expect(AppointmentStateMachine.getAllowedNextStatuses('PENDING')).toEqual(['CONFIRMED', 'CANCELLED']);
      expect(AppointmentStateMachine.getAllowedNextStatuses('CONFIRMED')).toEqual(['COMPLETED', 'CANCELLED']);
      expect(AppointmentStateMachine.getAllowedNextStatuses('COMPLETED')).toEqual([]);
      expect(AppointmentStateMachine.getAllowedNextStatuses('CANCELLED')).toEqual([]);
    });
  });

  describe('AppointmentPermissions (RBAC)', () => {
    it('super_admin, owner y admin tienen control total incluyendo reagendamiento y eliminación', () => {
      const fullRoles = ['super_admin', 'owner', 'admin'];
      for (const role of fullRoles) {
        expect(AppointmentPermissions.canView(role)).toBe(true);
        expect(AppointmentPermissions.canUpdateStatus(role)).toBe(true);
        expect(AppointmentPermissions.canCancel(role)).toBe(true);
        expect(AppointmentPermissions.canReschedule(role)).toBe(true);
        expect(AppointmentPermissions.canDelete(role)).toBe(true);
        expect(() => AppointmentPermissions.assertCanUpdateStatus(role)).not.toThrow();
        expect(() => AppointmentPermissions.assertCanDelete(role)).not.toThrow();
      }
    });

    it('staff puede gestionar turnos pero no puede eliminar físicamente registros', () => {
      expect(AppointmentPermissions.canView('staff')).toBe(true);
      expect(AppointmentPermissions.canUpdateStatus('staff')).toBe(true);
      expect(AppointmentPermissions.canCancel('staff')).toBe(true);
      expect(AppointmentPermissions.canReschedule('staff')).toBe(true);
      expect(AppointmentPermissions.canDelete('staff')).toBe(false);

      expect(() => AppointmentPermissions.assertCanUpdateStatus('staff')).not.toThrow();
      expect(() => AppointmentPermissions.assertCanDelete('staff')).toThrow(UnauthorizedException);
    });

    it('viewer solo tiene lectura y se le prohíbe cualquier mutación', () => {
      expect(AppointmentPermissions.canView('viewer')).toBe(true);
      expect(AppointmentPermissions.canUpdateStatus('viewer')).toBe(false);
      expect(AppointmentPermissions.canCancel('viewer')).toBe(false);
      expect(AppointmentPermissions.canReschedule('viewer')).toBe(false);
      expect(AppointmentPermissions.canDelete('viewer')).toBe(false);

      expect(() => AppointmentPermissions.assertCanUpdateStatus('viewer')).toThrow(UnauthorizedException);
      expect(() => AppointmentPermissions.assertCanDelete('viewer')).toThrow(UnauthorizedException);
    });
  });

  describe('Prevención de Doble Reserva & Concurrencia (checkOverlap)', () => {
    it('debe detectar solapamiento de horarios en la misma fecha y especialista', async () => {
      const repo = new MockAppointmentRepository();
      await repo.createAppointment({
        id: 'apt-1',
        organizationId: 'org-1',
        serviceName: 'Corte de Cabello',
        servicePrice: 30,
        durationMinutes: 45,
        staffName: 'Pedro Barbero',
        customerName: 'Juan Pérez',
        customerPhone: '987654321',
        appointmentDate: '2026-10-15',
        startTime: '10:00',
        endTime: '10:45',
        status: 'CONFIRMED',
      });

      const checkOverlapUseCase = new CheckAppointmentOverlapUseCase(repo);

      // Mismo horario (10:15 a 11:00) -> Solapado
      const overlap1 = await checkOverlapUseCase.execute(
        'org-1',
        '2026-10-15',
        '10:15',
        '11:00',
        'Pedro Barbero'
      );
      expect(overlap1).toBe(true);

      // Horario posterior no solapado (11:00 a 11:45) -> Libre
      const overlap2 = await checkOverlapUseCase.execute(
        'org-1',
        '2026-10-15',
        '11:00',
        '11:45',
        'Pedro Barbero'
      );
      expect(overlap2).toBe(false);

      // Mismo horario pero con otro especialista -> Libre
      const overlap3 = await checkOverlapUseCase.execute(
        'org-1',
        '2026-10-15',
        '10:00',
        '10:45',
        'Ana Estilista'
      );
      expect(overlap3).toBe(false);
    });

    it('CreateAppointmentUseCase bloquea la creación de citas con horario en conflicto', async () => {
      const repo = new MockAppointmentRepository();
      const createUseCase = new CreateAppointmentUseCase(repo);

      // Crear primera cita
      await createUseCase.execute({
        organizationId: 'org-salon',
        serviceName: 'Manicure Spa',
        servicePrice: 40,
        durationMinutes: 60,
        staffName: 'Rosa',
        customerName: 'Lucía',
        customerPhone: '999111222',
        appointmentDate: '2026-11-01',
        startTime: '14:00',
        endTime: '15:00',
        status: 'CONFIRMED',
      });

      // Intentar reservar en el mismo horario con la misma especialista
      await expect(
        createUseCase.execute({
          organizationId: 'org-salon',
          serviceName: 'Pedicure',
          servicePrice: 35,
          durationMinutes: 45,
          staffName: 'Rosa',
          customerName: 'Valeria',
          customerPhone: '999333444',
          appointmentDate: '2026-11-01',
          startTime: '14:30',
          status: 'CONFIRMED',
        })
      ).rejects.toThrow(/Conflicto de horario/);
    });

    it('las citas canceladas no deben generar bloqueo para nuevos turnos', async () => {
      const repo = new MockAppointmentRepository();
      const apt = await repo.createAppointment({
        id: 'apt-cancelled',
        organizationId: 'org-salon',
        serviceName: 'Tinturado',
        servicePrice: 80,
        durationMinutes: 90,
        staffName: 'Rosa',
        customerName: 'Lucía',
        customerPhone: '999111222',
        appointmentDate: '2026-11-01',
        startTime: '16:00',
        endTime: '17:30',
        status: 'CANCELLED', // Cancelada
      });

      const checkUseCase = new CheckAppointmentOverlapUseCase(repo);
      const isBlocked = await checkUseCase.execute(
        'org-salon',
        '2026-11-01',
        '16:00',
        '17:00',
        'Rosa'
      );
      expect(isBlocked).toBe(false);
    });
  });

  describe('UseCases de Citas con Multi-Tenancy y RBAC', () => {
    it('UpdateAppointmentStatusUseCase valida multi-tenancy y máquina de estados', async () => {
      const repo = new MockAppointmentRepository();
      await repo.createAppointment({
        id: 'apt-mt-1',
        organizationId: 'org-tenant-a',
        serviceName: 'Corte',
        servicePrice: 25,
        durationMinutes: 30,
        customerName: 'Mario',
        customerPhone: '987000111',
        appointmentDate: '2026-12-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'PENDING',
      });

      const usecase = new UpdateAppointmentStatusUseCase(repo);

      // Transición válida
      const res = await usecase.execute('apt-mt-1', 'CONFIRMED', {
        organizationId: 'org-tenant-a',
        role: 'admin',
      });
      expect(res.status).toBe('CONFIRMED');

      // Transición ilegal en máquina de estados (CONFIRMED no puede pasar a PENDING)
      await expect(
        usecase.execute('apt-mt-1', 'PENDING', {
          organizationId: 'org-tenant-a',
          role: 'admin',
        })
      ).rejects.toThrow(ValidationException);

      // Intento de alteración cross-tenant
      await expect(
        usecase.execute('apt-mt-1', 'COMPLETED', {
          organizationId: 'org-tenant-b', // Distinto tenant
          role: 'admin',
        })
      ).rejects.toThrow(UnauthorizedException);

      // Intento de modificación por viewer
      await expect(
        usecase.execute('apt-mt-1', 'COMPLETED', {
          organizationId: 'org-tenant-a',
          role: 'viewer',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('DeleteAppointmentUseCase valida permisos de rol y pertenencia de organización', async () => {
      const repo = new MockAppointmentRepository();
      await repo.createAppointment({
        id: 'apt-del-1',
        organizationId: 'org-tenant-a',
        serviceName: 'Masaje',
        servicePrice: 60,
        durationMinutes: 50,
        customerName: 'Elena',
        customerPhone: '987222333',
        appointmentDate: '2026-12-05',
        startTime: '15:00',
        endTime: '15:50',
        status: 'PENDING',
      });

      const deleteUseCase = new DeleteAppointmentUseCase(repo);

      // Staff no puede eliminar citas
      await expect(
        deleteUseCase.execute('apt-del-1', {
          organizationId: 'org-tenant-a',
          role: 'staff',
        })
      ).rejects.toThrow(UnauthorizedException);

      // Tenant ajeno no puede eliminar
      await expect(
        deleteUseCase.execute('apt-del-1', {
          organizationId: 'org-tenant-b',
          role: 'owner',
        })
      ).rejects.toThrow(UnauthorizedException);

      // Owner del tenant puede eliminar correctamente
      await deleteUseCase.execute('apt-del-1', {
        organizationId: 'org-tenant-a',
        role: 'owner',
      });

      const check = await repo.getAppointmentById('apt-del-1');
      expect(check).toBeNull();
    });
  });
});
