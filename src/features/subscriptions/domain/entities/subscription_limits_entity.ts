/**
 * Negocio Flex - Subscription Limits & Usage Entity (Fase 10: Dominio Puro)
 * Define métricas de consumo de recursos y el resultado determinista de validación de cuotas.
 */

export type LimitResourceType = 'products' | 'services' | 'images' | 'staff' | 'customers' | 'orders' | 'appointments';

export interface SubscriptionUsageMetrics {
  readonly organization_id: string;
  readonly products_count: number;
  readonly services_count: number;
  readonly images_count: number;
  readonly staff_count: number;
  readonly customers_count: number;
  readonly orders_count: number;
  readonly appointments_count: number;
}

export interface PlanLimitCheckResult {
  readonly allowed: boolean;
  readonly resource: LimitResourceType;
  readonly currentCount: number;
  readonly maxAllowed: number;
  readonly planName: string;
  readonly percentUsed: number;
  readonly message: string;
  readonly upgradeRequired: boolean;
}
