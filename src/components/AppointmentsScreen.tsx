import React, { useMemo } from 'react';
import { supabaseService } from '../core/network/supabase_client';
import { formatCurrency, formatDate } from '../core/utils/formatters';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  X,
  Trash2,
  DollarSign,
  Scissors,
  Database,
  Edit3,
} from 'lucide-react';
import {
  useAppointments,
  AppointmentCard,
  AppointmentFormModal,
  AppointmentEntity,
  AppointmentStatus,
} from '../features/appointments';

export const AppointmentsScreen: React.FC = () => {
  const {
    appointments,
    filteredAppointments,
    services,
    customers,
    currency,
    orgName,
    organizationId,
    loading,
    metrics,
    searchTerm,
    selectedStatus,
    selectedServiceFilter,
    dateFilterMode,
    customDate,
    viewMode,
    isFormModalOpen,
    editingAppointment,
    deleteCandidate,
    canManageStatus,
    canReschedule,
    canDelete,
    canCreate,
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
    updateStatus,
    deleteAppointment,
    saveAppointment,
    checkOverlap,
    refreshAppointments,
  } = useAppointments();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Hourly slots for Agenda View
  const hourlySlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  ];

  const agendaAppointments = useMemo(() => {
    const targetDate = dateFilterMode === 'CUSTOM' ? customDate : todayStr;
    return appointments.filter(a => a.appointmentDate === targetDate);
  }, [appointments, dateFilterMode, customDate, todayStr]);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* 1. Header with Title, Refresh & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📅</span>
            <h1 className="text-2xl font-black text-slate-900">Agenda de Citas & Reservas</h1>
            {supabaseService.isConfigured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Database className="w-3 h-3" /> Supabase PostgreSQL
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión en tiempo real de turnos y especialistas para <strong>{orgName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAppointments()}
            disabled={loading}
            title="Refrescar citas desde Supabase"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            <span>{loading ? 'Actualizando...' : 'Recargar'}</span>
          </button>

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs active:scale-95 text-xs"
            >
              <Plus className="w-4 h-4" /> Agendar Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Citas de Hoy</span>
            <CalendarIcon className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.todayCount}</span>
          <span className="text-[10px] text-slate-400">Activas hoy</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.pendingCount}</span>
          <span className="text-[10px] text-slate-400">Por confirmar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Confirmadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.confirmedCount}</span>
          <span className="text-[10px] text-slate-400">Listas en agenda</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completadas</span>
            <Scissors className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.completedCount}</span>
          <span className="text-[10px] text-slate-400">Atendidas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Canceladas</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.cancelledCount}</span>
          <span className="text-[10px] text-slate-400">No concretadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Valor Estimado</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xl font-black text-slate-900 mt-1 block truncate">
            {formatCurrency(metrics.totalRevenueEst, currency)}
          </span>
          <span className="text-[10px] text-slate-400">En servicios agendados</span>
        </div>
      </div>

      {/* 3. Search & Comprehensive Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        {/* Search and Main Filters Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono, servicio, especialista o notas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedServiceFilter}
              onChange={e => setSelectedServiceFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="ALL">Todos los Servicios</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('AGENDA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'AGENDA'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Agenda por Horas
            </button>
          </div>
        </div>

        {/* Date & Status Pills Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL' as const, label: 'Todos' },
              { id: 'PENDING' as const, label: 'Pendientes' },
              { id: 'CONFIRMED' as const, label: 'Confirmadas' },
              { id: 'COMPLETED' as const, label: 'Completadas' },
              { id: 'CANCELLED' as const, label: 'Canceladas' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === tab.id
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setDateFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap ${
                dateFilterMode === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cualquier Fecha
            </button>
            <button
              onClick={() => setDateFilterMode('TODAY')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap ${
                dateFilterMode === 'TODAY'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilterMode('THIS_WEEK')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap ${
                dateFilterMode === 'THIS_WEEK'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setDateFilterMode('UPCOMING')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap ${
                dateFilterMode === 'UPCOMING'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Próximas
            </button>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customDate}
                onChange={e => {
                  setCustomDate(e.target.value);
                  setDateFilterMode('CUSTOM');
                }}
                className={`px-2 py-1 rounded-xl border text-xs ${
                  dateFilterMode === 'CUSTOM'
                    ? 'border-purple-600 text-purple-700 bg-purple-50 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Content Presentation: Cards Mode vs Agenda Mode */}
      {viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No se encontraron citas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'No hay citas que coincidan con los criterios de búsqueda.'
                  : 'No hay citas registradas para los filtros seleccionados.'}
              </p>
              {canCreate && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs mt-2 hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Crear Primera Cita
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                currency={currency}
                orgName={orgName}
                canManageStatus={canManageStatus}
                canReschedule={canReschedule}
                canDelete={canDelete}
                onUpdateStatus={updateStatus}
                onEdit={openEditModal}
                onDeleteRequest={a => setDeleteCandidate(a)}
              />
            ))
          )}
        </div>
      ) : (
        /* Agenda View by Hours */
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
              <span>Turnos para: {formatDate(dateFilterMode === 'CUSTOM' ? customDate : todayStr)}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {agendaAppointments.length} cita(s) programada(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {hourlySlots.map(slot => {
              const [slotH] = slot.split(':').map(Number);
              const nextHStr = `${String(slotH + 1).padStart(2, '0')}:00`;

              const slotAppointments = agendaAppointments.filter(
                a => a.startTime >= slot && a.startTime < nextHStr
              );

              return (
                <div
                  key={slot}
                  className="py-3 flex items-start gap-4 hover:bg-slate-50/50 rounded-xl transition-colors px-2"
                >
                  <div className="w-16 text-xs font-mono font-bold text-slate-400 shrink-0 pt-1">
                    {slot}
                  </div>

                  <div className="flex-1 min-h-[40px] flex flex-col gap-2">
                    {slotAppointments.length === 0 ? (
                      <div className="h-8 flex items-center text-xs text-slate-300 italic">
                        Disponible
                      </div>
                    ) : (
                      slotAppointments.map(apt => (
                        <div
                          key={apt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                              : apt.status === 'COMPLETED'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : apt.status === 'PENDING'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{apt.customerName}</span>
                              <span className="text-[11px] font-mono text-slate-500">
                                ({apt.startTime} - {apt.endTime})
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/80 border border-slate-200">
                                {apt.serviceName}
                              </span>
                            </div>
                            {apt.staffName && (
                              <span className="text-[11px] text-purple-700 block">
                                Especialista: <strong>{apt.staffName}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">
                              {formatCurrency(apt.servicePrice, currency)}
                            </span>
                            {canReschedule && (
                              <button
                                onClick={() => openEditModal(apt)}
                                className="p-1 rounded hover:bg-white/80 text-slate-600"
                                title="Editar cita"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Create / Edit Appointment Modal */}
      <AppointmentFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSubmit={saveAppointment}
        editingAppointment={editingAppointment}
        services={services}
        customers={customers}
        organizationId={organizationId}
        currency={currency}
        checkOverlap={checkOverlap}
      />

      {/* 6. Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar esta cita?</h3>
              <p className="text-xs text-slate-500">
                Esta acción eliminará permanentemente la cita de{' '}
                <strong>{deleteCandidate.customerName}</strong> para el servicio{' '}
                <strong>{deleteCandidate.serviceName}</strong> de Supabase PostgreSQL.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Conservar
              </button>
              <button
                type="button"
                onClick={() => deleteAppointment(deleteCandidate.id)}
                className="flex-1 py-2.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-2xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
