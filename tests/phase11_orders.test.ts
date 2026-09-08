import { describe, it, expect } from 'vitest';
import {
  OrderStateMachine,
  OrderPermissions,
  OrderEntity,
  OrderStatus,
  UpdateOrderStatusUseCase,
  DeleteOrderUseCase,
  OrderRepository,
} from '../src/features/orders';
import { ValidationException, UnauthorizedException } from '../src/core/errors/app_exceptions';

// Mock Repository for unit testing UseCases
class MockOrderRepository implements OrderRepository {
  public orders: OrderEntity[] = [];

  async getOrders(organizationId: string): Promise<OrderEntity[]> {
    return this.orders.filter(o => o.organizationId === organizationId);
  }

  async getOrderById(id: string): Promise<OrderEntity | null> {
    return this.orders.find(o => o.id === id) || null;
  }

  async createOrder(params: any): Promise<OrderEntity> {
    const newOrder: OrderEntity = {
      id: params.id || 'ord-mock-1',
      organizationId: params.organizationId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      orderNumber: params.orderNumber || '#000100',
      status: params.status || 'PENDING',
      subtotal: params.subtotal || 50,
      discount: params.discount || 0,
      deliveryFee: params.deliveryFee || 5,
      total: params.total || 55,
      deliveryType: params.deliveryType || 'DELIVERY',
      paymentMethod: params.paymentMethod || 'YAPE',
      items: params.items || [],
      createdAt: new Date().toISOString(),
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async updateOrder(id: string, params: any): Promise<OrderEntity> {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    this.orders[idx] = { ...this.orders[idx], ...params };
    return this.orders[idx];
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const idx = this.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    this.orders[idx] = { ...this.orders[idx], status };
    return this.orders[idx];
  }

  async deleteOrder(id: string): Promise<void> {
    this.orders = this.orders.filter(o => o.id !== id);
  }

  async getOrderItems(orderId: string): Promise<any[]> {
    const o = await this.getOrderById(orderId);
    return o ? o.items : [];
  }

  async createOrderItems(): Promise<any[]> {
    return [];
  }
}

describe('Fase 11: Orders - Máquina de Estados & Reglas de Negocio', () => {
  describe('OrderStateMachine', () => {
    it('debe permitir la secuencia completa de avance operativo para DELIVERY', () => {
      expect(OrderStateMachine.canTransition('PENDING', 'CONFIRMED', 'DELIVERY').valid).toBe(true);
      expect(OrderStateMachine.canTransition('CONFIRMED', 'PREPARING', 'DELIVERY').valid).toBe(true);
      expect(OrderStateMachine.canTransition('PREPARING', 'READY', 'DELIVERY').valid).toBe(true);
      expect(OrderStateMachine.canTransition('READY', 'SHIPPED', 'DELIVERY').valid).toBe(true);
      expect(OrderStateMachine.canTransition('SHIPPED', 'DELIVERY' as any, 'DELIVERY').valid).toBe(false); // DELIVERED is the target
      expect(OrderStateMachine.canTransition('SHIPPED', 'DELIVERED', 'DELIVERY').valid).toBe(true);
      expect(OrderStateMachine.canTransition('DELIVERED', 'COMPLETED', 'DELIVERY').valid).toBe(true);
    });

    it('debe permitir la entrega directa para pedidos con recojo en tienda (PICKUP)', () => {
      // De READY pasa directamente a DELIVERED
      expect(OrderStateMachine.canTransition('READY', 'DELIVERED', 'PICKUP').valid).toBe(true);
      // Pero no debe permitir marcarlo como En Camino (SHIPPED)
      const invalidPickupResult = OrderStateMachine.canTransition('READY', 'SHIPPED', 'PICKUP');
      expect(invalidPickupResult.valid).toBe(false);
      expect(invalidPickupResult.reason).toContain('PICKUP');
    });

    it('debe permitir cancelaciones válidas desde PENDING, CONFIRMED y PREPARING', () => {
      expect(OrderStateMachine.canTransition('PENDING', 'CANCELLED').valid).toBe(true);
      expect(OrderStateMachine.canTransition('CONFIRMED', 'CANCELLED').valid).toBe(true);
      expect(OrderStateMachine.canTransition('PREPARING', 'CANCELLED').valid).toBe(true);
    });

    it('debe rechazar cancelaciones ilegales desde DELIVERED, COMPLETED o CANCELLED', () => {
      const deliveredCancel = OrderStateMachine.canTransition('DELIVERED', 'CANCELLED');
      expect(deliveredCancel.valid).toBe(false);
      expect(deliveredCancel.reason).toContain('DELIVERED');

      const completedCancel = OrderStateMachine.canTransition('COMPLETED', 'CANCELLED');
      expect(completedCancel.valid).toBe(false);
      expect(completedCancel.reason).toContain('terminal');

      const cancelledCancel = OrderStateMachine.canTransition('CANCELLED', 'CONFIRMED');
      expect(cancelledCancel.valid).toBe(false);
      expect(cancelledCancel.reason).toContain('terminal');
    });

    it('debe rechazar transiciones regresivas o saltos ilegales', () => {
      // DELIVERED -> PENDING
      const deliveredToPending = OrderStateMachine.canTransition('DELIVERED', 'PENDING');
      expect(deliveredToPending.valid).toBe(false);

      // PENDING -> DELIVERED (salto arbitrario)
      const jumpToDelivered = OrderStateMachine.canTransition('PENDING', 'DELIVERED');
      expect(jumpToDelivered.valid).toBe(false);

      // CANCELLED -> CONFIRMED
      const reviveCancelled = OrderStateMachine.canTransition('CANCELLED', 'CONFIRMED');
      expect(reviveCancelled.valid).toBe(false);
    });

    it('debe listar correctamente los próximos estados permitidos', () => {
      const pendingNext = OrderStateMachine.getAllowedNextStatuses('PENDING');
      expect(pendingNext).toContain('CONFIRMED');
      expect(pendingNext).toContain('CANCELLED');

      const readyDeliveryNext = OrderStateMachine.getAllowedNextStatuses('READY', 'DELIVERY');
      expect(readyDeliveryNext).toContain('SHIPPED');
      expect(readyDeliveryNext).toContain('DELIVERED');
      expect(readyDeliveryNext).not.toContain('CANCELLED');

      const readyPickupNext = OrderStateMachine.getAllowedNextStatuses('READY', 'PICKUP');
      expect(readyPickupNext).toContain('DELIVERED');
      expect(readyPickupNext).not.toContain('SHIPPED');

      const completedNext = OrderStateMachine.getAllowedNextStatuses('COMPLETED');
      expect(completedNext).toEqual([]);
    });
  });

  describe('OrderPermissions (RBAC)', () => {
    it('super_admin, owner y admin tienen permisos completos incluyendo eliminación', () => {
      const fullRoles = ['super_admin', 'owner', 'admin'];
      for (const role of fullRoles) {
        expect(OrderPermissions.canView(role)).toBe(true);
        expect(OrderPermissions.canUpdateStatus(role)).toBe(true);
        expect(OrderPermissions.canCancel(role)).toBe(true);
        expect(OrderPermissions.canDelete(role)).toBe(true);
        expect(() => OrderPermissions.assertCanUpdateStatus(role)).not.toThrow();
        expect(() => OrderPermissions.assertCanDelete(role)).not.toThrow();
      }
    });

    it('staff tiene permiso operacional pero tiene prohibida la eliminación física', () => {
      expect(OrderPermissions.canView('staff')).toBe(true);
      expect(OrderPermissions.canUpdateStatus('staff')).toBe(true);
      expect(OrderPermissions.canCancel('staff')).toBe(true);
      expect(OrderPermissions.canDelete('staff')).toBe(false);

      expect(() => OrderPermissions.assertCanUpdateStatus('staff')).not.toThrow();
      expect(() => OrderPermissions.assertCanDelete('staff')).toThrow(UnauthorizedException);
    });

    it('viewer solo tiene permiso de lectura y ninguna capacidad de mutación', () => {
      expect(OrderPermissions.canView('viewer')).toBe(true);
      expect(OrderPermissions.canUpdateStatus('viewer')).toBe(false);
      expect(OrderPermissions.canCancel('viewer')).toBe(false);
      expect(OrderPermissions.canDelete('viewer')).toBe(false);

      expect(() => OrderPermissions.assertCanUpdateStatus('viewer')).toThrow(UnauthorizedException);
      expect(() => OrderPermissions.assertCanDelete('viewer')).toThrow(UnauthorizedException);
    });
  });

  describe('UseCases de Pedidos con Reglas de Dominio y Multi-Tenant', () => {
    it('UpdateOrderStatusUseCase valida máquina de estados y aislamiento de organización', async () => {
      const repo = new MockOrderRepository();
      await repo.createOrder({
        id: 'ord-test-1',
        organizationId: 'org-alpha',
        customerName: 'Carlos Gómez',
        customerPhone: '999888777',
        status: 'PENDING',
        deliveryType: 'DELIVERY',
      });

      const usecase = new UpdateOrderStatusUseCase(repo);

      // 1. Transición válida con el mismo tenant y rol admin
      const updated = await usecase.execute('ord-test-1', 'CONFIRMED', {
        organizationId: 'org-alpha',
        role: 'admin',
      });
      expect(updated.status).toBe('CONFIRMED');

      // 2. Transición inválida en máquina de estados (CONFIRMED -> DELIVERED)
      await expect(
        usecase.execute('ord-test-1', 'DELIVERED', {
          organizationId: 'org-alpha',
          role: 'admin',
        })
      ).rejects.toThrow(ValidationException);

      // 3. Intento de modificación cruzada por otra organización (Cross-Tenant)
      await expect(
        usecase.execute('ord-test-1', 'PREPARING', {
          organizationId: 'org-bravo', // Otra organización
          role: 'admin',
        })
      ).rejects.toThrow(UnauthorizedException);

      // 4. Intento de modificación por un usuario con rol 'viewer'
      await expect(
        usecase.execute('ord-test-1', 'PREPARING', {
          organizationId: 'org-alpha',
          role: 'viewer',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('DeleteOrderUseCase valida permisos de rol y aislamiento de organización', async () => {
      const repo = new MockOrderRepository();
      await repo.createOrder({
        id: 'ord-to-del',
        organizationId: 'org-alpha',
        customerName: 'Cliente Prueba',
        customerPhone: '999111222',
        status: 'PENDING',
      });

      const usecase = new DeleteOrderUseCase(repo);

      // 1. Intento de eliminación por rol staff debe ser bloqueado
      await expect(
        usecase.execute('ord-to-del', {
          organizationId: 'org-alpha',
          role: 'staff',
        })
      ).rejects.toThrow(UnauthorizedException);

      // 2. Intento de eliminación por tenant no dueño debe ser bloqueado
      await expect(
        usecase.execute('ord-to-del', {
          organizationId: 'org-other',
          role: 'owner',
        })
      ).rejects.toThrow(UnauthorizedException);

      // 3. Eliminación autorizada por owner del mismo tenant
      await usecase.execute('ord-to-del', {
        organizationId: 'org-alpha',
        role: 'owner',
      });

      const check = await repo.getOrderById('ord-to-del');
      expect(check).toBeNull();
    });
  });
});
