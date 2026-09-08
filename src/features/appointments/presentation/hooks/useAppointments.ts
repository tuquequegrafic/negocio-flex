/**
 * Negocio Flex - useAppointments Hook (Fase 11: Presentación Desacoplada)
 * Hook orquestador de estado y casos de uso para Citas y Reservas.
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import {
  AppointmentEntity,
  AppointmentStatus,
  CreateAppointmentParams,
  UpdateAppointmentParams,
} from '../../domain/entities/appointment_entity';
import { AppointmentStateMachine } from '../../domain/state_machine/appointment_state_machine';
import { AppointmentPermissions } from '../../domain/permissions/appointment_permissions';

export function useAppointments() {
  const {
    currentOrg,
    appointments: rawAppointments,
    appointmentsLoading,
    refreshAppointments,
    services,
    customers,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
    createAppointment,
    checkAppointmentOverlap,
  } = useApp();

  const currency = currentOrg?.settings?.currency || 'S/';
  const orgName = currentOrg?.name || 'Negocio';
  const role = (currentOrg as any)?.role || 'owner';

  // Role permissions
  const canManageStatus = useMemo(() => AppointmentPermissions.canUpdateStatus(role), [role]);
  const canReschedule = useMemo(() => AppointmentPermissions.canReschedule(role), [role]);
  const canDelete = useMemo(() => AppointmentPermissions.canDelete(role), [role]);
  const canCreate = useMemo(() => AppointmentPermissions.canCreateInternal(role), [role]);

  // Normalized list of Appointments for currentOrg
  const orgAppointments = useMemo(() => {
    return (rawAppointments || [])
      .filter(a => a.organization_id === currentOrg?.id)
      .map(
        (a): AppointmentEntity => ({
          id: a.id,
          organizationId: a.organization_id,
          serviceId: a.service_id,
          serviceName: a.service_name,
          servicePrice: a.service_price,
          durationMinutes: a.duration_minutes,
          staffId: a.staff_id,
          staffName: a.staff_name,
          customerName: a.customer_name,
          customerPhone: a.customer_phone,
          customerEmail: a.customer_email,
          appointmentDate: a.appointment_date,
          startTime: a.start_time,
          endTime: a.end_time,
          status: a.status as AppointmentStatus,
          notes: a.notes,
          createdAt: a.created_at,
          updatedAt: (a as any).updated_at,
        })
      );
  }, [rawAppointments, currentOrg?.id]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'UPCOMING' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'CARDS' | 'AGENDA'>('CARDS');

  // Modals & Candidates
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentEntity | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AppointmentEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return orgAppointments.filter(apt => {
      // 1. Status Filter
      if (selectedStatus !== 'ALL' && apt.status !== selectedStatus) {
        return false;
      }

      // 2. Service Filter
      if (selectedServiceFilter !== 'ALL' && apt.serviceId !== selectedServiceFilter) {
        return false;
      }

      // 3. Date Filter
      if (dateFilterMode === 'TODAY') {
        if (apt.appointmentDate !== todayStr) return false;
      } else if (dateFilterMode === 'UPCOMING') {
        if (apt.appointmentDate < todayStr) return false;
      } else if (dateFilterMode === 'THIS_WEEK') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(now);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const aptD = new Date(apt.appointmentDate);
        if (aptD < startOfWeek || aptD > endOfWeek) return false;
      } else if (dateFilterMode === 'CUSTOM') {
        if (apt.appointmentDate !== customDate) return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCust = apt.customerName.toLowerCase().includes(term);
        const matchesPhone = apt.customerPhone.includes(term);
        const matchesService = apt.serviceName.toLowerCase().includes(term);
        const matchesStaff = apt.staffName ? apt.staffName.toLowerCase().includes(term) : false;
        const matchesNotes = apt.notes ? apt.notes.toLowerCase().includes(term) : false;
        if (!matchesCust && !matchesPhone && !matchesService && !matchesStaff && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [
    orgAppointments,
    selectedStatus,
    selectedServiceFilter,
    dateFilterMode,
    customDate,
    searchTerm,
    todayStr,
  ]);

  // Metrics
  const metrics = useMemo(() => {
    const total = orgAppointments.length;
    const todayCount = orgAppointments.filter(
      a => a.appointmentDate === todayStr && a.status !== 'CANCELLED'
    ).length;
    const pendingCount = orgAppointments.filter(a => a.status === 'PENDING').length;
    const confirmedCount = orgAppointments.filter(a => a.status === 'CONFIRMED').length;
    const completedCount = orgAppointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledCount = orgAppointments.filter(a => a.status === 'CANCELLED').length;
    const totalRevenueEst = orgAppointments
      .filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
      .reduce((acc, a) => acc + (a.servicePrice || 0), 0);

    return {
      total,
      todayCount,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalRevenueEst,
    };
  }, [orgAppointments, todayStr]);

  // Open / Close Form Modal
  const openCreateModal = useCallback(() => {
    setEditingAppointment(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((appointment: AppointmentEntity) => {
    setEditingAppointment(appointment);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingAppointment(null);
  }, []);

  // Update Status with State Machine Assertion
  const handleUpdateStatus = useCallback(
    async (id: string, nextStatus: AppointmentStatus) => {
      const target = orgAppointments.find(a => a.id === id);
      if (!target) return;

      AppointmentPermissions.assertCanUpdateStatus(role);
      AppointmentStateMachine.assertCanTransition(target.status, nextStatus);

      await updateAppointmentStatus(id, nextStatus);
    },
    [orgAppointments, role, updateAppointmentStatus]
  );

  // Delete Appointment with RBAC Assertion
  const handleDeleteAppointment = useCallback(
    async (id: string) => {
      AppointmentPermissions.assertCanDelete(role);
      setIsDeleting(true);
      try {
        await deleteAppointment(id);
        setDeleteCandidate(null);
      } finally {
        setIsDeleting(false);
      }
    },
    [role, deleteAppointment]
  );

  // Save (Create or Update)
  const handleSaveAppointment = useCallback(
    async (params: CreateAppointmentParams | UpdateAppointmentParams) => {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, {
          service_id: params.serviceId,
          service_name: params.serviceName,
          service_price: params.servicePrice,
          duration_minutes: params.durationMinutes,
          staff_name: params.staffName,
          customer_name: params.customerName,
          customer_phone: params.customerPhone,
          customer_email: params.customerEmail,
          appointment_date: params.appointmentDate,
          start_time: params.startTime,
          end_time: params.endTime,
          status: params.status,
          notes: params.notes,
        });
      } else {
        await createAppointment({
          organization_id: currentOrg.id,
          service_id: params.serviceId,
          service_name: params.serviceName || 'Servicio',
          service_price: params.servicePrice || 0,
          duration_minutes: params.durationMinutes || 30,
          staff_name: params.staffName,
          customer_name: params.customerName || 'Cliente',
          customer_phone: params.customerPhone || '',
          customer_email: params.customerEmail,
          appointment_date: params.appointmentDate || todayStr,
          start_time: params.startTime || '10:00',
          end_time: params.endTime || '10:30',
          status: params.status || 'CONFIRMED',
          notes: params.notes,
        });
      }
    },
    [editingAppointment, updateAppointment, createAppointment, currentOrg?.id, todayStr]
  );

  return {
    appointments: orgAppointments,
    filteredAppointments,
    services: (services || []).filter(s => s.organization_id === currentOrg?.id),
    customers: (customers || []).filter(c => c.organization_id === currentOrg?.id),
    currency,
    orgName,
    organizationId: currentOrg?.id || '',
    loading: appointmentsLoading,
    metrics,
    // Filters
    searchTerm,
    selectedStatus,
    selectedServiceFilter,
    dateFilterMode,
    customDate,
    viewMode,
    // Modals
    isFormModalOpen,
    editingAppointment,
    deleteCandidate,
    isDeleting,
    // Permissions
    canManageStatus,
    canReschedule,
    canDelete,
    canCreate,
    // Actions & Setters
    setSearchTerm,
    setSelectedStatus,
    setSelectedServiceFilter,
    setDateFilterMode,
    setCustomDate,
    setViewMode,
    setDeleteCandidate,
    openCreateModal,
    openEditModal,
    closeFormModal,
    updateStatus: handleUpdateStatus,
    deleteAppointment: handleDeleteAppointment,
    saveAppointment: handleSaveAppointment,
    checkOverlap: checkAppointmentOverlap,
    refreshAppointments,
  };
}
