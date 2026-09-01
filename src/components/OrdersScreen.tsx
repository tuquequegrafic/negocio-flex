import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateWhatsAppLink } from '../core/utils/formatters';
import { Order, OrderStatus } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  MessageCircle,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Store,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { currentOrg, orders, updateOrderStatus } = useApp();
  const orgOrders = orders.filter(o => o.organization_id === currentOrg.id);
  const currency = currentOrg.settings?.currency || 'S/';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const statuses: { key: OrderStatus; label: string; icon: string; bg: string; text: string; border: string }[] = [
    { key: 'PENDING', label: 'Pendiente', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { key: 'CONFIRMED', label: 'Confirmado', icon: '🔵', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { key: 'PREPARING', label: 'Preparando', icon: '🟠', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { key: 'READY', label: 'Listo', icon: '🟣', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { key: 'SHIPPED', label: 'En Camino', icon: '🚚', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    { key: 'DELIVERED', label: 'Entregado', icon: '🟢', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { key: 'CANCELLED', label: 'Cancelado', icon: '🔴', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ];

  const filteredOrders = orgOrders.filter(o => {
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const matchesSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalSales = orgOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingCount = orgOrders.filter(o => o.status === 'PENDING').length;
  const inProgressCount = orgOrders.filter(o => o.status === 'PREPARING' || o.status === 'READY' || o.status === 'CONFIRMED').length;
  const avgTicket = orgOrders.length > 0 ? totalSales / (orgOrders.filter(o => o.status !== 'CANCELLED').length || 1) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header with Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h1 className="text-2xl font-black text-slate-900">Gestión de Pedidos & WhatsApp</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recepción en tiempo real, cambio de estados y despacho para <strong>{currentOrg.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-2xs">
            {orgOrders.length} Pedidos Registrados
          </span>
        </div>
      </div>

      {/* 2. Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Totales</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(totalSales, currency)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Pedidos activos
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pendientes</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold">Requieren atención</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Cocina / Listos</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600 font-mono block">
            {inProgressCount}
          </span>
          <span className="text-[10px] text-indigo-600 font-semibold">En preparación</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Promedio</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(avgTicket, currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Por pedido</span>
        </div>
      </div>

      {/* 3. Filter Tabs & Live Counter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedStatus('ALL')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedStatus === 'ALL' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos ({orgOrders.length})
        </button>

        {statuses.map(s => {
          const count = orgOrders.filter(o => o.status === s.key).length;
          const isSelected = selectedStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStatus(s.key)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por código #000125, cliente o celular..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 5. Orders List / Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron pedidos</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm 
                ? 'No hay pedidos que coincidan con los criterios de búsqueda.' 
                : 'Los pedidos que envíen tus clientes desde la página web pública aparecerán aquí en tiempo real.'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const currentBadge = statuses.find(s => s.key === order.status) || statuses[0];

            return (
              <div key={order.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all space-y-4">
                
                {/* Header of Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                      {order.order_number}
                    </span>

                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}>
                      <span>{currentBadge.icon}</span>
                      <span>{currentBadge.label}</span>
                    </span>

                    {/* Delivery / Pickup Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                      order.delivery_type === 'PICKUP' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {order.delivery_type === 'PICKUP' ? (
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
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Dropdown Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Estado:</span>
                    <select
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all"
                    >
                      {statuses.map(st => (
                        <option key={st.key} value={st.key}>
                          {st.icon} {st.label}
                        </option>
                      ))}
                    </select>
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
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-black text-slate-900 bg-white border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                              {item.quantity}
                            </span>
                            <span className="font-bold text-slate-800 truncate">{item.product_name}</span>
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
                        <span className="font-bold text-slate-900 text-sm">{order.customer_name}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                          {order.payment_method || 'Yape/Plin'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customer_phone}</span>
                      </div>

                      {order.delivery_type === 'DELIVERY' && order.delivery_address && (
                        <div className="space-y-0.5 pt-1">
                          <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.delivery_address}</span>
                          </div>
                          {order.customer_reference && (
                            <p className="text-[11px] text-slate-500 pl-5">
                              Ref: {order.customer_reference}
                            </p>
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
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>Delivery:</span>
                          <span className="font-mono font-medium">{formatCurrency(order.delivery_fee, currency)}</span>
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
                        order.customer_phone,
                        `¡Hola ${order.customer_name}! Te saludamos de *${currentOrg.name}*. Tu pedido *${order.order_number}* por ${currency} ${order.total.toFixed(2)} se encuentra actualmente: *${currentBadge.label.toUpperCase()}*.`
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
                    <div className="flex items-center gap-1.5 pt-1">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
                        >
                          Confirmar
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="flex-1 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold transition-colors"
                        >
                          Avanzar a Preparación
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors"
                        >
                          Marcar como Listo
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                        >
                          Completar Entrega
                        </button>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
