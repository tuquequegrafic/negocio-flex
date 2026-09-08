/**
 * Negocio Flex - Subscription State Machine (Fase 10)
 * Control estricto y determinista de transiciones de estado de suscripciones SaaS.
 */

import {
  SubscriptionStatus,
  normalizeSubscriptionStatus,
} from '../../domain/entities/subscription_entity';

export interface StateTransitionResult {
  readonly valid: boolean;
  readonly previousStatus: SubscriptionStatus;
  readonly nextStatus: SubscriptionStatus;
  readonly isIdempotent: boolean;
  readonly error?: string;
}

export class SubscriptionStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
    trial: ['active', 'past_due', 'expired', 'cancelled'],
    active: ['past_due', 'cancelled', 'expired'],
    past_due: ['active', 'cancelled', 'expired'],
    cancelled: ['expired'],
    expired: [],
  };

  /**
   * Valida si la transición de un estado a otro es válida (booleano)
   */
  static canTransition(
    current: SubscriptionStatus | string,
    target: SubscriptionStatus | string
  ): boolean {
    return this.evaluateTransition(current, target).valid;
  }

  /**
   * Evalúa detalladamente la transición de estado con metadatos
   */
  static evaluateTransition(
    current: SubscriptionStatus | string,
    target: SubscriptionStatus | string
  ): StateTransitionResult {
    const from = normalizeSubscriptionStatus(current);
    const to = normalizeSubscriptionStatus(target);

    // Transición idempotente (mismo estado)
    if (from === to) {
      return {
        valid: true,
        previousStatus: from,
        nextStatus: to,
        isIdempotent: true,
      };
    }

    const allowedTargets = this.ALLOWED_TRANSITIONS[from] || [];
    const isValid = allowedTargets.includes(to);

    if (!isValid) {
      return {
        valid: false,
        previousStatus: from,
        nextStatus: to,
        isIdempotent: false,
        error: `Transición de estado de suscripción no permitida de "${from}" a "${to}".`,
      };
    }

    return {
      valid: true,
      previousStatus: from,
      nextStatus: to,
      isIdempotent: false,
    };
  }

  /**
   * Aplica la transición o lanza un error descriptivo si no está permitida
   */
  static transition(
    current: SubscriptionStatus | string,
    target: SubscriptionStatus | string
  ): SubscriptionStatus {
    const check = this.evaluateTransition(current, target);
    if (!check.valid) {
      throw new Error(check.error);
    }
    return check.nextStatus;
  }
}
