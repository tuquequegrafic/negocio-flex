/**
 * Negocio Flex - usePlanLimits Hook (Fase 10: Presentación)
 * Provee evaluación de cuotas y límites autorizados por plan para la UI.
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { PlanLimitService } from '../../application/services/plan_limit_service';
import { LimitResourceType, PlanLimitCheckResult, SubscriptionUsageMetrics } from '../../domain/entities/subscription_limits_entity';

export function usePlanLimits(organizationId?: string) {
  const { subscription, currentPlan, loading, error } = useSubscription(organizationId);

  /**
   * Evalúa si un recurso específico puede ser incrementado
   */
  const checkLimit = useMemo(() => {
    return (resource: LimitResourceType, currentCount: number): PlanLimitCheckResult => {
      return PlanLimitService.checkLimit(resource, currentCount, currentPlan, subscription);
    };
  }, [currentPlan, subscription]);

  /**
   * Verifica de forma booleana si se alcanzó el límite
   */
  const isLimitReached = useMemo(() => {
    return (resource: LimitResourceType, currentCount: number): boolean => {
      const result = PlanLimitService.checkLimit(resource, currentCount, currentPlan, subscription);
      return !result.allowed;
    };
  }, [currentPlan, subscription]);

  /**
   * Calcula el resumen de uso para un conjunto de métricas
   */
  const getUsageSummary = useMemo(() => {
    return (metrics: SubscriptionUsageMetrics) => {
      return PlanLimitService.getUsageSummary(metrics, currentPlan);
    };
  }, [currentPlan]);

  return {
    subscription,
    currentPlan,
    checkLimit,
    isLimitReached,
    getUsageSummary,
    loading,
    error,
  };
}
