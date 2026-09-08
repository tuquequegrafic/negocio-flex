/**
 * Negocio Flex - Subscription Model (Fase 10: Capa Data)
 * Mapper y DTO de persistencia para Suscripciones entre Supabase y Dominio.
 */

import { SubscriptionEntity, SubscriptionStatus, normalizeSubscriptionStatus } from '../../domain/entities/subscription_entity';
import { BillingInterval } from '../../domain/entities/plan_entity';

export class SubscriptionModel {
  static fromDatabaseRow(row: Record<string, unknown>): SubscriptionEntity {
    return {
      id: String(row.id || ''),
      organization_id: String(row.organization_id || ''),
      plan_id: String(row.plan_id || 'plan_inicial'),
      plan_name: String(row.plan_name || 'Plan Inicial'),
      status: normalizeSubscriptionStatus(String(row.status || 'trial')),
      billing_interval: (String(row.billing_interval || 'MONTHLY').toUpperCase() === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY') as BillingInterval,
      current_period_start: String(row.current_period_start || new Date().toISOString()),
      current_period_end: String(row.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString()),
      trial_start: row.trial_start ? String(row.trial_start) : undefined,
      trial_end: row.trial_end ? String(row.trial_end) : undefined,
      cancel_at_period_end: Boolean(row.cancel_at_period_end),
      canceled_at: row.canceled_at ? String(row.canceled_at) : undefined,
      auto_renew: row.auto_renew !== undefined ? Boolean(row.auto_renew) : true,
      amount_paid: Number(row.amount_paid || 0),
      currency: String(row.currency || 'PEN'),
      provider: String(row.provider || 'Culqi'),
      provider_customer_id: row.provider_customer_id ? String(row.provider_customer_id) : undefined,
      provider_subscription_id: row.provider_subscription_id ? String(row.provider_subscription_id) : undefined,
      limits: (row.limits as Record<string, unknown>) || {},
      active_modules: (row.active_modules as Record<string, boolean>) || {},
      custom_domain: row.custom_domain ? String(row.custom_domain) : undefined,
      last_reconciled_at: row.last_reconciled_at ? String(row.last_reconciled_at) : undefined,
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: String(row.updated_at || new Date().toISOString()),
    };
  }

  static toDatabaseInsert(entity: Partial<SubscriptionEntity>): Record<string, unknown> {
    return {
      organization_id: entity.organization_id,
      plan_id: entity.plan_id,
      status: entity.status,
      billing_interval: entity.billing_interval,
      current_period_start: entity.current_period_start,
      current_period_end: entity.current_period_end,
      trial_start: entity.trial_start,
      trial_end: entity.trial_end,
      cancel_at_period_end: entity.cancel_at_period_end ?? false,
      canceled_at: entity.canceled_at,
      auto_renew: entity.auto_renew ?? true,
      amount_paid: entity.amount_paid ?? 0,
      currency: entity.currency ?? 'PEN',
      provider: entity.provider ?? 'Culqi',
      provider_customer_id: entity.provider_customer_id,
      provider_subscription_id: entity.provider_subscription_id,
      limits: entity.limits ?? {},
      active_modules: entity.active_modules ?? {},
      custom_domain: entity.custom_domain,
    };
  }
}
