/**
 * Negocio Flex - Order Domain Use Cases (Fase 5)
 * Casos de uso desacoplados para la gestión de pedidos y ventas bajo Clean Architecture.
 */

import {
  OrderEntity,
  OrderItemEntity,
  CreateOrderParams,
  UpdateOrderParams,
  CreateOrderItemParams,
  OrderStatus,
} from '../entities/order_entity';
import { OrderRepository } from '../repositories/order_repository';
import { OrderStateMachine } from '../state_machine/order_state_machine';
import { OrderPermissions } from '../permissions/order_permissions';
import { ValidationException, UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class GetOrdersUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(organizationId: string): Promise<OrderEntity[]> {
    if (!organizationId || organizationId.trim().length === 0) {
      throw new ValidationException('El ID de organización es requerido para consultar pedidos.');
    }
    return this.repository.getOrders(organizationId.trim());
  }
}

export class GetOrderByIdUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(id: string): Promise<OrderEntity | null> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido.');
    }
    return this.repository.getOrderById(id.trim());
  }
}

export class CreateOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(params: CreateOrderParams): Promise<OrderEntity> {
    if (!params.organizationId || params.organizationId.trim().length === 0) {
      throw new ValidationException('El ID de organización es obligatorio.');
    }

    if (!params.customerName || params.customerName.trim().length < 2) {
      throw new ValidationException('El nombre del cliente debe tener al menos 2 caracteres.');
    }

    if (!params.customerPhone || params.customerPhone.trim().length < 6) {
      throw new ValidationException('El teléfono del cliente debe tener al menos 6 caracteres.');
    }

    if (!params.items || params.items.length === 0) {
      throw new ValidationException('El pedido debe incluir al menos un artículo.');
    }

    // Validar y recalcular subtotales de artículos si es necesario
    const validatedItems = params.items.map((item, idx) => {
      if (!item.productName || item.productName.trim().length === 0) {
        throw new ValidationException(`El artículo #${idx + 1} requiere un nombre de producto.`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new ValidationException(`La cantidad del artículo #${idx + 1} debe ser mayor a 0.`);
      }
      if (item.unitPrice < 0) {
        throw new ValidationException(`El precio unitario del artículo #${idx + 1} no puede ser negativo.`);
      }
      // Recalcular estrictamente subtotal por artículo: precio unitario * cantidad
      const itemSubtotal = item.unitPrice * item.quantity;
      return {
        ...item,
        subtotal: itemSubtotal,
      };
    });

    // Recálculo obligatorio del subtotal y total para evitar manipulación desde el cliente
    const calculatedSubtotal = validatedItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const discount = Math.max(0, Number(params.discount) || 0);
    const deliveryFee = Math.max(0, Number(params.deliveryFee) || 0);
    const calculatedTotal = Math.max(0, calculatedSubtotal - discount + deliveryFee);

    return this.repository.createOrder({
      ...params,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discount,
      deliveryFee,
      total: calculatedTotal,
    });
  }
}

export class UpdateOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(id: string, params: UpdateOrderParams): Promise<OrderEntity> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido para actualizar.');
    }

    if (params.customerName !== undefined && params.customerName.trim().length < 2) {
      throw new ValidationException('El nombre del cliente debe tener al menos 2 caracteres.');
    }

    if (params.customerPhone !== undefined && params.customerPhone.trim().length < 6) {
      throw new ValidationException('El teléfono del cliente debe tener al menos 6 caracteres.');
    }

    return this.repository.updateOrder(id.trim(), params);
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(
    id: string,
    status: OrderStatus,
    options?: { role?: string; organizationId?: string }
  ): Promise<OrderEntity> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido.');
    }

    const validStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'SHIPPED',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      throw new ValidationException(`Estado de pedido inválido: ${status}`);
    }

    // 1. Obtener pedido actual para validar máquina de estados y aislamiento multi-tenant
    const existing = await this.repository.getOrderById(id.trim());
    if (existing) {
      if (options?.organizationId && existing.organizationId !== options.organizationId) {
        throw new UnauthorizedException('No tiene autorización para modificar pedidos pertenecientes a otra organización.');
      }

      // 2. Validación estricta de la máquina de estados de dominio
      OrderStateMachine.assertCanTransition(existing.status, status, existing.deliveryType);
    }

    // 3. Verificación de permisos de rol (RBAC)
    if (options?.role) {
      OrderPermissions.assertCanUpdateStatus(options.role);
    }

    return this.repository.updateOrderStatus(id.trim(), status);
  }
}

export class DeleteOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(
    id: string,
    options?: { role?: string; organizationId?: string }
  ): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido para eliminar.');
    }

    // 1. Verificación de permisos de rol (RBAC)
    if (options?.role) {
      OrderPermissions.assertCanDelete(options.role);
    }

    // 2. Verificar existencia y aislamiento multi-tenant
    const existing = await this.repository.getOrderById(id.trim());
    if (existing && options?.organizationId && existing.organizationId !== options.organizationId) {
      throw new UnauthorizedException('No tiene autorización para eliminar pedidos de otra organización.');
    }

    return this.repository.deleteOrder(id.trim());
  }
}

export class GetOrderItemsUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(orderId: string): Promise<OrderItemEntity[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido.');
    }
    return this.repository.getOrderItems(orderId.trim());
  }
}

export class CreateOrderItemsUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async execute(
    orderId: string,
    items: CreateOrderItemParams[],
    organizationId: string
  ): Promise<OrderItemEntity[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new ValidationException('El ID del pedido es requerido.');
    }
    if (!organizationId || organizationId.trim().length === 0) {
      throw new ValidationException('El ID de organización es requerido.');
    }
    if (!items || items.length === 0) {
      throw new ValidationException('Debe proporcionar al menos un artículo.');
    }
    return this.repository.createOrderItems(orderId.trim(), items, organizationId.trim());
  }
}
