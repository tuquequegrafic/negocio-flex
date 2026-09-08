/**
 * Negocio Flex - AppointmentStatusBadge (Fase 11: Presentación Desacoplada)
 * Componente modular para representar visualmente el estado operacional de una cita/reserva.
 */

import React from 'react';
import { AppointmentStatus } from '../../domain/entities/appointment_entity';

export interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export interface AppointmentStatusConfig {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}

export const APPOINTMENT_STATUS_CONFIGS: Record<AppointmentStatus, AppointmentStatusConfig> = {
  PENDING: {
    label: 'Pendiente',
    icon: '⏳',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  CONFIRMED: {
    label: 'Confirmada',
    icon: '📅',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  COMPLETED: {
    label: 'Realizada',
    icon: '✅',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelada',
    icon: '❌',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = APPOINTMENT_STATUS_CONFIGS[status] || APPOINTMENT_STATUS_CONFIGS.PENDING;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`font-extrabold rounded-xl border inline-flex items-center gap-1.5 whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
