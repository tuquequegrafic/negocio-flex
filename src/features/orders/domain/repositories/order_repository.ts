/**
 * Negocio Flex - Order Repository Contract (Fase 5)
 * Contrato formal para la persistencia y consulta del módulo de Pedidos y Artículos en Dominio.
 */

import {
  OrderEntity,
  OrderItemEntity,
  CreateOrderParams,
  UpdateOrderParams,
  CreateOrderItemParams,
  OrderStatus,
} from '../entities/order_entity';

export interface OrderRepository {
  /**
   * Obtiene todos los pedidos pertenecientes a una organización.
   */
  getOrders(organizationId: string): Promise<OrderEntity[]>;

  /**
   * Obtiene un pedido por su identificador único.
   */
  getOrderById(id: string): Promise<OrderEntity | null>;

  /**
   * Registra un nuevo pedido y sus artículos asociados.
   */
  createOrder(params: CreateOrderParams): Promise<OrderEntity>;

  /**
   * Actualiza los datos de un pedido existente.
   */
  updateOrder(id: string, params: UpdateOrderParams): Promise<OrderEntity>;

  /**
   * Cambia el estado operacional de un pedido (ej: PENDING -> CONFIRMED -> DELIVERED).
   */
  updateOrderStatus(id: string, status: OrderStatus): Promise<OrderEntity>;

  /**
   * Elimina o cancela un pedido por su identificador.
   */
  deleteOrder(id: string): Promise<void>;

  /**
   * Obtiene la lista de artículos pertenecientes a un pedido específico.
   */
  getOrderItems(orderId: string): Promise<OrderItemEntity[]>;

  /**
   * Registra los artículos de un pedido de manera persistente.
   */
  createOrderItems(
    orderId: string,
    items: CreateOrderItemParams[],
    organizationId: string
  ): Promise<OrderItemEntity[]>;
}
