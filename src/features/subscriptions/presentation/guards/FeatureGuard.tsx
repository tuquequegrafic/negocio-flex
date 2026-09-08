/**
 * Negocio Flex - FeatureGuard Component (Fase 10: Presentación / Guards)
 * Protege secciones y botones de UI según permisos y funcionalidades del plan activo.
 */

import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { SaaSFeatureKey } from '../../application/services/feature_access_service';
import { Lock, Sparkles } from 'lucide-react';

interface FeatureGuardProps {
  featureKey: SaaSFeatureKey;
  organizationId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
  featureTitle?: string;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  featureKey,
  organizationId,
  children,
  fallback,
  onUpgradeClick,
  featureTitle,
}) => {
  const { checkAccess, loading } = useFeatureAccess(organizationId);

  if (loading) {
    return <div className="animate-pulse bg-slate-100 rounded-xl h-24 w-full" />;
  }

  const access = checkAccess(featureKey);

  if (access.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      id={`feature-locked-${featureKey}`}
      className="p-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white text-center space-y-3"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900">
          {featureTitle || `Funcionalidad Bloqueada`}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          {access.reason || `Disponible a partir del ${access.minimumPlanSuggested || 'Plan Profesional'}.`}
        </p>
      </div>
      {onUpgradeClick && (
        <button
          id={`upgrade-to-unlock-${featureKey}-btn`}
          onClick={onUpgradeClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Actualizar Plan</span>
        </button>
      )}
    </div>
  );
};
