/**
 * Negocio Flex - Order State Machine (Fase 11: Dominio Puro)
 * 
 * Máquina de estados determinista para el ciclo de vida operacional de pedidos.
 * Garantiza integridad en transiciones, prevención de saltos ilegales y respeto
 * del canal de entrega (DELIVERY vs PICKUP).
 */

import { OrderStatus, DeliveryType } from '../entities/order_entity';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export interface OrderTransitionResult {
  readonly valid: boolean;
  readonly reason?: string;
}

export class OrderStateMachine {
  /**
   * Mapa canónico de transiciones operativas válidas hacia adelante.
   */
  private static readonly FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED'],
    CONFIRMED: ['PREPARING'],
    PREPARING: ['READY'],
    READY: ['SHIPPED', 'DELIVERED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  /**
   * Estados desde los cuales la cancelación es legal y segura para inventario/operación.
   */
  private static readonly CANCELLABLE_STATUSES: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
  ];

  /**
   * Determina si un estado es terminal (no permite más cambios).
   */
  static isTerminal(status: OrderStatus): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED';
  }

  /**
   * Evalúa si una transición es válida bajo la lógica de negocio y tipo de despacho.
   */
  static canTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    deliveryType: DeliveryType = 'DELIVERY'
  ): OrderTransitionResult {
    // 1. Identidad: no hay transición efectiva
    if (currentStatus === nextStatus) {
      return { valid: true };
    }

    // 2. Estados terminales no pueden reactivarse ni cambiar
    if (this.isTerminal(currentStatus)) {
      return {
        valid: false,
        reason: `El pedido está en estado terminal '${currentStatus}' y no admite modificaciones operacionales.`,
      };
    }

    // 3. Reglas de cancelación explícitas
    if (nextStatus === 'CANCELLED') {
      if (this.CANCELLABLE_STATUSES.includes(currentStatus)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `No se puede cancelar un pedido en estado '${currentStatus}'. Solo es permitido desde PENDING, CONFIRMED o PREPARING.`,
      };
    }

    // 4. Regla específica para tipo de despacho PICKUP (Recojo en local)
    // Para recojo en local, un pedido listo pasa directamente a DELIVERED (no pasa por SHIPPED / En Camino)
    if (deliveryType === 'PICKUP' && currentStatus === 'READY' && nextStatus === 'SHIPPED') {
      return {
        valid: false,
        reason: `Los pedidos para recojo en tienda (PICKUP) no pueden marcarse como 'En Camino' (SHIPPED). Deben entregarse directamente (DELIVERED).`,
      };
    }

    // 5. Validar si la transición hacia adelante está en el mapa permitido
    const allowedForwards = this.FORWARD_TRANSITIONS[currentStatus] || [];
    if (allowedForwards.includes(nextStatus)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Transición de estado inválida: no se permite cambiar de '${currentStatus}' a '${nextStatus}'.`,
    };
  }

  /**
   * Aserta que la transición sea válida; si no lo es, lanza una ValidationException tipada.
   */
  static assertCanTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    deliveryType: DeliveryType = 'DELIVERY'
  ): void {
    const result = this.canTransition(currentStatus, nextStatus, deliveryType);
    if (!result.valid) {
      throw new ValidationException(result.reason || `Transición inválida de ${currentStatus} a ${nextStatus}`);
    }
  }

  /**
   * Obtiene la lista de próximos estados permitidos desde el estado actual.
   */
  static getAllowedNextStatuses(
    currentStatus: OrderStatus,
    deliveryType: DeliveryType = 'DELIVERY'
  ): OrderStatus[] {
    if (this.isTerminal(currentStatus)) {
      return [];
    }

    const nextStatuses: OrderStatus[] = [];

    // 1. Agregar siguientes estados hacia adelante
    const forwards = this.FORWARD_TRANSITIONS[currentStatus] || [];
    for (const st of forwards) {
      if (deliveryType === 'PICKUP' && currentStatus === 'READY' && st === 'SHIPPED') {
        continue;
      }
      nextStatuses.push(st);
    }

    // 2. Agregar cancelación si es permitida
    if (this.CANCELLABLE_STATUSES.includes(currentStatus)) {
      nextStatuses.push('CANCELLED');
    }

    return nextStatuses;
  }
}
