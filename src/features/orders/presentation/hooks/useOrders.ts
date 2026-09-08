/**
 * Negocio Flex - useOrders Hook (Fase 11: Presentación Desacoplada)
 * Hook reactivo de alto nivel para la gestión operacional de pedidos, despacho y ventas.
 * Orquesta la llamada a UseCases, StateMachine y RBAC con compatibilidad retroactiva.
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { OrderEntity, OrderStatus } from '../../domain/entities/order_entity';
import { OrderModel } from '../../data/models/order_model';
import { OrderRepositoryImpl } from '../../data/repositories/order_repository_impl';
import { OrderDataSource } from '../../data/datasources/order_datasource';
import {
  GetOrdersUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderUseCase,
} from '../../domain/usecases/order_usecases';
import { OrderPermissions } from '../../domain/permissions/order_permissions';
import { OrderStateMachine } from '../../domain/state_machine/order_state_machine';
import { ORDER_STATUS_CONFIGS } from '../components/OrderStatusBadge';

export interface UseOrdersResult {
  // Datos y colecciones
  orders: OrderEntity[];
  filteredOrders: OrderEntity[];
  selectedStatus: string;
  searchTerm: string;
  loading: boolean;
  deletingOrderId: string | null;
  selectedOrderForDetails: OrderEntity | null;
  selectedOrderForDispatch: OrderEntity | null;

  // Métricas operacionales
  totalSales: number;
  pendingCount: number;
  inProgressCount: number;
  avgTicket: number;
  currency: string;
  orgName: string;

  // Permisos según RBAC
  canManageStatus: boolean;
  canDelete: boolean;
  canView: boolean;

  // Modales y drawers
  setSelectedOrderForDetails: (order: OrderEntity | null) => void;
  setSelectedOrderForDispatch: (order: OrderEntity | null) => void;

  // Acciones
  setSelectedStatus: (status: string) => void;
  setSearchTerm: (term: string) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string, orderNumber: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  getAllowedNextStatuses: (order: OrderEntity) => OrderStatus[];
}

export function useOrders(): UseOrdersResult {
  const {
    currentOrg,
    currentUser,
    orders: legacyOrders,
    updateOrderStatus: legacyUpdateStatus,
    deleteOrder: legacyDeleteOrder,
    refreshOrders: legacyRefreshOrders,
    ordersLoading,
  } = useApp();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrderEntity | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<OrderEntity | null>(null);

  // Instanciar UseCases desacoplados
  const orderRepo = useMemo(() => new OrderRepositoryImpl(new OrderDataSource()), []);
  const updateStatusUseCase = useMemo(() => new UpdateOrderStatusUseCase(orderRepo), [orderRepo]);
  const deleteOrderUseCase = useMemo(() => new DeleteOrderUseCase(orderRepo), [orderRepo]);

  // Normalizar pedidos de la organización activa a OrderEntity
  const orgOrders: OrderEntity[] = useMemo(() => {
    return legacyOrders
      .filter(o => o.organization_id === currentOrg.id)
      .map(o => OrderModel.fromLegacy(o));
  }, [legacyOrders, currentOrg.id]);

  // Determinar permisos basados en el rol del usuario autenticado
  const userRole = currentUser?.role?.toLowerCase() || 'owner';
  const canView = OrderPermissions.canView(userRole);
  const canManageStatus = OrderPermissions.canUpdateStatus(userRole);
  const canDelete = OrderPermissions.canDelete(userRole);

  // Filtrado reactivo de pedidos
  const filteredOrders = useMemo(() => {
    return orgOrders.filter(o => {
      const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [orgOrders, selectedStatus, searchTerm]);

  // Cálculo determinista de métricas operacionales
  const { totalSales, pendingCount, inProgressCount, avgTicket } = useMemo(() => {
    const validOrders = orgOrders.filter(o => o.status !== 'CANCELLED');
    const sales = validOrders.reduce((acc, o) => acc + o.total, 0);
    const pending = orgOrders.filter(o => o.status === 'PENDING').length;
    const inProgress = orgOrders.filter(
      o => o.status === 'PREPARING' || o.status === 'READY' || o.status === 'CONFIRMED' || o.status === 'SHIPPED'
    ).length;
    const avg = validOrders.length > 0 ? sales / validOrders.length : 0;

    return {
      totalSales: sales,
      pendingCount: pending,
      inProgressCount: inProgress,
      avgTicket: avg,
    };
  }, [orgOrders]);

  // Acción: Actualizar estado con validación en UseCase y StateMachine
  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const order = orgOrders.find(o => o.id === orderId);
      if (order) {
        // Validación preventiva en dominio
        OrderStateMachine.assertCanTransition(order.status, newStatus, order.deliveryType);
      }

      // Ejecutar actualización a través del contexto legado (que replica en Supabase y localmente)
      await legacyUpdateStatus(orderId, newStatus);

      // Si el modal de detalle o despacho está abierto, actualizar su estado
      if (selectedOrderForDetails?.id === orderId) {
        setSelectedOrderForDetails(prev => (prev ? { ...prev, status: newStatus } : null));
      }
      if (selectedOrderForDispatch?.id === orderId) {
        setSelectedOrderForDispatch(prev => (prev ? { ...prev, status: newStatus } : null));
      }
    },
    [orgOrders, legacyUpdateStatus, selectedOrderForDetails?.id, selectedOrderForDispatch?.id]
  );

  // Acción: Eliminar pedido con validación de RBAC
  const handleDeleteOrder = useCallback(
    async (orderId: string, orderNumber: string) => {
      if (!canDelete) {
        alert('No tienes permisos suficientes para eliminar pedidos.');
        return;
      }

      if (window.confirm(`¿Estás seguro de eliminar el pedido ${orderNumber}? Esta acción no se puede deshacer.`)) {
        setDeletingOrderId(orderId);
        try {
          await legacyDeleteOrder(orderId);
          if (selectedOrderForDetails?.id === orderId) {
            setSelectedOrderForDetails(null);
          }
          if (selectedOrderForDispatch?.id === orderId) {
            setSelectedOrderForDispatch(null);
          }
        } finally {
          setDeletingOrderId(null);
        }
      }
    },
    [canDelete, legacyDeleteOrder, selectedOrderForDetails?.id, selectedOrderForDispatch?.id]
  );

  const getAllowedNextStatuses = useCallback((order: OrderEntity): OrderStatus[] => {
    return OrderStateMachine.getAllowedNextStatuses(order.status, order.deliveryType);
  }, []);

  return {
    orders: orgOrders,
    filteredOrders,
    selectedStatus,
    searchTerm,
    loading: ordersLoading,
    deletingOrderId,
    selectedOrderForDetails,
    selectedOrderForDispatch,
    totalSales,
    pendingCount,
    inProgressCount,
    avgTicket,
    currency: currentOrg.settings?.currency || 'S/',
    orgName: currentOrg.name,
    canManageStatus,
    canDelete,
    canView,
    setSelectedOrderForDetails,
    setSelectedOrderForDispatch,
    setSelectedStatus,
    setSearchTerm,
    updateOrderStatus: handleUpdateStatus,
    deleteOrder: handleDeleteOrder,
    refreshOrders: legacyRefreshOrders,
    getAllowedNextStatuses,
  };
}
