/**
 * Negocio Flex - OrderDispatchDrawer (Fase 11: Presentación Desacoplada)
 * Panel deslizante / modal rápido para control de despacho y entrega a domicilio.
 */

import React, { useState } from 'react';
import { OrderEntity, OrderStatus } from '../../domain/entities/order_entity';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatCurrency } from '../../../../core/utils/formatters';
import { Truck, MapPin, CheckCircle, X } from 'lucide-react';

export interface OrderDispatchDrawerProps {
  order: OrderEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch: (orderId: string, nextStatus: OrderStatus, notes?: string) => Promise<void>;
  currency?: string;
}

export const OrderDispatchDrawer: React.FC<OrderDispatchDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDispatch,
  currency = 'S/',
}) => {
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleDispatch = async (targetStatus: OrderStatus) => {
    try {
      setIsSubmitting(true);
      await onConfirmDispatch(order.id, targetStatus, dispatchNotes.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95"
        role="dialog"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Control de Despacho & Salida</h3>
              <p className="text-[11px] text-slate-500">Pedido {order.orderNumber} • {order.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Estado Actual</span>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Monto Total</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(order.total, currency)}</span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dirección de Entrega</span>
              <div className="flex items-start gap-1.5 font-medium text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </div>
              {order.customerReference && (
                <p className="text-[11px] text-slate-500 pl-5">Ref: {order.customerReference}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Instrucción para Motorizado / Repartidor (Opcional):
            </label>
            <textarea
              value={dispatchNotes}
              onChange={e => setDispatchNotes(e.target.value)}
              placeholder="Ej: Salida con motorizado Juan, cambio de 50 soles preparado..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          {order.deliveryType === 'DELIVERY' && order.status === 'READY' && (
            <button
              onClick={() => handleDispatch('SHIPPED')}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Despachar a Ruta</span>
            </button>
          )}
          <button
            onClick={() => handleDispatch('DELIVERED')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirmar Entrega</span>
          </button>
        </div>
      </div>
    </div>
  );
};
