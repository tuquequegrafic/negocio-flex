/**
 * Negocio Flex - Plan Model (Fase 10: Capa Data)
 * Mapper para PlanEntity desde la base de datos Supabase.
 */

import { PlanEntity, BillingInterval, PlanLimits } from '../../domain/entities/plan_entity';

export class PlanModel {
  static fromDatabaseRow(row: Record<string, unknown>): PlanEntity {
    const defaultLimits: PlanLimits = {
      max_products: Number(row.max_products || 30),
      max_images: Number(row.max_images || 10),
      max_staff: Number(row.max_staff || 1),
      max_customers: Number(row.max_customers || 100),
      max_orders_per_month: Number(row.max_orders_per_month || 500),
      max_appointments_per_month: Number(row.max_appointments_per_month || 200),
      custom_domain_allowed: Boolean(row.custom_domain_allowed),
      analytics_allowed: Boolean(row.analytics_allowed),
    };

    let limits = defaultLimits;
    if (row.limits && typeof row.limits === 'object') {
      limits = { ...defaultLimits, ...(row.limits as Partial<PlanLimits>) };
    }

    let activeModules: string[] = ['products', 'orders', 'whatsapp'];
    if (Array.isArray(row.allowed_modules)) {
      activeModules = row.allowed_modules as string[];
    } else if (Array.isArray(row.active_modules)) {
      activeModules = row.active_modules as string[];
    }

    let features: string[] = [];
    if (Array.isArray(row.features)) {
      features = row.features as string[];
    }

    return {
      id: String(row.id || ''),
      name: String(row.name || ''),
      slug: String(row.slug || ''),
      description: String(row.description || ''),
      price_monthly: Number(row.price_monthly || 0),
      price_annual: Number(row.price_annual || 0),
      billing_interval: (String(row.billing_interval || 'MONTHLY').toUpperCase() === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY') as BillingInterval,
      trial_days: Number(row.trial_days || 14),
      limits,
      active_modules: activeModules,
      features,
      is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
      badge: row.badge ? String(row.badge) : undefined,
      support_level: String(row.support_level || 'Estándar'),
      created_at: row.created_at ? String(row.created_at) : undefined,
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
    };
  }
}
