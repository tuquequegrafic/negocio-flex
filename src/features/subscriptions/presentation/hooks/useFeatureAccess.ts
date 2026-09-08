/**
 * Negocio Flex - useFeatureAccess Hook (Fase 10: Presentación)
 * Control de acceso declarativo a funcionalidades según el plan de la organización.
 */

import { useMemo, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { FeatureAccessService, SaaSFeatureKey, FeatureAccessCheckResult } from '../../application/services/feature_access_service';

export function useFeatureAccess(organizationId?: string) {
  const { subscription, currentPlan, loading } = useSubscription(organizationId);

  /**
   * Determina de inmediato si una funcionalidad está permitida
   */
  const canUse = useCallback(
    (featureKey: SaaSFeatureKey): boolean => {
      return FeatureAccessService.canUseFeature(subscription, currentPlan, featureKey);
    },
    [subscription, currentPlan]
  );

  /**
   * Evalúa a fondo el acceso con detalles descriptivos para tooltips o modales de upgrade
   */
  const checkAccess = useCallback(
    (featureKey: SaaSFeatureKey): FeatureAccessCheckResult => {
      return FeatureAccessService.evaluateFeatureAccess(subscription, currentPlan, featureKey);
    },
    [subscription, currentPlan]
  );

  return {
    canUse,
    checkAccess,
    currentPlan,
    subscription,
    loading,
  };
}
