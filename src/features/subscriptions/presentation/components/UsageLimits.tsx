/**
 * Negocio Flex - UsageLimits Component (Fase 10: Presentación)
 * Muestra el consumo actual de cuotas frente a los límites del plan.
 */

import React from 'react';
import { PlanEntity } from '../../domain/entities/plan_entity';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { PlanLimitService } from '../../application/services/plan_limit_service';
import { LimitResourceType } from '../../domain/entities/subscription_limits_entity';
import { Package, Image as ImageIcon, Users, ShoppingBag, Calendar, AlertCircle } from 'lucide-react';

interface UsageMetricsProps {
  productsCount: number;
  imagesCount: number;
  staffCount: number;
  customersCount: number;
  appointmentsCount: number;
  plan?: PlanEntity | null;
  subscription?: SubscriptionEntity | null;
  onUpgradeClick?: () => void;
}

export const UsageLimits: React.FC<UsageMetricsProps> = ({
  productsCount,
  imagesCount,
  staffCount,
  customersCount,
  appointmentsCount,
  plan,
  subscription,
  onUpgradeClick,
}) => {
  const resources: Array<{
    type: LimitResourceType;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { type: 'products', label: 'Productos', count: productsCount, icon: Package },
    { type: 'images', label: 'Fotos Galería', count: imagesCount, icon: ImageIcon },
    { type: 'staff', label: 'Usuarios / Colaboradores', count: staffCount, icon: Users },
    { type: 'customers', label: 'Clientes CRM', count: customersCount, icon: Users },
    { type: 'appointments', label: 'Citas Mensuales', count: appointmentsCount, icon: Calendar },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="usage-limits-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            Consumo y Límites de Recursos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan actual: <span className="font-semibold text-slate-800">{plan?.name || 'Inicial'}</span>
          </p>
        </div>
        {onUpgradeClick && (
          <button
            id="upgrade-from-limits-btn"
            onClick={onUpgradeClick}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
          >
            Ampliar Capacidad
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(res => {
          const check = PlanLimitService.checkLimit(res.type, res.count, plan, subscription);
          const Icon = res.icon;
          const isFull = !check.allowed;
          const isWarning = check.percentUsed >= 80 && !isFull;
          const isUnlimited = check.maxAllowed >= 9999;

          return (
            <div
              key={res.type}
              id={`usage-limit-item-${res.type}`}
              className={`p-4 rounded-xl border transition-all ${
                isFull
                  ? 'bg-rose-50/50 border-rose-200'
                  : isWarning
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{res.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={isFull ? 'text-rose-600' : isWarning ? 'text-amber-700' : 'text-slate-800'}>
                    {res.count}
                  </span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-500">
                    {isUnlimited ? '∞ Ilimitado' : check.maxAllowed}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${isUnlimited ? (res.count > 0 ? 10 : 0) : check.percentUsed}%` }}
                />
              </div>

              {isFull && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Capacidad máxima alcanzada en este plan.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
