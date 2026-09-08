/**
 * Negocio Flex - UpgradeDialog Component (Fase 10: Presentación)
 * Diálogo modal para selección y cambio de planes SaaS con selector mensual/anual.
 */

import React, { useState } from 'react';
import { PlanEntity, BillingInterval } from '../../domain/entities/plan_entity';
import { Check, Sparkles, X, ShieldCheck, Zap } from 'lucide-react';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plans: readonly PlanEntity[];
  currentPlanId?: string;
  onSelectPlan: (planId: string, interval: BillingInterval) => Promise<void>;
  loading?: boolean;
}

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  isOpen,
  onClose,
  plans,
  currentPlanId,
  onSelectPlan,
  loading = false,
}) => {
  const [interval, setInterval] = useState<BillingInterval>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async (planId: string) => {
    setSelectedPlanId(planId);
    try {
      await onSelectPlan(planId, interval);
      onClose();
    } finally {
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="upgrade-modal-content"
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Planes y Precios SaaS
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Escala la capacidad de tu negocio. Puedes cambiar de plan en cualquier momento.
            </p>
          </div>
          <button
            id="close-upgrade-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector Mensual / Anual */}
        <div className="px-6 pt-6 flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              id="interval-monthly-btn"
              onClick={() => setInterval('MONTHLY')}
              className={`px-4 py-2 rounded-xl transition ${
                interval === 'MONTHLY'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              id="interval-annual-btn"
              onClick={() => setInterval('ANNUAL')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                interval === 'ANNUAL'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Facturación Anual</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md">
                2 MESES GRATIS
              </span>
            </button>
          </div>
        </div>

        {/* Planes Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p => {
            const isCurrent = p.id === currentPlanId;
            const isProcessing = loading && selectedPlanId === p.id;
            const price = interval === 'ANNUAL' ? p.price_annual : p.price_monthly;
            const periodLabel = interval === 'ANNUAL' ? '/año' : '/mes';

            return (
              <div
                key={p.id}
                id={`plan-card-${p.slug}`}
                className={`rounded-2xl p-6 border flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-sm">
                    {p.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="mt-4 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">S/ {price}</span>
                      <span className="text-xs font-semibold text-slate-500">{periodLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Límites y funciones:</p>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{p.limits.max_products >= 9999 ? 'Productos ilimitados' : `Hasta ${p.limits.max_products} productos`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{p.limits.max_images >= 9999 ? 'Fotos ilimitadas' : `Hasta ${p.limits.max_images} fotos`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{p.limits.max_staff >= 9999 ? 'Usuarios ilimitados' : `${p.limits.max_staff} usuario(s)`}</span>
                    </div>
                    {p.limits.custom_domain_allowed && (
                      <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                        <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>Dominio propio (.com / .pe)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 cursor-default"
                    >
                      Plan Actual
                    </button>
                  ) : (
                    <button
                      id={`select-plan-${p.slug}-btn`}
                      onClick={() => handleConfirm(p.id)}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <span>Actualizando...</span>
                      ) : (
                        <>
                          <span>Seleccionar {p.name}</span>
                          <ShieldCheck className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
