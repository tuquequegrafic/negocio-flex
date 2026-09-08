/**
 * Negocio Flex - CustomerProfile360Modal (Fase 8)
 * Ficha 360° Integral de Cliente con Timeline, Historial de Compras/Citas y Herramientas de Fidelización.
 */

import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Clock,
  Send,
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CustomerProfile360 } from '../../domain/entities/customer_entity';
import { useApp } from '../../../../context/AppContext';
import { formatWhatsAppUrl } from '../../../../core/utils/phone_utils';

interface CustomerProfile360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: CustomerProfile360 | null;
  isLoading: boolean;
  onUpdateNotes?: (notes: string) => Promise<void>;
}

export const CustomerProfile360Modal: React.FC<CustomerProfile360ModalProps> = ({
  isOpen,
  onClose,
  profileData,
  isLoading,
  onUpdateNotes,
}) => {
  const { currentOrg } = useApp();
  const [activeTab, setActiveTab] = useState<'timeline' | 'orders' | 'appointments' | 'loyalty'>('timeline');
  const [customNote, setCustomNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currency = currentOrg?.settings?.currency || 'S/';
  const customer = profileData?.customer;
  const metrics = profileData?.metrics;
  const orders = profileData?.orders || [];
  const appointments = profileData?.appointments || [];

  // Plantillas rápidas de WhatsApp
  const openWhatsAppTemplate = (type: 'thanks' | 'promo' | 'reminder') => {
    if (!customer?.phone) return;
    let text = '';

    if (type === 'thanks') {
      text = `¡Hola ${customer.name}! Te saluda el equipo de *${currentOrg?.name || 'nuestro negocio'}*. Queríamos agradecerte por tu preferencia con nosotros. ¿Cómo estuvo tu última experiencia con tu pedido? Estamos a tu disposición para lo que necesites.`;
    } else if (type === 'promo') {
      text = `¡Hola ${customer.name}! En *${currentOrg?.name || 'nuestro negocio'}* valoramos mucho que seas nuestro cliente frecuente. Hoy tenemos una atención especial para ti. ¡Escríbenos para conocer los detalles!`;
    } else if (type === 'reminder') {
      text = `¡Hola ${customer.name}! Esperamos que te encuentres muy bien. Te escribimos de *${currentOrg?.name || 'nuestro negocio'}* para saludarte y recordarte que puedes consultar nuestras novedades y agendar cuando desees. ¡Que tengas un excelente día!`;
    }

    const url = formatWhatsAppUrl(customer.phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveNotes = async () => {
    if (!customer || !customNote.trim() || !onUpdateNotes) return;
    setIsSavingNote(true);
    try {
      const updated = customer.notes ? `${customer.notes}\n[${new Date().toLocaleDateString()}]: ${customNote.trim()}` : customNote.trim();
      await onUpdateNotes(updated);
      setCustomNote('');
      setNoteSavedSuccess(true);
      setTimeout(() => setNoteSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar nota de cliente:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Segment colors
  const segmentConfig = {
    VIP: { label: 'Cliente VIP', bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
    FREQUENT: { label: 'Cliente Frecuente', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: 'bg-indigo-500' },
    NEW: { label: 'Cliente Nuevo', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Sin Actividad Reciente', bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
  };

  const currentSegment = metrics?.segment || 'NEW';
  const segInfo = segmentConfig[currentSegment] || segmentConfig.NEW;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradiente e info básica */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl font-black text-indigo-300 shadow-inner">
              {customer?.name.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white">{customer?.name || 'Cargando...'}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${segInfo.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${segInfo.dot}`} />
                  {segInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 flex-wrap">
                {customer?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    {customer.phone}
                  </span>
                )}
                {customer?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    {customer.email}
                  </span>
                )}
                {customer?.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Métricas clave en Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Gastado (LTV)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-slate-500 font-semibold">{currency}</span>
              <span className="text-lg font-black text-slate-900">{(metrics?.totalSpent || customer?.totalSpent || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pedidos Realizados</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-indigo-600">{metrics?.totalOrders || customer?.totalOrders || 0}</span>
              <span className="text-xs text-slate-400">órdenes</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Ticket Promedio</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-slate-500 font-semibold">{currency}</span>
              <span className="text-lg font-black text-slate-900">{(metrics?.avgTicket || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Citas / Reservas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-emerald-600">{metrics?.totalAppointments || appointments.length}</span>
              <span className="text-xs text-slate-400">agendadas</span>
            </div>
          </div>
        </div>

        {/* Barra de pestañas de navegación interna */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Línea de Tiempo 360°
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Historial de Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appointments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Citas Agendadas ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loyalty' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Fidelización & WhatsApp
          </button>
        </div>

        {/* Contenido scrolleable de la ficha */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Cargando historial 360° del cliente...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LÍNEA DE TIEMPO CONSOLIDADA */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Actividad Histórica Reciente</h3>
                    <span className="text-xs text-slate-500">{orders.length + appointments.length} interacciones totales</span>
                  </div>

                  {orders.length === 0 && appointments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">Sin historial transaccional registrado</p>
                      <p className="text-[11px] text-slate-400 mt-1">Las órdenes y citas aparecerán automáticamente aquí al interactuar.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                      {/* Pedidos en Timeline */}
                      {orders.slice(0, 8).map(order => (
                        <div key={order.id} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-xs" />
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                Pedido {order.orderNumber}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                              <span>Total: <strong>{currency} {order.total.toFixed(2)}</strong></span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Citas en Timeline */}
                      {appointments.slice(0, 8).map(apt => (
                        <div key={apt.id} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs" />
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                Cita: {apt.serviceName}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {apt.appointmentDate} • {apt.startTime}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                              <span>Especialista: <strong>{apt.staffName || 'General'}</strong></span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PEDIDOS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No hay órdenes para este cliente.</p>
                  ) : (
                    orders.map(o => (
                      <div key={o.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">Pedido {o.orderNumber}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(o.createdAt).toLocaleString()} • {o.deliveryType} • {o.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{currency} {o.total.toFixed(2)}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: CITAS */}
              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No hay citas registradas para este cliente.</p>
                  ) : (
                    appointments.map(a => (
                      <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">{a.serviceName}</p>
                          <p className="text-[11px] text-slate-500">
                            Fecha: {a.appointmentDate} de {a.startTime} a {a.endTime} • Especialista: {a.staffName || 'Asignado'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: FIDELIZACIÓN & WHATSAPP */}
              {activeTab === 'loyalty' && (
                <div className="space-y-6">
                  {/* Plantillas de fidelización en un clic */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Acciones Rápidas de Fidelización por WhatsApp
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => openWhatsAppTemplate('thanks')}
                        className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Send className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-xs font-bold text-emerald-900">Agradecimiento</span>
                        </div>
                        <p className="text-[11px] text-emerald-700">Enviar mensaje cordial preguntando por su experiencia reciente.</p>
                      </button>

                      <button
                        onClick={() => openWhatsAppTemplate('promo')}
                        className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-amber-900">Beneficio VIP</span>
                        </div>
                        <p className="text-[11px] text-amber-700">Ofrecer descuento o atención exclusiva por su fidelidad.</p>
                      </button>

                      <button
                        onClick={() => openWhatsAppTemplate('reminder')}
                        className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
                          <span className="text-xs font-bold text-indigo-900">Reactivación</span>
                        </div>
                        <p className="text-[11px] text-indigo-700">Invitar a volver o reservar nueva cita con novedades de catálogo.</p>
                      </button>
                    </div>
                  </div>

                  {/* Notas internas del cliente */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Notas Internas del Negocio
                    </h4>
                    {customer?.notes && (
                      <div className="mb-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line">
                        {customer.notes}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        placeholder="Escribir nueva nota interna (ej. 'Prefiere entregas por la tarde')..."
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveNotes();
                        }}
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNote || !customNote.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isSavingNote ? 'Guardando...' : 'Agregar'}
                      </button>
                    </div>
                    {noteSavedSuccess && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Nota guardada con éxito
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            ID de Cliente: <code className="font-mono text-[10px] text-slate-600">{customer?.id}</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
