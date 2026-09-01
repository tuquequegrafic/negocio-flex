import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  ArrowUpRight, 
  ShieldCheck, 
  Receipt, 
  RefreshCw, 
  Check, 
  Lock,
  Layers,
  Image as ImageIcon,
  Users,
  Zap
} from 'lucide-react';
import { calculateTrialDaysRemaining } from '../core/utils/subscriptionLimits';

export const SubscriptionScreen: React.FC = () => {
  const { 
    currentOrg, 
    getCurrentSubscription, 
    getCurrentPlan, 
    openUpgradeModal, 
    openCheckoutModal,
    renewSubscription,
    cancelSubscription,
    updateCustomDomain,
    payments,
    plans,
    products,
    galleryItems,
    users
  } = useApp();

  const currentSub = getCurrentSubscription();
  const currentPlan = getCurrentPlan();
  const trialDaysRemaining = calculateTrialDaysRemaining(currentSub);

  // Custom Domain input state
  const [domainInput, setDomainInput] = useState(currentSub?.custom_domain || '');
  const [domainSaved, setDomainSaved] = useState(false);

  // Cancel Confirmation Modal State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Tenant metrics
  const orgProductsCount = products.filter(p => p.organization_id === currentOrg.id).length;
  const orgGalleryCount = galleryItems.filter(g => g.organization_id === currentOrg.id).length;
  const orgUsersCount = users.filter(u => u.organization_id === currentOrg.id).length || 1;

  // Payments for this organization
  const orgPayments = payments.filter(p => p.organization_id === currentOrg.id);

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return;
    updateCustomDomain(currentOrg.id, domainInput);
    setDomainSaved(true);
    setTimeout(() => setDomainSaved(false), 3000);
  };

  const handleConfirmCancel = () => {
    cancelSubscription(currentOrg.id);
    setShowCancelConfirm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mi Plan y Suscripción</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administra los límites de tu catálogo, facturación, método de pago y dominio de tu negocio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openUpgradeModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 active:scale-98 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Mejorar o Cambiar de Plan</span>
        </button>
      </div>

      {/* Trial banner if active */}
      {currentSub?.status === 'trial' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-black text-sm">
              {trialDaysRemaining}d
            </div>
            <div>
              <div className="text-sm font-black text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Estás disfrutando de tu Prueba Gratuita de 14 Días
              </div>
              <p className="text-xs text-amber-800/80">
                Te quedan <strong>{trialDaysRemaining} días</strong> para explorar todas las herramientas. Activa tu plan oficial para no perder el acceso a tus pedidos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => currentPlan && openCheckoutModal(currentPlan, 'MONTHLY')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition-colors"
          >
            Activar Plan Oficial Ahora
          </button>
        </div>
      )}

      {/* Hero Plan Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 rounded-full">
                Plan Actual
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentSub?.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                  : currentSub?.status === 'trial'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}>
                {currentSub?.status === 'active' ? '● Suscripción Activa' : currentSub?.status === 'trial' ? '● Prueba Gratuita' : '● Pago Pendiente'}
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Plan {currentPlan?.name || 'Inicial'}
              <span className="text-base font-normal text-slate-300">
                (S/ {currentPlan?.price_monthly.toFixed(2)} / mes)
              </span>
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentPlan?.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {currentSub?.status === 'past_due' ? (
              <button
                type="button"
                onClick={() => renewSubscription(currentOrg.id)}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renovar Suscripción Ahora</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openUpgradeModal()}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                <span>Cambiar de Plan</span>
              </button>
            )}

            {currentSub?.status === 'active' && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-rose-300 text-[11px] font-medium text-center transition-colors"
              >
                Cancelar renovación automática
              </button>
            )}
          </div>
        </div>

        {/* Usage Limits Meters */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Uso de Recursos y Capacidad del Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Products Meter */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Productos en Catálogo</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {orgProductsCount} / {currentPlan?.max_products >= 9999 ? '∞' : currentPlan?.max_products}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    orgProductsCount >= (currentPlan?.max_products || 30) ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((orgProductsCount / (currentPlan?.max_products || 30)) * 100))}%`
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {currentPlan?.max_products >= 9999 ? (
                  'Dispones de productos ilimitados.'
                ) : (
                  `Te quedan ${Math.max(0, (currentPlan?.max_products || 30) - orgProductsCount)} productos para alcanzar el límite.`
                )}
              </p>
            </div>

            {/* Gallery Meter */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Fotos en Galería</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {orgGalleryCount} / {currentPlan?.max_images >= 9999 ? '∞' : currentPlan?.max_images}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((orgGalleryCount / (currentPlan?.max_images || 10)) * 100))}%`
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {currentPlan?.max_images >= 9999 ? (
                  'Fotos ilimitadas en tu portafolio.'
                ) : (
                  `Has utilizado ${orgGalleryCount} de ${currentPlan?.max_images} fotos permitidas.`
                )}
              </p>
            </div>

            {/* Users Meter */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Usuarios / Equipo</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {orgUsersCount} / {currentPlan?.max_staff >= 9999 ? '∞' : currentPlan?.max_staff}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((orgUsersCount / (currentPlan?.max_staff || 1)) * 100))}%`
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {currentPlan?.max_staff >= 9999 ? (
                  'Acceso para todo tu equipo de trabajo.'
                ) : (
                  `Tu plan permite hasta ${currentPlan?.max_staff} usuario(s) simultáneo(s).`
                )}
              </p>
            </div>

          </div>
        </div>

        {/* Subscription details footer */}
        <div className="px-6 py-4 sm:px-8 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Método de pago:</span>{' '}
              <span className="font-bold text-slate-800">{currentSub?.payment_method || 'Tarjeta de Crédito'}</span>
            </div>
            <div>
              <span className="text-slate-400">Próxima facturación:</span>{' '}
              <span className="font-bold text-slate-800">
                {currentSub?.next_billing_date ? new Date(currentSub.next_billing_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Garantía de servicio activo 99.9%</span>
          </div>
        </div>
      </div>

      {/* Custom Domain Section (Included in Premium) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dominio Personalizado</h3>
              <p className="text-xs text-slate-500">
                Conecta tu propia dirección web (ejemplo: <code className="text-indigo-600 font-mono">www.miempresa.pe</code>)
              </p>
            </div>
          </div>

          {!currentPlan?.custom_domain_allowed && (
            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Exclusivo Plan Premium
            </span>
          )}
        </div>

        {currentPlan?.custom_domain_allowed ? (
          <form onSubmit={handleSaveDomain} className="space-y-4 max-w-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="ejemplo.com o tienda.pe"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs active:scale-98 transition-all"
              >
                Guardar Dominio
              </button>
            </div>

            {domainSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Dominio guardado! Apunta los registros CNAME o A de tu proveedor DNS a <code className="font-mono font-bold">cname.negocioflex.pe</code>.</span>
              </div>
            )}
          </form>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              Tu plan actual utiliza el subdominio gratuito: <code className="font-bold text-indigo-600">negocioflex.pe/{currentOrg.slug}</code>. Actualiza a <strong>Premium</strong> para utilizar tu propio dominio sin marca de agua.
            </div>
            <button
              type="button"
              onClick={() => openUpgradeModal('Desbloquea dominio personalizado propio actualizando al Plan Premium')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shrink-0"
            >
              Mejorar a Premium (S/ 79)
            </button>
          </div>
        )}
      </div>

      {/* Invoices & Payment History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Historial de Facturación y Pagos</h3>
              <p className="text-xs text-slate-500">
                Descarga tus comprobantes electrónicos y revisa el estado de tus mensualidades
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Concepto</th>
                <th className="pb-3">Pasarela / Medio</th>
                <th className="pb-3">Monto</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgPayments.length > 0 ? (
                orgPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-medium text-slate-900">
                      {new Date(pay.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 text-slate-700 font-semibold">
                      {pay.plan_name}
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono">
                      {pay.payment_gateway} {pay.card_last4 ? `(•••• ${pay.card_last4})` : ''}
                    </td>
                    <td className="py-3.5 font-black text-slate-900">
                      {pay.currency} {pay.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Aprobado
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={pay.receipt_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>PDF Recibo</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No se registran transacciones previas para este negocio. (Prueba Gratuita activa)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">¿Cancelar renovación automática?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tu plan actual permanecerá activo hasta el final de tu período contratado (<strong>{currentSub?.end_date ? new Date(currentSub.end_date).toLocaleDateString('es-PE') : 'fin de mes'}</strong>). Tus datos y catálogo <strong>NO</strong> serán eliminados.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Mantener mi Plan
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
