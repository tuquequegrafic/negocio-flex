import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { currentOrg, customers, orders, addCustomer, updateCustomer, deleteCustomer, setActiveView } = useApp();
  
  const orgCustomers = customers.filter(c => c.organization_id === currentOrg.id);
  const orgOrders = orders.filter(o => o.organization_id === currentOrg.id);
  const currency = currentOrg.settings?.currency || 'S/';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filter customers
  const filteredCustomers = orgCustomers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  // Calculate Metrics
  const totalClientsCount = orgCustomers.length;
  const totalSalesFromClients = orgCustomers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  const recurringClientsCount = orgCustomers.filter(c => (c.total_orders || 0) > 1).length;
  const avgClientLTV = totalClientsCount > 0 ? totalSalesFromClients / totalClientsCount : 0;

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormReference('');
    setFormNotes('');
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
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        reference: formReference.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          reference: formReference.trim() || undefined,
          notes: formNotes.trim() || undefined,
        } : null);
      }
    } else {
      addCustomer({
        organization_id: currentOrg.id,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        reference: formReference.trim() || undefined,
        notes: formNotes.trim() || undefined,
        total_orders: 0,
        total_spent: 0,
      });
    }

    setIsModalOpen(false);
  };

  // Get order history for a customer
  const getCustomerOrders = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/\s+/g, '');
    return orgOrders.filter(
      o => o.customer_phone.replace(/\s+/g, '') === cleanPhone || 
           o.customer_name.toLowerCase() === customer.name.toLowerCase()
    );
  };

  const generateWhatsAppLink = (phone: string, text: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const num = clean.startsWith('51') ? clean : `51${clean}`;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h1 className="text-2xl font-black text-slate-900">Directorio de Clientes</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro automático de clientes, historial de pedidos e historial de compras para <strong>{currentOrg.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Recurrentes</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono block">
            {recurringClientsCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> &gt; 1 pedido realizado
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Clientes</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(totalSalesFromClients, currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Volumen total acumulado</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">LTV Promedio</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">
            {formatCurrency(avgClientLTV, currency)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Gasto promedio por cliente</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, teléfono, dirección o email..."
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
                          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                              {customer.name}
                            </span>
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
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Ver Perfil e Historial"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Editar Datos"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar cliente ${customer.name}?`)) {
                                deleteCustomer(customer.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar Cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

              {/* Order History */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Historial de Pedidos de este Cliente
                </span>

                {getCustomerOrders(selectedCustomer).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No hay pedidos registrados con este número o nombre.
                  </div>
                ) : (
                  <div className="space-y-2">
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
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
