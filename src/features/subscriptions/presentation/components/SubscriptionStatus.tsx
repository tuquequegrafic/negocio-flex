/**
 * Negocio Flex - SubscriptionStatus Component (Fase 10: Presentación)
 * Muestra el estado operativo de la suscripción con insignias y alertas reactivas.
 */

import React from 'react';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { SubscriptionStatusService } from '../../application/services/subscription_status_service';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, ShieldX } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription?: SubscriptionEntity | null;
  onUpgradeClick?: () => void;
  showDetails?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  onUpgradeClick,
  showDetails = true,
}) => {
  const assessment = SubscriptionStatusService.evaluateAccess(subscription);
  const badgeClasses = SubscriptionStatusService.getStatusBadgeClasses(assessment.status);
  const label = SubscriptionStatusService.getStatusLabel(assessment.status);

  return (
    <div className="space-y-3" id="subscription-status-container">
      {/* Badge Principal */}
      <div className="flex items-center gap-2">
        <span
          id="subscription-status-badge"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
        >
          {assessment.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {assessment.isTrial && <Clock className="w-3.5 h-3.5 text-indigo-600" />}
          {assessment.isPastDue && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          {assessment.isCanceled && <AlertCircle className="w-3.5 h-3.5 text-slate-500" />}
          {assessment.isExpired && <ShieldX className="w-3.5 h-3.5 text-rose-600" />}
          <span>{label}</span>
        </span>

        {assessment.daysRemaining !== undefined && assessment.daysRemaining > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            ({assessment.daysRemaining} {assessment.daysRemaining === 1 ? 'día restante' : 'días restantes'})
          </span>
        )}
      </div>

      {/* Alerta si requiere atención */}
      {showDetails && (assessment.isPastDue || assessment.isCanceled || assessment.isExpired) && (
        <div
          id="subscription-status-alert"
          className={`p-3.5 rounded-xl border text-sm flex items-start justify-between gap-3 ${
            assessment.isExpired
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : assessment.isPastDue
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{assessment.reason}</p>
            </div>
          </div>
          {onUpgradeClick && (
            <button
              id="subscription-alert-action-btn"
              onClick={onUpgradeClick}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition whitespace-nowrap shadow-sm"
            >
              Reactivar Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
};
