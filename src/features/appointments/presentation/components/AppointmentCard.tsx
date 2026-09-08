/**
 * Negocio Flex - AppointmentCard (Fase 11: Presentación Desacoplada)
 * Tarjeta individual para visualización y control operacional de una cita/reserva.
 */

import React from 'react';
import { AppointmentEntity, AppointmentStatus } from '../../domain/entities/appointment_entity';
import { AppointmentStatusBadge, APPOINTMENT_STATUS_CONFIGS } from './AppointmentStatusBadge';
import { AppointmentStateMachine } from '../../domain/state_machine/appointment_state_machine';
import { formatCurrency, generateWhatsAppLink, formatDate } from '../../../../core/utils/formatters';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Scissors,
  Users,
  MessageCircle,
  Edit3,
  Trash2,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export interface AppointmentCardProps {
  appointment: AppointmentEntity;
  currency?: string;
  orgName?: string;
  canManageStatus?: boolean;
  canReschedule?: boolean;
  canDelete?: boolean;
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onEdit: (appointment: AppointmentEntity) => void;
  onDeleteRequest: (appointment: AppointmentEntity) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  currency = 'S/',
  orgName = 'Negocio',
  canManageStatus = true,
  canReschedule = true,
  canDelete = true,
  onUpdateStatus,
  onEdit,
  onDeleteRequest,
}) => {
  const allowedNextStatuses = AppointmentStateMachine.getAllowedNextStatuses(appointment.status);
  const statusConfig = APPOINTMENT_STATUS_CONFIGS[appointment.status];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-4">
      {/* Header: Date, Time & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatDate(appointment.appointmentDate)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {appointment.startTime} - {appointment.endTime}
            </span>
            <span className="text-[10px] text-indigo-500 font-normal">
              ({appointment.durationMinutes} min)
            </span>
          </div>

          <AppointmentStatusBadge status={appointment.status} />
        </div>

        {/* Action icons: Edit & Delete */}
        <div className="flex items-center gap-1.5">
          {canReschedule && !AppointmentStateMachine.isTerminal(appointment.status) && (
            <button
              onClick={() => onEdit(appointment)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reagendar / Editar datos"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteRequest(appointment)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Eliminar cita"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid: Service details & Customer details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Service & Specialist (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              Servicio Solicitado
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-slate-500" />
                {appointment.serviceName}
              </span>
              <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                {formatCurrency(appointment.servicePrice, currency)}
              </span>
            </div>
          </div>

          {appointment.staffName && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-bold text-slate-700">Especialista asignado:</span>
              <span className="font-medium">{appointment.staffName}</span>
            </div>
          )}

          {appointment.notes && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-0.5">
              <strong className="font-bold flex items-center gap-1 text-amber-900">
                <FileText className="w-3.5 h-3.5" /> Indicaciones / Notas:
              </strong>
              <p className="italic">"{appointment.notes}"</p>
            </div>
          )}
        </div>

        {/* Right: Client Details & Quick Actions (5 cols) */}
        <div className="md:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="space-y-1.5 text-xs">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              Datos del Cliente
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{appointment.customerName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{appointment.customerPhone}</span>
            </div>
          </div>

          {/* WhatsApp Action */}
          <a
            href={generateWhatsAppLink(
              appointment.customerPhone,
              `¡Hola ${appointment.customerName}! Te recordamos tu cita de *${appointment.serviceName}* en *${orgName}* para el día *${formatDate(
                appointment.appointmentDate
              )}* a las *${appointment.startTime}*. Estado: *${statusConfig.label.toUpperCase()}*.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Confirmar por WhatsApp</span>
          </a>

          {/* Operational Stepper */}
          {canManageStatus && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {appointment.status === 'PENDING' && (
                <button
                  onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmar Cita
                </button>
              )}
              {appointment.status === 'CONFIRMED' && (
                <button
                  onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Marcar Realizada
                </button>
              )}
              {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Deseas cancelar la cita de ${appointment.customerName}?`)) {
                      onUpdateStatus(appointment.id, 'CANCELLED');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] font-bold transition-colors"
                  title="Cancelar cita"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
