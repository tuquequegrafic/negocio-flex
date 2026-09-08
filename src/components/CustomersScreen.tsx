import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatCurrency, formatDate } from '../core/utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  UserCheck, 
  TrendingUp, 
  FileText,
  Building2,
  ChevronRight,
  Sparkles,
  Download,
  RefreshCw,
  Crown,
  Award,
} from 'lucide-react';
import { CustomerProfile360Modal } from '../features/customers/presentation/components/CustomerProfile360Modal';
import { CustomerProfile360, CustomerSegment } from '../features/customers/domain/entities/customer_entity';
import { CustomerModel } from '../features/customers/data/models/customer_model';
import { exportSafeCsv } from '../core/utils/csv_utils';
import { normalizePhone, formatWhatsAppUrl } from '../core/utils/phone_utils';

export const CustomersScreen: React.FC = () => {
  const {
    currentOrg,
    currentRole,
    customers,
    orders,
    appointments,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setActiveView,
    getCustomerProfile360,
    refreshCustomers,
    customersLoading,
  } = useApp();

  const canManageCustomers = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'STAFF'].includes(currentRole);
  const canDeleteCustomers = ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(currentRole);
  
  const orgCustomers = useMemo(() => customers.filter(c => c.organization_id === currentOrg.id), [customers, currentOrg.id]);
  const orgOrders = useMemo(() => orders.filter(o => o.organization_id === currentOrg.id), [orders, currentOrg.id]);
  const orgAppointments = useMemo(() => appointments.filter(a => a.organization_id === currentOrg.id), [appointments, currentOrg.id]);
  const currency = currentOrg.settings?.currency || 'S/';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'ALL'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistoryTab, setCustomerHistoryTab] = useState<'ORDERS' | 'APPOINTMENTS'>('ORDERS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 360 Profile Modal State
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [profile360Data, setProfile360Data] = useState<CustomerProfile360 | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Clientes enriquecidos con su segmento
  const enrichedCustomers = useMemo(() => {
    return orgCustomers.map(c => {
      const model = CustomerModel.fromItem(c);
      return {
        ...c,
        segment: model.getSegment(),
      };
    });
  }, [orgCustomers]);

  // Filter customers por término de búsqueda y por segmento
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      if (selectedSegment !== 'ALL' && c.segment !== selectedSegment) {
        return false;
      }
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    });
  }, [enrichedCustomers, selectedSegment, searchTerm]);

  // Calculate Metrics
  const totalClientsCount = enrichedCustomers.length;
  const totalSalesFromClients = enrichedCustomers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  const recurringClientsCount = enrichedCustomers.filter(c => (c.total_orders || 0) > 1).length;
  const vipClientsCount = enrichedCustomers.filter(c => c.segment === 'VIP').length;
  const avgClientLTV = totalClientsCount > 0 ? totalSalesFromClients / totalClientsCount : 0;

  // Apertura de ficha 360°
  const handleOpen360 = async (cust: Customer) => {
    setIs360ModalOpen(true);
    setIsLoadingProfile(true);

    try {
      if (getCustomerProfile360) {
        const data = await getCustomerProfile360(cust.id);
        if (data) {
          setProfile360Data(data);
          setIsLoadingProfile(false);
          return;
        }
      }

      // Fallback local robusto vinculando estrictamente por ID o teléfono canónico (evita colisión por homónimos)
      const canonicalPhone = normalizePhone(cust.phone);
      const custOrders = orgOrders.filter(
        o => (o.customer_id && o.customer_id === cust.id) ||
             (o.customer_phone && normalizePhone(o.customer_phone) === canonicalPhone)
      );
      const custAppointments = orgAppointments.filter(
        a => (a.customer_phone && normalizePhone(a.customer_phone) === canonicalPhone) ||
             (cust.email && a.customer_email && cust.email.trim().toLowerCase() === a.customer_email.trim().toLowerCase())
      );

      const model = CustomerModel.fromItem(cust);
      // Métricas limpias: excluir pedidos y citas cancelados
      const validOrders = custOrders.filter(o => o.status !== 'CANCELLED');
      const validAppointments = custAppointments.filter(a => a.status !== 'CANCELLED');
      const totalSpent = validOrders.reduce((acc, o) => acc + (o.total || 0), 0) || (cust.total_spent || 0);
      const totalOrders = validOrders.length || (cust.total_orders || 0);

      setProfile360Data({
        customer: model,
        orders: custOrders.slice(0, 20).map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          subtotal: o.subtotal,
          discount: o.discount,
          deliveryFee: o.delivery_fee,
          total: o.total,
          deliveryType: o.delivery_type,
          deliveryAddress: o.delivery_address,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
        })),
        appointments: custAppointments.slice(0, 20).map(a => ({
          id: a.id,
          serviceName: a.service_name,
          staffName: a.staff_name,
          appointmentDate: a.appointment_date,
          startTime: a.start_time,
          endTime: a.end_time,
          status: a.status,
          notes: a.notes,
          createdAt: a.created_at,
        })),
        metrics: {
          totalOrders,
          totalAppointments: validAppointments.length,
          totalSpent,
          avgTicket: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
          segment: model.getSegment(),
        },
      });
    } catch (err) {
      console.error('Error al abrir perfil 360°:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Exportar a CSV de forma segura (CWE-1236 Sanitization)
  const handleExportCSV = () => {
    if (enrichedCustomers.length === 0) return;
    const headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Total Pedidos', 'Total Comprado', 'Último Pedido', 'Segmento'];
    const rows = enrichedCustomers.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.address || '',
      c.total_orders || 0,
      (c.total_spent || 0).toFixed(2),
      c.last_order_date || '',
      c.segment,
    ]);

    exportSafeCsv(
      headers,
      rows,
      `clientes_${currentOrg.slug || 'negocio'}_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormReference('');
    setFormNotes('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email || '');
    setFormAddress(cust.address || '');
    setFormReference(cust.reference || '');
    setFormNotes(cust.notes || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canManageCustomers) {
      setErrorMessage('No cuentas con permisos suficientes para registrar o modificar clientes.');
      return;
    }

    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();

    if (!trimmedName) {
      setErrorMessage('El nombre del cliente es obligatorio');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMessage('El nombre del cliente debe tener al menos 2 caracteres');
      return;
    }
    if (!trimmedPhone) {
      setErrorMessage('El teléfono del cliente es obligatorio');
      return;
    }
    const cleanPhoneDigits = trimmedPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 6) {
      setErrorMessage('El número de teléfono debe tener al menos 6 dígitos válidos');
      return;
    }
    if (formEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim())) {
        setErrorMessage('El formato de correo electrónico es inválido');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: trimmedName,
          phone: trimmedPhone,
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          reference: formReference.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });

        if (selectedCustomer?.id === editingCustomer.id) {
          setSelectedCustomer(prev => prev ? {
            ...prev,
            name: trimmedName,
            phone: trimmedPhone,
            email: formEmail.trim() || undefined,
            address: formAddress.trim() || undefined,
            reference: formReference.trim() || undefined,
            notes: formNotes.trim() || undefined,
          } : null);
        }
      } else {
        await addCustomer({
          organization_id: currentOrg.id,
          name: trimmedName,
          phone: trimmedPhone,
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          reference: formReference.trim() || undefined,
          notes: formNotes.trim() || undefined,
          total_orders: 0,
          total_spent: 0,
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar los datos del cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!canDeleteCustomers) {
      setErrorMessage('No tienes permisos de administrador para eliminar clientes.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteCustomer(id);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      setDeleteCandidate(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get order history for a customer (estrictamente por ID o teléfono normalizado para evitar colisiones)
  const getCustomerOrders = (customer: Customer) => {
    const canonicalPhone = normalizePhone(customer.phone);
    return orgOrders.filter(
      o => (o.customer_id && o.customer_id === customer.id) ||
           (o.customer_phone && normalizePhone(o.customer_phone) === canonicalPhone)
    );
  };

  // Get appointments history for a customer
  const getCustomerAppointments = (customer: Customer) => {
    const canonicalPhone = normalizePhone(customer.phone);
    return orgAppointments.filter(
      a => (a.customer_phone && normalizePhone(a.customer_phone) === canonicalPhone) ||
           (customer.email && a.customer_email && customer.email.trim().toLowerCase() === a.customer_email.trim().toLowerCase())
    ).sort((a, b) => new Date(b.appointment_date + 'T' + b.start_time).getTime() - new Date(a.appointment_date + 'T' + a.start_time).getTime());
  };

  const generateWhatsAppLink = (phone: string, text: string) => {
    return formatWhatsAppUrl(phone, text);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h1 className="text-2xl font-black text-slate-900">Directorio & CRM de Clientes</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Fase 8 360°
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Segmentación inteligente, fidelización por WhatsApp e historial unificado de compras y citas para <strong>{currentOrg.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refreshCustomers?.()}
            disabled={customersLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Sincronizar clientes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${customersLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Actualizar</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={enrichedCustomers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Descargar lista completa en CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exportar CSV</span>
          </button>

          {canManageCustomers && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Clientes</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {totalClientsCount}
          </span>
          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" /> Base de datos activa
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clientes VIP</span>
            <Crown className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono block">
            {vipClientsCount}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> &ge; 5 pedidos o &ge; {currency} 300
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Clientes</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(totalSalesFromClients, currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Volumen acumulado total</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">LTV Promedio</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(avgClientLTV, currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Gasto promedio por cliente</span>
        </div>
      </div>

      {/* 3. Search & Segmentation Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, teléfono, dirección o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-2xs"
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

          {/* Segment Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'ALL', label: 'Todos', count: enrichedCustomers.length },
                { id: 'VIP', label: 'VIP', count: enrichedCustomers.filter(c => c.segment === 'VIP').length },
                { id: 'FREQUENT', label: 'Frecuentes', count: enrichedCustomers.filter(c => c.segment === 'FREQUENT').length },
                { id: 'NEW', label: 'Nuevos', count: enrichedCustomers.filter(c => c.segment === 'NEW').length },
                { id: 'INACTIVE', label: 'Sin Compras', count: enrichedCustomers.filter(c => c.segment === 'INACTIVE').length },
              ] as const
            ).map(seg => {
              const active = selectedSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{seg.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Customers List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron clientes</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm 
                ? 'No hay clientes que coincidan con la búsqueda.' 
                : 'Los clientes que realicen pedidos en tu página web se registrarán aquí automáticamente.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Cliente</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4 text-center">Pedidos</th>
                  <th className="py-3.5 px-4 text-right">Total Comprado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map(customer => {
                  const customerOrders = getCustomerOrders(customer);
                  const orderCount = customer.total_orders || customerOrders.length || 0;
                  const totalSpent = customer.total_spent || customerOrders.reduce((acc, o) => acc + o.total, 0);

                  return (
                    <tr 
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {/* Customer Name & Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl font-bold flex items-center justify-center text-xs shrink-0 border ${
                            customer.segment === 'VIP' 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : customer.segment === 'FREQUENT'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : customer.segment === 'NEW'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                                {customer.name}
                              </span>
                              {customer.segment === 'VIP' && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" /> VIP
                                </span>
                              )}
                              {customer.segment === 'FREQUENT' && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Frecuente
                                </span>
                              )}
                            </div>
                            {customer.last_order_number && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Último: {customer.last_order_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & WhatsApp */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">{customer.phone}</span>
                          <a
                            href={generateWhatsAppLink(
                              customer.phone,
                              `¡Hola ${customer.name}! Te saludamos de ${currentOrg.name}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Enviar mensaje por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {customer.email && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {customer.email}
                          </span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 max-w-[200px]">
                        {customer.address ? (
                          <div className="truncate text-slate-600">
                            <span className="truncate block">{customer.address}</span>
                            {customer.reference && (
                              <span className="text-[10px] text-slate-400 truncate block">Ref: {customer.reference}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No especificada</span>
                        )}
                      </td>

                      {/* Orders Count Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-xl text-xs ${
                          orderCount > 1 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {orderCount} {orderCount === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(totalSpent, currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpen360(customer)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition-colors cursor-pointer"
                            title="Ver Perfil 360° e Inteligencia CRM"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>360°</span>
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Ver Historial Rápido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManageCustomers && (
                            <button
                              onClick={() => openEditModal(customer)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Editar Datos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteCustomers && (
                            <button
                              onClick={() => setDeleteCandidate(customer)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Customer Profile Modal / Drawer (Section 11) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  {selectedCustomer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Cliente registrado desde {formatDate(selectedCustomer.created_at)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos Totales</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {selectedCustomer.total_orders || getCustomerOrders(selectedCustomer).length || 0}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Comprado (LTV)</span>
                  <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">
                    {formatCurrency(selectedCustomer.total_spent || getCustomerOrders(selectedCustomer).reduce((acc, o) => acc + o.total, 0), currency)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Último Pedido</span>
                  <span className="text-sm font-black text-indigo-600 font-mono mt-1 block truncate">
                    {selectedCustomer.last_order_number || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Contact and Address Details */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Datos de Contacto</span>
                  {canManageCustomers && (
                    <button
                      onClick={() => {
                        const c = selectedCustomer;
                        setSelectedCustomer(null);
                        openEditModal(c);
                      }}
                      className="text-indigo-600 font-bold text-xs hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Teléfono / Celular</span>
                      <span className="font-mono font-bold text-slate-800">{selectedCustomer.phone}</span>
                    </div>
                  </div>

                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Correo Electrónico</span>
                        <span className="text-slate-800">{selectedCustomer.email}</span>
                      </div>
                    </div>
                  )}

                  {selectedCustomer.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Dirección de Entrega</span>
                        <span className="text-slate-800 font-medium">{selectedCustomer.address}</span>
                        {selectedCustomer.reference && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Referencia: {selectedCustomer.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCustomer.notes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900 text-xs">
                    <strong>Nota / Preferencias:</strong> {selectedCustomer.notes}
                  </div>
                )}
              </div>

              {/* Direct WhatsApp Action */}
              <a
                href={generateWhatsAppLink(
                  selectedCustomer.phone,
                  `¡Hola ${selectedCustomer.name}! Te saludamos de *${currentOrg.name}*. Estamos a tu servicio para cualquier consulta o pedido.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar con {selectedCustomer.name.split(' ')[0]} en WhatsApp</span>
              </a>

              {/* Order & Appointments History Tabs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCustomerHistoryTab('ORDERS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        customerHistoryTab === 'ORDERS' 
                          ? 'bg-white text-slate-900 shadow-2xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pedidos ({getCustomerOrders(selectedCustomer).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerHistoryTab('APPOINTMENTS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        customerHistoryTab === 'APPOINTMENTS' 
                          ? 'bg-white text-purple-700 shadow-2xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Citas ({getCustomerAppointments(selectedCustomer).length})
                    </button>
                  </div>
                </div>

                {customerHistoryTab === 'ORDERS' ? (
                  getCustomerOrders(selectedCustomer).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No hay pedidos registrados con este número o nombre.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {getCustomerOrders(selectedCustomer).map(o => (
                        <div 
                          key={o.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              {o.order_number}
                            </span>
                            <div>
                              <span className="text-slate-400 text-[10px] block">
                                {new Date(o.created_at).toLocaleDateString()} • {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-slate-700 font-medium">
                                {o.items.length} {o.items.length === 1 ? 'artículo' : 'artículos'} ({o.delivery_type === 'PICKUP' ? 'Recojo' : 'Delivery'})
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-slate-900 block">
                              {formatCurrency(o.total, currency)}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-indigo-600">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  getCustomerAppointments(selectedCustomer).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No hay citas agendadas registradas para este cliente.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {getCustomerAppointments(selectedCustomer).map(apt => (
                        <div 
                          key={apt.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex flex-col items-center justify-center font-bold text-[10px] shrink-0">
                              <span>{apt.appointment_date.split('-')[2]}/{apt.appointment_date.split('-')[1]}</span>
                              <span>{apt.start_time}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {apt.service_name}
                              </span>
                              <span className="text-slate-500 text-[11px] block">
                                {apt.duration_minutes} min • {apt.staff_name ? `Especialista: ${apt.staff_name}` : 'Sin asignar'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-slate-900 block">
                              {formatCurrency(apt.service_price, currency)}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                              apt.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {canDeleteCustomers && (
                  <button
                    onClick={() => {
                      const cust = selectedCustomer;
                      setDeleteCandidate(cust);
                    }}
                    className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canManageCustomers && (
                  <button
                    onClick={() => {
                      const cust = selectedCustomer;
                      setSelectedCustomer(null);
                      openEditModal(cust);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Create / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-900">
                {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +51 987 654 321"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  placeholder="Av. Principal 123, Distrito"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Referencia de Ubicación</label>
                <input
                  type="text"
                  placeholder="Frente al parque, portón verde"
                  value={formReference}
                  onChange={e => setFormReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Preferencias especiales, alergias o instrucciones..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isSubmitting ? 'Guardando...' : (editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente')}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar cliente?</h3>
              <p className="text-xs text-slate-500">
                ¿Deseas eliminar a "{deleteCandidate.name}" de los registros de este negocio?
              </p>
            </div>
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                {errorMessage}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setDeleteCandidate(null);
                  setErrorMessage(null);
                }}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-50 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDeleteCustomer(deleteCandidate.id)}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isSubmitting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360 CRM Profile Modal (Fase 8) */}
      <CustomerProfile360Modal
        isOpen={is360ModalOpen}
        onClose={() => {
          setIs360ModalOpen(false);
          setProfile360Data(null);
        }}
        profileData={profile360Data}
        isLoading={isLoadingProfile}
        onUpdateNotes={async (notes) => {
          if (profile360Data?.customer.id) {
            await updateCustomer(profile360Data.customer.id, { notes });
          }
        }}
      />

    </div>
  );
};
