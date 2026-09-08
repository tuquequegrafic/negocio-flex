/**
 * Negocio Flex - OrderCard (Fase 11: Presentación Desacoplada)
 * Tarjeta operacional completa para visualización, cambio de estado y despacho de un pedido.
 */

import React from 'react';
import { OrderEntity, OrderStatus } from '../../domain/entities/order_entity';
import { OrderStatusBadge, ORDER_STATUS_CONFIGS } from './OrderStatusBadge';
import { OrderStateMachine } from '../../domain/state_machine/order_state_machine';
import { formatCurrency, generateWhatsAppLink } from '../../../../core/utils/formatters';
import {
  Store,
  Truck,
  Clock,
  Trash2,
  FileText,
  Phone,
  MapPin,
  MessageCircle,
  Eye,
} from 'lucide-react';

export interface OrderCardProps {
  order: OrderEntity;
  currency?: string;
  orgName?: string;
  canManageStatus?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onDelete: (orderId: string, orderNumber: string) => Promise<void>;
  onOpenDetails?: (order: OrderEntity) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  currency = 'S/',
  orgName = 'Negocio',
  canManageStatus = true,
  canDelete = true,
  isDeleting = false,
  onUpdateStatus,
  onDelete,
  onOpenDetails,
}) => {
  const currentBadge = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.PENDING;
  const allowedNextStatuses = OrderStateMachine.getAllowedNextStatuses(order.status, order.deliveryType);

  const statusesList: { key: OrderStatus; label: string; icon: string }[] = Object.entries(
    ORDER_STATUS_CONFIGS
  ).map(([key, val]) => ({
    key: key as OrderStatus,
    label: val.label,
    icon: val.icon,
  }));

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-4">
      {/* Header of Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
            {order.orderNumber}
          </span>

          <OrderStatusBadge status={order.status} />

          {/* Delivery / Pickup Badge */}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
              order.deliveryType === 'PICKUP'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {order.deliveryType === 'PICKUP' ? (
              <>
                <Store className="w-3 h-3" /> Recojo en local
              </>
            ) : (
              <>
                <Truck className="w-3 h-3" /> Envío Delivery
              </>
            )}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
            • {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Status Dropdown Selector & Actions */}
        <div className="flex items-center gap-2">
          {onOpenDetails && (
            <button
              onClick={() => onOpenDetails(order)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Ver detalle completo"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {canManageStatus && !OrderStateMachine.isTerminal(order.status) && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Estado:</span>
              <select
                value={order.status}
                onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
              >
                <option value={order.status}>
                  {currentBadge.icon} {currentBadge.label} (Actual)
                </option>
                {allowedNextStatuses.map(st => {
                  const cfg = ORDER_STATUS_CONFIGS[st];
                  return (
                    <option key={st} value={st}>
                      {cfg?.icon} {cfg?.label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(order.id, order.orderNumber)}
              disabled={isDeleting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
              title="Eliminar pedido"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Items and Customer Details (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Items list (7 cols) */}
        <div className="md:col-span-7 space-y-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            Artículos del Pedido ({order.items.length})
          </span>

          <div className="space-y-1.5">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-black text-slate-900 bg-white border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                    {item.quantity}
                  </span>
                  <span className="font-bold text-slate-800 truncate">{item.productName}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {formatCurrency(item.subtotal, currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 mt-2 space-y-0.5">
              <strong className="font-bold flex items-center gap-1 text-amber-900">
                <FileText className="w-3.5 h-3.5" /> Observación del Cliente:
              </strong>
              <p className="italic">"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Right: Client info & totals (5 cols) */}
        <div className="md:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                {order.paymentMethod || 'Yape/Plin'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{order.customerPhone}</span>
            </div>

            {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
              <div className="space-y-0.5 pt-1">
                <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
                {order.customerReference && (
                  <p className="text-[11px] text-slate-500 pl-5">Ref: {order.customerReference}</p>
                )}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="border-t border-slate-200 pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(order.subtotal, currency)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Delivery:</span>
                <span className="font-mono font-medium">{formatCurrency(order.deliveryFee, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total del Pedido:</span>
              <span className="font-mono text-base">{formatCurrency(order.total, currency)}</span>
            </div>
          </div>

          {/* WhatsApp Action */}
          <a
            href={generateWhatsAppLink(
              order.customerPhone,
              `¡Hola ${order.customerName}! Te saludamos de *${orgName}*. Tu pedido *${order.orderNumber}* por ${currency} ${order.total.toFixed(
                2
              )} se encuentra actualmente: *${currentBadge.label.toUpperCase()}*.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Notificar por WhatsApp</span>
          </a>

          {/* Quick status stepper buttons */}
          {canManageStatus && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Confirmar
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                  className="flex-1 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Avanzar a Preparación
                </button>
              )}
              {order.status === 'PREPARING' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'READY')}
                  className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Marcar como Listo
                </button>
              )}
              {order.status === 'READY' && (
                <>
                  {order.deliveryType === 'DELIVERY' && (
                    <button
                      onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                      className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                    >
                      Despachar (En Camino)
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                  >
                    {order.deliveryType === 'PICKUP' ? 'Entregado al Cliente' : 'Completar Entrega'}
                  </button>
                </>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Confirmar Entrega
                </button>
              )}
              {order.status === 'DELIVERED' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                  className="flex-1 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Finalizar Pedido
                </button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Deseas cancelar el pedido ${order.orderNumber}? El stock será restaurado.`)) {
                      onUpdateStatus(order.id, 'CANCELLED');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] font-bold transition-colors"
                  title="Cancelar pedido"
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
