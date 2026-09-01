import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Sparkles, X, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { SubscriptionPlan } from '../types';

export const PlanUpgradeModal: React.FC = () => {
  const { 
    upgradeModalOpen, 
    closeUpgradeModal, 
    upgradeModalReason, 
    plans, 
    currentOrg, 
    getCurrentPlan,
    openCheckoutModal 
  } = useApp();

  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const currentPlan = getCurrentPlan();

  if (!upgradeModalOpen) return null;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    closeUpgradeModal();
    openCheckoutModal(plan, billingPeriod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={closeUpgradeModal}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Eleva el potencial de tu negocio
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Elige el plan ideal para {currentOrg?.name || 'tu negocio'}
            </h2>
            {upgradeModalReason ? (
              <p className="mt-2 text-sm text-amber-300 font-medium bg-amber-950/40 border border-amber-500/30 px-3.5 py-1.5 rounded-xl inline-block">
                {upgradeModalReason}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-300">
                Desbloquea más productos, herramientas avanzadas de venta y dominio propio en minutos.
              </p>
            )}
          </div>

          {/* Billing period toggle */}
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
              <button
                type="button"
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Facturación Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('ANNUAL')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'ANNUAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Facturación Anual
                <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  -20% Ahorro
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const isPopular = plan.badge?.includes('POPULAR') || plan.id === 'plan-profesional';
              const price = billingPeriod === 'ANNUAL' 
                ? (plan.price_annual ? Math.round(plan.price_annual / 12) : Math.round(plan.price_monthly * 0.83))
                : plan.price_monthly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between relative ${
                    isPopular
                      ? 'bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-600/10'
                      : 'bg-white border border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 tracking-wide">
                      <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> Más Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                          Tu Plan Actual
                        </span>
                      )}
                    </div>
                    
                    <p className="mt-1 text-xs text-slate-500 min-h-[32px]">
                      {plan.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900">S/ {price}</span>
                      <span className="text-xs font-semibold text-slate-500">/ mes</span>
                      {billingPeriod === 'ANNUAL' && (
                        <span className="text-[11px] text-emerald-600 font-bold block ml-1">
                          (S/ {plan.price_annual || price * 12} al año)
                        </span>
                      )}
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Capacidad y Límites
                      </div>
                      
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5 font-medium">
                        <div className="flex justify-between items-center">
                          <span>Catálogo de productos:</span>
                          <span className="font-bold text-slate-900">
                            {plan.max_products >= 9999 ? 'Ilimitados' : `Hasta ${plan.max_products}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Galería de fotos:</span>
                          <span className="font-bold text-slate-900">
                            {plan.max_images >= 9999 ? 'Ilimitadas' : `Hasta ${plan.max_images}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Usuarios de equipo:</span>
                          <span className="font-bold text-slate-900">
                            {plan.max_staff >= 9999 ? 'Ilimitados' : `Hasta ${plan.max_staff}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="mt-5 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Incluye
                      </div>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-98'
                          : isCurrent
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                      }`}
                    >
                      {isCurrent ? (
                        'Gestionar Plan Actual'
                      ) : (
                        <>
                          <span>Elegir Plan {plan.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee banner */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Garantía y Flexibilidad Total:</span> Puedes cambiar o cancelar tu suscripción en cualquier momento sin penalizaciones ni contratos forzosos. Activación inmediata vía pasarela segura.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
