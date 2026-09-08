import React from 'react';
import { supabaseService } from '../core/network/supabase_client';
import { formatCurrency } from '../core/utils/formatters';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  TrendingUp,
  Database,
} from 'lucide-react';
import {
  useOrders,
  OrderCard,
  OrderDetailsModal,
  OrderDispatchDrawer,
  ORDER_STATUS_CONFIGS,
  OrderStatus,
} from '../features/orders';

export const OrdersScreen: React.FC = () => {
  const {
    orders,
    filteredOrders,
    selectedStatus,
    searchTerm,
    loading,
    deletingOrderId,
    selectedOrderForDetails,
    selectedOrderForDispatch,
    totalSales,
    pendingCount,
    inProgressCount,
    avgTicket,
    currency,
    orgName,
    canManageStatus,
    canDelete,
    setSelectedOrderForDetails,
    setSelectedOrderForDispatch,
    setSelectedStatus,
    setSearchTerm,
    updateOrderStatus,
    deleteOrder,
    refreshOrders,
  } = useOrders();

  const statusesList = (Object.keys(ORDER_STATUS_CONFIGS) as OrderStatus[]).map(key => ({
    key,
    ...ORDER_STATUS_CONFIGS[key],
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h1 className="text-2xl font-black text-slate-900">Gestión de Pedidos & Ventas</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recepción en tiempo real, cambio de estados y despacho para <strong>{orgName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {supabaseService.isConfigured && (
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Database className="w-3.5 h-3.5" /> Supabase PostgreSQL
            </span>
          )}
          <button
            onClick={() => refreshOrders()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Recargar pedidos desde la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{loading ? 'Actualizando...' : 'Recargar'}</span>
          </button>
          <span className="text-xs font-bold bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-2xs">
            {orders.length} Pedidos
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
          Todos ({orders.length})
        </button>

        {statusesList.map(s => {
          const count = orders.filter(o => o.status === s.key).length;
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
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
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
        {loading && orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-2xs">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Cargando pedidos...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sincronizando la lista de pedidos con Supabase PostgreSQL en tiempo real.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
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
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              currency={currency}
              orgName={orgName}
              canManageStatus={canManageStatus}
              canDelete={canDelete}
              isDeleting={deletingOrderId === order.id}
              onUpdateStatus={updateOrderStatus}
              onDelete={deleteOrder}
              onOpenDetails={o => setSelectedOrderForDetails(o)}
            />
          ))
        )}
      </div>

      {/* 6. Modals & Drawers */}
      <OrderDetailsModal
        order={selectedOrderForDetails}
        isOpen={!!selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        currency={currency}
        orgName={orgName}
        onUpdateStatus={updateOrderStatus}
      />

      <OrderDispatchDrawer
        order={selectedOrderForDispatch}
        isOpen={!!selectedOrderForDispatch}
        onClose={() => setSelectedOrderForDispatch(null)}
        currency={currency}
        onConfirmDispatch={async (orderId, nextStatus) => {
          await updateOrderStatus(orderId, nextStatus);
        }}
      />
    </div>
  );
};
