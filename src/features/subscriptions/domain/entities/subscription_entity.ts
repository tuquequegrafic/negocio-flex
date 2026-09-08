/**
 * Negocio Flex - Subscription Entity (Fase 10: Dominio Puro)
 * Entidad pura que modela la suscripción de una organización con soporte de estados estrictos.
 */

import { BillingInterval, PlanLimits } from './plan_entity';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface SubscriptionEntity {
  readonly id: string;
  readonly organization_id: string;
  readonly plan_id: string;
  readonly plan_name: string;
  readonly status: SubscriptionStatus;
  readonly billing_interval: BillingInterval;
  readonly current_period_start: string;
  readonly current_period_end: string;
  readonly trial_start?: string;
  readonly trial_end?: string;
  readonly cancel_at_period_end?: boolean;
  readonly canceled_at?: string;
  readonly auto_renew: boolean;
  readonly amount_paid: number;
  readonly currency: string;
  readonly provider: string;
  readonly provider_customer_id?: string;
  readonly provider_subscription_id?: string;
  readonly limits?: Partial<PlanLimits>;
  readonly active_modules?: Record<string, boolean>;
  readonly custom_domain?: string;
  readonly last_reconciled_at?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Normaliza el estado de suscripción a formato canónico PostgreSQL:
 * 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
 */
export function normalizeSubscriptionStatus(status: SubscriptionStatus | string): SubscriptionStatus {
  const s = (status || '').toLowerCase().trim();
  if (s === 'trialing' || s === 'trial') return 'trial';
  if (s === 'canceled' || s === 'cancelled') return 'cancelled';
  if (s === 'active') return 'active';
  if (s === 'past_due') return 'past_due';
  if (s === 'expired') return 'expired';
  return 'trial';
}

/**
 * Determina si la suscripción está vigente y con acceso operativo
 */
export function isSubscriptionInGoodStanding(status: SubscriptionStatus | string): boolean {
  const norm = normalizeSubscriptionStatus(status);
  return norm === 'active' || norm === 'trial' || norm === 'past_due';
}
