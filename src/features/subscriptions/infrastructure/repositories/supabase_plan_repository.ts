/**
 * Negocio Flex - Supabase Plan Repository (Fase 10)
 */

import { supabase } from '../../../../core/network/supabase_client';
import { PlanEntity } from '../../domain/entities/plan_entity';
import { PlanRepository } from '../../domain/repositories/plan_repository';
import { INITIAL_PLANS } from '../../../../core/data/initialData';

export class SupabasePlanRepository implements PlanRepository {
  async getActivePlans(): Promise<PlanEntity[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.mapInitialPlans();
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch {
      return this.mapInitialPlans();
    }
  }

  async getPlanById(planId: string): Promise<PlanEntity | null> {
    const plans = await this.getActivePlans();
    return plans.find(p => p.id === planId) || null;
  }

  async getPlanBySlug(slug: string): Promise<PlanEntity | null> {
    const plans = await this.getActivePlans();
    return plans.find(p => p.slug === slug) || null;
  }

  private mapRowToEntity(row: Record<string, any>): PlanEntity {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || row.id.replace('plan-', ''),
      description: row.description || '',
      price_monthly: Number(row.price_monthly) || 0,
      price_annual: Number(row.price_annual) || (Number(row.price_monthly) * 10),
      billing_interval: row.billing_interval || 'MONTHLY',
      trial_days: row.trial_days ?? 14,
      limits: {
        max_products: row.max_products ?? 30,
        max_images: row.max_images ?? 10,
        max_staff: row.max_staff ?? 1,
        max_customers: row.max_customers ?? 100,
        max_orders_per_month: row.max_orders_per_month ?? 500,
        max_appointments_per_month: row.max_appointments_per_month ?? 200,
        custom_domain_allowed: Boolean(row.custom_domain_allowed),
        analytics_allowed: Boolean(row.analytics_allowed),
      },
      active_modules: Array.isArray(row.allowed_modules) ? row.allowed_modules : ['products', 'orders', 'whatsapp'],
      features: Array.isArray(row.features) ? row.features : [],
      is_active: row.is_active !== false,
      badge: row.badge,
      support_level: row.support_level || 'Estándar',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapInitialPlans(): PlanEntity[] {
    return INITIAL_PLANS.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price_monthly: p.price_monthly,
      price_annual: p.price_annual || p.price_monthly * 10,
      billing_interval: 'MONTHLY',
      trial_days: 14,
      limits: {
        max_products: p.max_products,
        max_images: p.max_images,
        max_staff: p.max_staff,
        max_customers: 100,
        max_orders_per_month: 500,
        max_appointments_per_month: 200,
        custom_domain_allowed: p.custom_domain_allowed,
        analytics_allowed: p.analytics_allowed,
      },
      active_modules: p.allowed_modules as string[],
      features: p.features,
      is_active: p.is_active,
      badge: p.badge,
      support_level: p.support_level,
    }));
  }
}
