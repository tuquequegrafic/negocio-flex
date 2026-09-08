/**
 * Negocio Flex - PlansScreen Component (Fase 10: Presentación / Screens)
 * Pantalla completa de catálogo y comparativa de planes SaaS.
 */

import React, { useState } from 'react';
import { PlanEntity, BillingInterval } from '../../domain/entities/plan_entity';
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface PlansScreenProps {
  plans: readonly PlanEntity[];
  currentPlanId?: string;
  onSelectPlan: (planId: string, interval: BillingInterval) => Promise<void>;
  loading?: boolean;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({
  plans,
  currentPlanId,
  onSelectPlan,
  loading = false,
}) => {
  const [interval, setInterval] = useState<BillingInterval>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelect = async (planId: string) => {
    setSelectedPlanId(planId);
    try {
      await onSelectPlan(planId, interval);
    } finally {
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="plans-screen-container">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-full border border-indigo-200 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Monetización SaaS Multi-Tenant
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Elige el plan ideal para tu negocio
        </h1>
        <p className="text-sm text-slate-500">
          Comienza con 14 días de prueba gratis. Cambia o cancela tu suscripción en cualquier momento sin penalizaciones.
        </p>

        {/* Selector de Intervalo */}
        <div className="pt-4 flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold shadow-inner">
            <button
              id="plans-interval-monthly"
              onClick={() => setInterval('MONTHLY')}
              className={`px-5 py-2.5 rounded-xl transition ${
                interval === 'MONTHLY'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              id="plans-interval-annual"
              onClick={() => setInterval('ANNUAL')}
              className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
                interval === 'ANNUAL'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Facturación Anual</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg">
                AHORRA 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map(p => {
          const isCurrent = p.id === currentPlanId;
          const isProcessing = loading && selectedPlanId === p.id;
          const price = interval === 'ANNUAL' ? p.price_annual : p.price_monthly;
          const periodLabel = interval === 'ANNUAL' ? '/año' : '/mes';

          return (
            <div
              key={p.id}
              id={`plan-card-display-${p.slug}`}
              className={`rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-200 ${
                isCurrent
                  ? 'border-indigo-600 ring-4 ring-indigo-600/15 bg-white shadow-xl scale-[1.02]'
                  : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3.5 left-8 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-md">
                  {p.badge}
                </span>
              )}

              <div>
                <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">{p.description}</p>

                <div className="my-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900">S/ {price}</span>
                    <span className="text-xs font-bold text-slate-500">{periodLabel}</span>
                  </div>
                  {interval === 'ANNUAL' && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Equivalente a S/ {(price / 12).toFixed(2)} al mes
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Capacidad incluida:</p>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{p.limits.max_products >= 9999 ? 'Productos ilimitados' : `Hasta ${p.limits.max_products} productos`}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{p.limits.max_images >= 9999 ? 'Fotos de galería ilimitadas' : `Hasta ${p.limits.max_images} fotos`}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{p.limits.max_staff >= 9999 ? 'Colaboradores ilimitados' : `${p.limits.max_staff} usuario administrador`}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Recepción de pedidos por WhatsApp</span>
                  </div>
                  {p.limits.custom_domain_allowed ? (
                    <div className="flex items-center gap-2.5 text-indigo-700 font-bold">
                      <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Dominio Propio Personalizado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <span className="w-4 text-center">—</span>
                      <span>Dominio propio (No incluido)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4">
                {isCurrent ? (
                  <div className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 text-center border border-indigo-200">
                    Plan Activo Actualmente
                  </div>
                ) : (
                  <button
                    id={`plans-select-${p.slug}-btn`}
                    onClick={() => handleSelect(p.id)}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <span>Elegir {p.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Garantía de Seguridad */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2 pt-4">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Pagos procesados de forma segura con cifrado de grado bancario y verificación HMAC.</span>
      </div>
    </div>
  );
};
