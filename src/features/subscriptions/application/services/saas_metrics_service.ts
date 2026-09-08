/**
 * Negocio Flex - SaaS Metrics Service (Fase 10: Capa de Aplicación)
 * Cálculo matemático fidedigno de métricas SaaS y monetización multi-tenant.
 * 
 * FÓRMULAS UTILIZADAS:
 * 1. MRR (Monthly Recurring Revenue):
 *    Suma del valor normalizado mensual de todas las suscripciones en estado 'active'.
 *    - Suscripción Mensual: MRR += price_monthly (o amount_paid si mensual)
 *    - Suscripción Anual: MRR += (price_annual / 12) (o amount_paid / 12)
 * 2. ARR (Annual Recurring Revenue):
 *    ARR = MRR * 12
 * 3. Revenue by Plan:
 *    Suma del MRR agrupado por plan_id.
 * 4. Subscriptions by Plan:
 *    Recuento de suscripciones activas agrupado por plan_id.
 * 5. Churn Count:
 *    Recuento de suscripciones con estado 'cancelled' o 'expired'.
 */

import { SubscriptionEntity, normalizeSubscriptionStatus } from '../../domain/entities/subscription_entity';
import { PlanEntity } from '../../domain/entities/plan_entity';
import { SaaSMetricsDTO } from '../dto/subscription_dto';

export class SaaSMetricsService {
  /**
   * Calcula las métricas financieras y operativas SaaS consolidadas
   */
  static calculateMetrics(
    subscriptions: readonly SubscriptionEntity[],
    plans: readonly PlanEntity[]
  ): SaaSMetricsDTO {
    const plansById = new Map<string, PlanEntity>();
    plans.forEach(p => plansById.set(p.id, p));

    let activeCount = 0;
    let trialCount = 0;
    let pastDueCount = 0;
    let canceledCount = 0;
    let expiredCount = 0;

    let totalMRR = 0;
    const revenueByPlan: Record<string, number> = {};
    const subscriptionsByPlan: Record<string, number> = {};

    subscriptions.forEach(sub => {
      const status = normalizeSubscriptionStatus(sub.status);
      const plan = plansById.get(sub.plan_id);
      const planName = plan?.name || sub.plan_name || sub.plan_id;

      if (!subscriptionsByPlan[planName]) {
        subscriptionsByPlan[planName] = 0;
      }
      if (!revenueByPlan[planName]) {
        revenueByPlan[planName] = 0;
      }

      switch (status) {
        case 'active': {
          activeCount++;
          subscriptionsByPlan[planName]++;

          // Cálculo normalizado de MRR
          let monthlyValue = 0;
          if (sub.billing_interval === 'ANNUAL') {
            const annualPrice = sub.amount_paid > 0 ? sub.amount_paid : (plan?.price_annual || 0);
            monthlyValue = annualPrice / 12;
          } else {
            monthlyValue = sub.amount_paid > 0 ? sub.amount_paid : (plan?.price_monthly || 0);
          }

          totalMRR += monthlyValue;
          revenueByPlan[planName] = (revenueByPlan[planName] || 0) + monthlyValue;
          break;
        }
        case 'trial':
          trialCount++;
          break;
        case 'past_due':
          pastDueCount++;
          break;
        case 'cancelled':
          canceledCount++;
          break;
        case 'expired':
          expiredCount++;
          break;
      }
    });

    const roundedMRR = Math.round(totalMRR * 100) / 100;
    const roundedARR = Math.round(roundedMRR * 12 * 100) / 100;

    // Redondear ingresos por plan
    const roundedRevenueByPlan: Record<string, number> = {};
    Object.entries(revenueByPlan).forEach(([key, val]) => {
      roundedRevenueByPlan[key] = Math.round(val * 100) / 100;
    });

    return {
      mrr: roundedMRR,
      arr: roundedARR,
      activeSubscriptionsCount: activeCount,
      trialSubscriptionsCount: trialCount,
      pastDueSubscriptionsCount: pastDueCount,
      canceledSubscriptionsCount: canceledCount,
      expiredSubscriptionsCount: expiredCount,
      totalSubscriptionsCount: subscriptions.length,
      revenueByPlan: roundedRevenueByPlan,
      subscriptionsByPlan,
      calculatedAt: new Date().toISOString(),
    };
  }
}
