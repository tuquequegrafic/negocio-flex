import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateWhatsAppLink } from '../core/utils/formatters';
import { Appointment, AppointmentStatus } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Search,
  Sparkles,
  MessageCircle
} from 'lucide-react';

export const AppointmentsScreen: React.FC = () => {
  const { currentOrg, appointments, services, updateAppointmentStatus, createAppointment } = useApp();
  const orgAppointments = appointments.filter(a => a.organization_id === currentOrg.id);
  const orgServices = services.filter(s => s.organization_id === currentOrg.id);
  const currency = currentOrg.settings?.currency || 'S/';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState(orgServices[0]?.id || '');
  const [staffName, setStaffName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('16:00');
  const [notes, setNotes] = useState('');

  const filteredAppointments = orgAppointments.filter(a => {
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    const matchesSearch = a.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.customer_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !serviceId) return;

    const serv = orgServices.find(s => s.id === serviceId);
    if (!serv) return;

    createAppointment({
      organization_id: currentOrg.id,
      service_id: serv.id,
      service_name: serv.name,
      service_price: serv.price,
      duration_minutes: serv.duration_minutes,
      staff_name: staffName || undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: '17:00',
      status: 'CONFIRMED',
      notes: notes || undefined
    });

    setIsModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Citas & Reservas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Turnos sincronizados en tiempo real para <strong>{currentOrg.name}</strong>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-sm active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" /> Agendar Nueva Cita
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, servicio o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === st ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No hay citas registradas</h3>
            <p className="text-xs text-slate-400">Las reservas hechas por clientes o agendadas manualmente aparecerán aquí.</p>
          </div>
        ) : (
          filteredAppointments.map(apt => (
            <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] uppercase font-mono">{apt.appointment_date.split('-')[1]}/{apt.appointment_date.split('-')[2]}</span>
                    <span className="text-xs">{apt.start_time}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{apt.service_name}</h3>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Duración: {apt.duration_minutes} min • <strong>{formatCurrency(apt.service_price, currency)}</strong>
                    </span>
                    {apt.staff_name && (
                      <span className="text-[11px] text-purple-600 font-semibold block mt-0.5">
                        Especialista: {apt.staff_name}
                      </span>
                    )}
                  </div>
                </div>

                <select
                  value={apt.status}
                  onChange={e => updateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
                    apt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    apt.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    apt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="PENDING">PENDIENTE</option>
                  <option value="CONFIRMED">CONFIRMADO</option>
                  <option value="COMPLETED">COMPLETADO</option>
                  <option value="CANCELLED">CANCELADO</option>
                </select>
              </div>

              {/* Customer Box */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{apt.customer_name}</span>
                  <span className="text-slate-500 text-[11px]">{apt.customer_phone}</span>
                </div>

                <a
                  href={generateWhatsAppLink(
                    apt.customer_phone,
                    `¡Hola ${apt.customer_name}! Te recordamos tu cita de "${apt.service_name}" en ${currentOrg.name} para el día ${apt.appointment_date} a las ${apt.start_time}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Recordar
                </a>
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  Nota: {apt.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Agendar Cita / Reserva</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio</label>
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20"
                >
                  {orgServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.price, currency)} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ej: Lucía Ramírez"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Especialista / Empleado Asignado</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="Ej: Valeria Rossi"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
