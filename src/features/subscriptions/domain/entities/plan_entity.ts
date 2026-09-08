/**
 * Negocio Flex - Plan Entity (Fase 10: Dominio Puro)
 * Define las características canónicas de los planes SaaS y límites autorizados.
 */

export type BillingInterval = 'MONTHLY' | 'ANNUAL';

export interface PlanLimits {
  readonly max_products: number;
  readonly max_images: number;
  readonly max_staff: number;
  readonly max_customers: number;
  readonly max_orders_per_month: number;
  readonly max_appointments_per_month: number;
  readonly custom_domain_allowed: boolean;
  readonly analytics_allowed: boolean;
}

export interface PlanEntity {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly price_monthly: number;
  readonly price_annual: number;
  readonly billing_interval: BillingInterval;
  readonly trial_days: number;
  readonly limits: PlanLimits;
  readonly active_modules: readonly string[];
  readonly features: readonly string[];
  readonly is_active: boolean;
  readonly badge?: string;
  readonly support_level: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}
