/**
 * Negocio Flex - OrderDetailsModal (Fase 11: Presentación Desacoplada)
 * Modal completo para inspeccionar el desglose detallado de un pedido,
 * historial de artículos, cliente y despacho.
 */

import React from 'react';
import { OrderEntity, OrderStatus } from '../../domain/entities/order_entity';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatCurrency, generateWhatsAppLink } from '../../../../core/utils/formatters';
import { 
  X, 
  Store, 
  Truck, 
  Clock, 
  Phone, 
  MapPin, 
  FileText, 
  MessageCircle,
  CreditCard
} from 'lucide-react';

export interface OrderDetailsModalProps {
  order: OrderEntity | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  orgName?: string;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  allowedNextStatuses?: OrderStatus[];
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  currency = 'S/',
  orgName = 'Negocio',
  onUpdateStatus,
  allowedNextStatuses = [],
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-base text-slate-900 bg-slate-200/80 px-3 py-1 rounded-xl">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
              order.deliveryType === 'PICKUP' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {order.deliveryType === 'PICKUP' ? (
                <>
                  <Store className="w-3.5 h-3.5" /> Recojo en Tienda
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5" /> Despacho a Domicilio
                </>
              )}
            </span>

            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {new Date(order.createdAt).toLocaleString()}
            </span>

            <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              {order.paymentMethod}
            </span>
          </div>

          {/* Customer Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Datos del Cliente</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="font-bold text-slate-900">{order.customerName}</div>
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.customerPhone}</span>
              </div>
            </div>

            {order.deliveryType === 'DELIVERY' && order.deliveryAddress && (
              <div className="pt-1 text-xs text-slate-700 space-y-0.5 border-t border-slate-200/60 mt-2">
                <div className="flex items-start gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
                {order.customerReference && (
                  <p className="text-[11px] text-slate-500 pl-5">
                    Ref: {order.customerReference}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Artículos ({order.items.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-black text-slate-900 bg-slate-100 border border-slate-200 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                      {item.quantity}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{item.productName}</span>
                      <span className="text-[11px] text-slate-400">
                        {formatCurrency(item.unitPrice, currency)} c/u
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0 text-sm">
                    {formatCurrency(item.subtotal, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-1">
              <strong className="font-bold flex items-center gap-1 text-amber-900">
                <FileText className="w-3.5 h-3.5" /> Observaciones / Instrucciones:
              </strong>
              <p className="italic">"{order.notes}"</p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(order.subtotal, currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento aplicado:</span>
                <span className="font-mono font-medium">-{formatCurrency(order.discount, currency)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Costo de envío (Delivery):</span>
                <span className="font-mono font-medium">{formatCurrency(order.deliveryFee, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Total a Cobrar:</span>
              <span className="font-mono text-lg">{formatCurrency(order.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={generateWhatsAppLink(
              order.customerPhone,
              `¡Hola ${order.customerName}! Te contactamos de *${orgName}*. Te informamos sobre tu pedido *${order.orderNumber}* por ${currency} ${order.total.toFixed(2)}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Notificar por WhatsApp</span>
          </a>

          {onUpdateStatus && allowedNextStatuses.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {allowedNextStatuses.map(nextSt => (
                <button
                  key={nextSt}
                  onClick={() => onUpdateStatus(order.id, nextSt)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Avanzar a {nextSt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
