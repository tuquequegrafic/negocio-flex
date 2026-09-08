/**
 * Negocio Flex - useCustomers Hook (Fase 8)
 * Hook reactivo para gestión integral de clientes, segmentación y métricas 360°.
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { Customer } from '../../../../types';
import {
  CustomerProfile360,
  CustomerSegment,
  CustomerFilterParams,
} from '../../domain/entities/customer_entity';
import { CustomerModel } from '../../data/models/customer_model';

export function useCustomers() {
  const {
    customers,
    orders,
    appointments,
    currentOrg,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
    getCustomerProfile360,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'ALL'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [profile360Data, setProfile360Data] = useState<CustomerProfile360 | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Filtrar clientes de la organización activa
  const orgCustomers = useMemo(() => {
    if (!currentOrg?.id) return [];
    return customers.filter(c => c.organization_id === currentOrg.id);
  }, [customers, currentOrg?.id]);

  // Modelos enriquecidos con segmento
  const enrichedCustomers = useMemo(() => {
    return orgCustomers.map(c => {
      const model = CustomerModel.fromItem(c);
      return {
        ...c,
        segment: model.getSegment(),
      };
    });
  }, [orgCustomers]);

  // Estadísticas globales de CRM para la organización activa
  const stats = useMemo(() => {
    const totalCount = enrichedCustomers.length;
    const totalRevenue = enrichedCustomers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
    const totalOrdersCount = enrichedCustomers.reduce((acc, c) => acc + (c.total_orders || 0), 0);
    const vipCount = enrichedCustomers.filter(c => c.segment === 'VIP').length;
    const frequentCount = enrichedCustomers.filter(c => c.segment === 'FREQUENT').length;
    const newCount = enrichedCustomers.filter(c => c.segment === 'NEW').length;
    const avgLtv = totalCount > 0 ? Math.round((totalRevenue / totalCount) * 100) / 100 : 0;

    return {
      totalCount,
      totalRevenue,
      totalOrdersCount,
      vipCount,
      frequentCount,
      newCount,
      avgLtv,
    };
  }, [enrichedCustomers]);

  // Lista filtrada por búsqueda y segmento
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      // Filtro por segmento
      if (selectedSegment !== 'ALL' && c.segment !== selectedSegment) {
        return false;
      }
      // Filtro por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q) || false;
        const matchAddress = c.address?.toLowerCase().includes(q) || false;
        return matchName || matchPhone || matchEmail || matchAddress;
      }
      return true;
    });
  }, [enrichedCustomers, selectedSegment, searchQuery]);

  // Cargar Ficha 360°
  const openCustomer360 = useCallback(async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIs360ModalOpen(true);
    setIsLoadingProfile(true);

    try {
      if (getCustomerProfile360) {
        const data = await getCustomerProfile360(customerId);
        if (data) {
          setProfile360Data(data);
          setIsLoadingProfile(false);
          return;
        }
      }

      // Fallback local desde estado si no se recibe del backend
      const targetCustomer = orgCustomers.find(c => c.id === customerId);
      if (targetCustomer) {
        const cleanTargetPhone = targetCustomer.phone.replace(/\s+/g, '');
        const custOrders = orders.filter(
          o => o.organization_id === targetCustomer.organization_id &&
          (o.customer_phone?.replace(/\s+/g, '') === cleanTargetPhone || o.customer_name?.toLowerCase() === targetCustomer.name.toLowerCase())
        );
        const custAppointments = appointments.filter(
          a => a.organization_id === targetCustomer.organization_id &&
          a.customer_phone?.replace(/\s+/g, '') === cleanTargetPhone
        );

        const model = CustomerModel.fromItem(targetCustomer);
        const totalSpent = custOrders.reduce((acc, o) => acc + (o.total || 0), 0) || (targetCustomer.total_spent || 0);
        const totalOrders = custOrders.length || (targetCustomer.total_orders || 0);

        setProfile360Data({
          customer: model,
          orders: custOrders.map(o => ({
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
          appointments: custAppointments.map(a => ({
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
            totalAppointments: custAppointments.length,
            totalSpent,
            avgTicket: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
            segment: model.getSegment(),
          },
        });
      }
    } catch (err) {
      console.error('Error al cargar perfil 360°:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getCustomerProfile360, orgCustomers, orders, appointments]);

  const closeCustomer360 = useCallback(() => {
    setIs360ModalOpen(false);
    setSelectedCustomerId(null);
    setProfile360Data(null);
  }, []);

  // Exportar a CSV
  const exportToCSV = useCallback(() => {
    if (enrichedCustomers.length === 0) return;

    const headers = ['Nombre', 'Telefono', 'Email', 'Direccion', 'Total Pedidos', 'Total Gastado', 'Ultimo Pedido', 'Segmento'];
    const rows = enrichedCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.total_orders || 0,
      (c.total_spent || 0).toFixed(2),
      `"${c.last_order_date || ''}"`,
      c.segment,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_${currentOrg?.slug || 'negocio'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [enrichedCustomers, currentOrg?.slug]);

  return {
    customers: filteredCustomers,
    allCustomers: enrichedCustomers,
    stats,
    searchQuery,
    setSearchQuery,
    selectedSegment,
    setSelectedSegment,
    is360ModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingCustomer,
    setEditingCustomer,
    selectedCustomerId,
    profile360Data,
    isLoadingProfile,
    openCustomer360,
    closeCustomer360,
    exportToCSV,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
  };
}
