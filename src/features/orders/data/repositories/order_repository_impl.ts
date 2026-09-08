/**
 * Negocio Flex - Order Repository Implementation (Fase 5)
 * Implementación concreta del contrato de repositorio de Pedidos delegando en OrderDataSource.
 */

import {
  OrderEntity,
  OrderItemEntity,
  CreateOrderParams,
  UpdateOrderParams,
  CreateOrderItemParams,
  OrderStatus,
} from '../../domain/entities/order_entity';
import { OrderRepository } from '../../domain/repositories/order_repository';
import { OrderDataSource } from '../datasources/order_datasource';

export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly dataSource: OrderDataSource) {}

  async getOrders(organizationId: string): Promise<OrderEntity[]> {
    return this.dataSource.fetchOrdersByOrg(organizationId);
  }

  async getOrderById(id: string): Promise<OrderEntity | null> {
    return this.dataSource.fetchOrderById(id);
  }

  async createOrder(params: CreateOrderParams): Promise<OrderEntity> {
    return this.dataSource.insertOrder(params);
  }

  async updateOrder(id: string, params: UpdateOrderParams): Promise<OrderEntity> {
    return this.dataSource.updateOrder(id, params);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    return this.dataSource.updateOrderStatus(id, status);
  }

  async deleteOrder(id: string): Promise<void> {
    return this.dataSource.deleteOrder(id);
  }

  async getOrderItems(orderId: string): Promise<OrderItemEntity[]> {
    return this.dataSource.fetchOrderItems(orderId);
  }

  async createOrderItems(
    orderId: string,
    items: CreateOrderItemParams[],
    organizationId: string
  ): Promise<OrderItemEntity[]> {
    return this.dataSource.insertOrderItems(orderId, items, organizationId);
  }
}
