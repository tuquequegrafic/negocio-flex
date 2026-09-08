/**
 * Negocio Flex - useSubscription Hook (Fase 10: Presentación)
 * Proporciona acceso reactivo a planes, suscripción actual, verificación de límites,
 * upgrades, cancelaciones e historial de transacciones.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlanEntity } from '../../domain/entities/plan_entity';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { PaymentTransactionEntity } from '../../domain/entities/payment_transaction_entity';
import { LimitResourceType, PlanLimitCheckResult } from '../../domain/entities/subscription_limits_entity';
import { SupabasePlanRepository } from '../../infrastructure/repositories/supabase_plan_repository';
import { SupabaseSubscriptionRepository } from '../../infrastructure/repositories/supabase_subscription_repository';
import { SupabasePaymentRepository } from '../../infrastructure/repositories/supabase_payment_repository';
import { GetPlansUseCase } from '../../application/usecases/get_plans_usecase';
import { GetCurrentSubscriptionUseCase } from '../../application/usecases/get_current_subscription_usecase';
import { ChangePlanUseCase } from '../../application/usecases/change_plan_usecase';
import { CancelSubscriptionUseCase, ReactivateSubscriptionUseCase } from '../../application/usecases/cancel_subscription_usecase';
import { CheckPlanLimitUseCase } from '../../application/usecases/check_plan_limit_usecase';
import { GetBillingHistoryUseCase } from '../../application/usecases/process_webhook_usecase';
import { PlanLimitService } from '../../application/services/plan_limit_service';

export function useSubscription(organizationId?: string) {
  const [plans, setPlans] = useState<PlanEntity[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionEntity | null>(null);
  const [billingHistory, setBillingHistory] = useState<PaymentTransactionEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instancias singleton de repositorios y casos de uso
  const planRepo = useMemo(() => new SupabasePlanRepository(), []);
  const subRepo = useMemo(() => new SupabaseSubscriptionRepository(), []);
  const payRepo = useMemo(() => new SupabasePaymentRepository(), []);

  const getPlansUC = useMemo(() => new GetPlansUseCase(planRepo), [planRepo]);
  const getSubUC = useMemo(() => new GetCurrentSubscriptionUseCase(subRepo), [subRepo]);
  const changePlanUC = useMemo(() => new ChangePlanUseCase(subRepo, planRepo), [subRepo, planRepo]);
  const cancelSubUC = useMemo(() => new CancelSubscriptionUseCase(subRepo), [subRepo]);
  const reactivateSubUC = useMemo(() => new ReactivateSubscriptionUseCase(subRepo), [subRepo]);
  const checkLimitUC = useMemo(() => new CheckPlanLimitUseCase(planRepo, subRepo), [planRepo, subRepo]);
  const getHistoryUC = useMemo(() => new GetBillingHistoryUseCase(payRepo), [payRepo]);

  // Carga reactiva con aislamiento estricto y prevención de race condition entre organizaciones
  useEffect(() => {
    let isCurrent = true;

    if (!organizationId) {
      setSubscription(null);
      setBillingHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    // Reseteo inmediato al conmutar organización para garantizar que nunca se muestre estado de otro tenant
    setSubscription(null);
    setBillingHistory([]);

    Promise.all([
      getPlansUC.execute(),
      getSubUC.execute(organizationId),
      getHistoryUC.execute(organizationId),
    ])
      .then(([fetchedPlans, fetchedSub, fetchedHistory]) => {
        if (!isCurrent) return;
        setPlans(fetchedPlans);
        setSubscription(fetchedSub);
        setBillingHistory(fetchedHistory);
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar datos de suscripción';
        setError(msg);
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [organizationId, getPlansUC, getSubUC, getHistoryUC]);

  // Recarga manual segura
  const reload = useCallback(async () => {
    if (!organizationId) {
      setSubscription(null);
      setBillingHistory([]);
      setLoading(false);
      return;
    }
    const targetOrgId = organizationId;
    setLoading(true);
    setError(null);
    try {
      const [fetchedPlans, fetchedSub, fetchedHistory] = await Promise.all([
        getPlansUC.execute(),
        getSubUC.execute(targetOrgId),
        getHistoryUC.execute(targetOrgId),
      ]);
      if (targetOrgId === organizationId) {
        setPlans(fetchedPlans);
        setSubscription(fetchedSub);
        setBillingHistory(fetchedHistory);
      }
    } catch (err: unknown) {
      if (targetOrgId === organizationId) {
        const msg = err instanceof Error ? err.message : 'Error al cargar datos de suscripción';
        setError(msg);
      }
    } finally {
      if (targetOrgId === organizationId) {
        setLoading(false);
      }
    }
  }, [organizationId, getPlansUC, getSubUC, getHistoryUC]);

  // Plan actual asignado
  const currentPlan = useMemo(() => {
    if (!subscription) return plans.find(p => p.id === 'plan-inicial') || plans[0] || null;
    return plans.find(p => p.id === subscription.plan_id) || null;
  }, [plans, subscription]);

  // Ejecutar Upgrade / Cambio de Plan
  const changePlan = useCallback(
    async (newPlanId: string, billingInterval: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') => {
      if (!organizationId) throw new Error('Organización no identificada');
      setActionLoading(true);
      setError(null);
      try {
        const result = await changePlanUC.execute({
          organizationId,
          newPlanId,
          billingInterval,
        });
        setSubscription(result.subscription);
        // Refrescar historial
        const history = await getHistoryUC.execute(organizationId);
        setBillingHistory(history);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al procesar cambio de plan';
        setError(msg);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [organizationId, changePlanUC, getHistoryUC]
  );

  // Cancelar Suscripción
  const cancelSubscription = useCallback(async () => {
    if (!organizationId) throw new Error('Organización no identificada');
    setActionLoading(true);
    setError(null);
    try {
      const updated = await cancelSubUC.execute(organizationId);
      setSubscription(updated);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar suscripción';
      setError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [organizationId, cancelSubUC]);

  // Reactivar Suscripción
  const reactivateSubscription = useCallback(async () => {
    if (!organizationId) throw new Error('Organización no identificada');
    setActionLoading(true);
    setError(null);
    try {
      const updated = await reactivateSubUC.execute(organizationId);
      setSubscription(updated);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reactivar suscripción';
      setError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [organizationId, reactivateSubUC]);

  // Comprobar límite de recurso
  const checkLimit = useCallback(
    async (resource: LimitResourceType, currentCount: number): Promise<PlanLimitCheckResult> => {
      if (!organizationId) {
        return PlanLimitService.checkLimit(resource, currentCount, currentPlan, subscription);
      }
      return checkLimitUC.execute(organizationId, resource, currentCount);
    },
    [organizationId, currentPlan, subscription, checkLimitUC]
  );

  // Comprobar si un módulo está activo
  const isModuleActive = useCallback(
    (moduleKey: string): boolean => {
      return PlanLimitService.isModuleActive(moduleKey, currentPlan, subscription);
    },
    [currentPlan, subscription]
  );

  return {
    plans,
    subscription,
    currentPlan,
    billingHistory,
    loading,
    actionLoading,
    error,
    reload,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    checkLimit,
    isModuleActive,
  };
}
