/**
 * Negocio Flex - AppointmentFormModal (Fase 11: Presentación Desacoplada)
 * Modal para agendar nueva cita o reprogramar/editar una cita existente.
 * Incluye validación de solapamiento en tiempo real e integración con CRM de clientes.
 */

import React, { useState, useEffect } from 'react';
import {
  AppointmentEntity,
  AppointmentStatus,
  CreateAppointmentParams,
  UpdateAppointmentParams,
} from '../../domain/entities/appointment_entity';
import { Customer, ServiceItem } from '../../../../types';
import { formatCurrency } from '../../../../core/utils/formatters';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Scissors,
  AlertTriangle,
  FileText,
  Users,
} from 'lucide-react';

export interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointmentParams | UpdateAppointmentParams) => Promise<void>;
  editingAppointment?: AppointmentEntity | null;
  services: ServiceItem[];
  customers: Customer[];
  organizationId: string;
  currency?: string;
  checkOverlap: (
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeId?: string
  ) => Promise<boolean>;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAppointment,
  services,
  customers,
  organizationId,
  currency = 'S/',
  checkOverlap,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('NEW');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:45');
  const [status, setStatus] = useState<AppointmentStatus>('CONFIRMED');
  const [notes, setNotes] = useState('');

  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar valores al abrir o cambiar cita a editar
  useEffect(() => {
    if (!isOpen) return;

    if (editingAppointment) {
      const matchCust = customers.find(
        c =>
          c.phone.replace(/\D/g, '') === editingAppointment.customerPhone.replace(/\D/g, '') ||
          c.name.toLowerCase() === editingAppointment.customerName.toLowerCase()
      );
      setSelectedCustomerId(matchCust ? matchCust.id : 'CUSTOM');
      setCustomerName(editingAppointment.customerName);
      setCustomerPhone(editingAppointment.customerPhone);
      setCustomerEmail(editingAppointment.customerEmail || '');
      setServiceId(editingAppointment.serviceId || services[0]?.id || '');
      setStaffName(editingAppointment.staffName || '');
      setAppointmentDate(editingAppointment.appointmentDate);
      setStartTime(editingAppointment.startTime);
      setEndTime(editingAppointment.endTime);
      setStatus(editingAppointment.status);
      setNotes(editingAppointment.notes || '');
    } else {
      setSelectedCustomerId('NEW');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setServiceId(services[0]?.id || '');
      setStaffName('');
      setAppointmentDate(new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setStatus('CONFIRMED');
      setNotes('');
    }
  }, [isOpen, editingAppointment, services, customers]);

  // Manejar cambio de cliente existente del CRM
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === 'NEW') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
    } else {
      const found = customers.find(c => c.id === id);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
        setCustomerEmail(found.email || '');
      }
    }
  };

  // Recalcular endTime automáticamente al cambiar servicio o startTime
  useEffect(() => {
    const selectedServ = services.find(s => s.id === serviceId);
    const duration = selectedServ?.duration_minutes || 30;
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const totalMinutes = h * 60 + m + duration;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
      }
    }
  }, [serviceId, startTime, services]);

  // Validación de solapamiento en tiempo real
  useEffect(() => {
    let active = true;
    async function verify() {
      if (!appointmentDate || !startTime || !endTime || !isOpen) {
        setOverlapWarning(null);
        return;
      }
      try {
        const hasOverlap = await checkOverlap(
          appointmentDate,
          startTime,
          endTime,
          staffName.trim() || undefined,
          editingAppointment?.id
        );
        if (active) {
          if (hasOverlap) {
            setOverlapWarning('⚠️ Alerta de agenda: Ya existe otra cita activa en esa fecha y horario.');
          } else {
            setOverlapWarning(null);
          }
        }
      } catch {
        if (active) setOverlapWarning(null);
      }
    }
    verify();
    return () => {
      active = false;
    };
  }, [appointmentDate, startTime, endTime, staffName, isOpen, editingAppointment, checkOverlap]);

  if (!isOpen) return null;

  const selectedService = services.find(s => s.id === serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor, ingresa el nombre y teléfono del cliente.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateAppointmentParams = {
        organizationId,
        serviceId: serviceId || null,
        serviceName: selectedService?.name || 'Servicio General',
        servicePrice: selectedService?.price || 0,
        durationMinutes: selectedService?.duration_minutes || 30,
        staffName: staffName.trim() || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        appointmentDate,
        startTime,
        endTime,
        status,
        notes: notes.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {editingAppointment ? 'Reprogramar / Editar Cita' : 'Agendar Nueva Cita'}
              </h3>
              <p className="text-[11px] text-slate-500">Gestión de agenda presencial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Overlap Warning Box */}
          {overlapWarning && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{overlapWarning}</span>
            </div>
          )}

          {/* Customer CRM Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Cliente</label>
            <select
              value={selectedCustomerId}
              onChange={e => handleCustomerSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="NEW">+ Nuevo Cliente (Registrar datos)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Nombre del Cliente *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ej: María López"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Teléfono / WhatsApp *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Ej: 987654321"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Service & Staff */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Servicio *</label>
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.price, currency)})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Especialista (Opcional)</label>
              <input
                type="text"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                placeholder="Ej: Carmen"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Date & Timeslot */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Fecha *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Hora Inicio *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Hora Fin *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Status & Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Estado de la Cita</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AppointmentStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
            >
              <option value="PENDING">⏳ Pendiente</option>
              <option value="CONFIRMED">📅 Confirmada</option>
              <option value="COMPLETED">✅ Realizada</option>
              <option value="CANCELLED">❌ Cancelada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Notas Adicionales</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Indicaciones especiales, alergias, requerimientos..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : editingAppointment ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
