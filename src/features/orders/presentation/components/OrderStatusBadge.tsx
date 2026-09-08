/**
 * Negocio Flex - OrderStatusBadge (Fase 11: Presentación Desacoplada)
 * Componente modular para representar visualmente el estado operacional de un pedido.
 */

import React from 'react';
import { OrderStatus } from '../../domain/entities/order_entity';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export interface StatusConfig {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}

export const ORDER_STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Pendiente',
    icon: '🟡',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  CONFIRMED: {
    label: 'Confirmado',
    icon: '🔵',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  PREPARING: {
    label: 'Preparando',
    icon: '🟠',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  READY: {
    label: 'Listo',
    icon: '🟣',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  SHIPPED: {
    label: 'En Camino',
    icon: '🚚',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  DELIVERED: {
    label: 'Entregado',
    icon: '🟢',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  COMPLETED: {
    label: 'Completado',
    icon: '✅',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: '🔴',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = ORDER_STATUS_CONFIGS[status] || ORDER_STATUS_CONFIGS.PENDING;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`font-extrabold rounded-xl border inline-flex items-center gap-1.5 whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
