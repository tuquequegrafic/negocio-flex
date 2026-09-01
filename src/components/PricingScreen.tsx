import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Zap, 
  ArrowRight,
  Globe,
  ShoppingBag,
  Clock,
  PhoneCall,
  Lock
} from 'lucide-react';
import { SubscriptionPlan } from '../types';

export const PricingScreen: React.FC = () => {
  const { plans, openCheckoutModal, openAuthModal } = useApp();
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Cómo funciona la prueba gratuita de 14 días?',
      a: 'Puedes registrar tu negocio y utilizar todas las funciones del plan elegido durante 14 días completos sin tener que ingresar ninguna tarjeta de crédito. Al finalizar los 14 días, puedes elegir continuar pagando mensualmente o anualmente.'
    },
    {
      q: '¿Qué métodos y pasarelas de pago aceptan?',
      a: 'Aceptamos todas las tarjetas de débito y crédito (Visa, Mastercard, Diners, American Express) a través de Culqi, Mercado Pago y Niubiz, así como pagos instantáneos con Yape y Plin mediante código QR.'
    },
    {
      q: '¿Puedo cambiar de plan o cancelar en cualquier momento?',
      a: 'Sí, totalmente. No tenemos contratos de permanencia obligatoria. Puedes subir de plan para desbloquear más productos o cancelar la renovación cuando desees desde la pestaña "Mi Plan y Suscripción".'
    },
    {
      q: '¿Qué pasa si mi suscripción vence o no puedo pagar?',
      a: 'Tus datos, catálogo de productos y pedidos nunca son borrados. Tu cuenta pasa a estado "vencida" donde puedes renovar cuando estés listo para continuar.'
    },
    {
      q: '¿Cómo funciona el Dominio Personalizado del Plan Premium?',
      a: 'En el Plan Premium puedes conectar tu propio dominio (ejemplo: mitienda.pe o www.minegocio.com). Nuestro equipo te ayuda con la configuración DNS y el certificado SSL de seguridad gratuito.'
    }
  ];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    openCheckoutModal(plan, billingPeriod);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-200 pb-12">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Planes y Precios Transparentes
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Elige el plan perfecto para hacer crecer tu negocio
        </h1>
        
        <p className="text-sm text-slate-600 leading-relaxed">
          Sin comisiones ocultas por venta. Digitaliza tu catálogo, automatiza pedidos por WhatsApp y administra tus clientes desde un único lugar.
        </p>

        {/* Period Selector Toggle */}
        <div className="pt-2 flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                billingPeriod === 'MONTHLY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pago Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('ANNUAL')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                billingPeriod === 'ANNUAL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pago Anual</span>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                2 Meses Gratis (-20%)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const isPopular = plan.badge?.includes('POPULAR') || plan.id === 'plan-profesional';
          const price = billingPeriod === 'ANNUAL'
            ? (plan.price_annual ? Math.round(plan.price_annual / 12) : Math.round(plan.price_monthly * 0.83))
            : plan.price_monthly;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-7 flex flex-col justify-between relative transition-all duration-200 ${
                isPopular
                  ? 'bg-white border-2 border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-600/10'
                  : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black uppercase px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Plan Recomendado
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {plan.badge || 'Plan'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500 min-h-[36px]">
                  {plan.description}
                </p>

                <div className="mt-5 pt-5 border-t border-slate-100 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900">S/ {price}</span>
                  <span className="text-xs font-semibold text-slate-500">/ mes</span>
                </div>
                {billingPeriod === 'ANNUAL' && (
                  <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                    S/ {plan.price_annual || price * 12} facturado anualmente
                  </span>
                )}

                {/* Key specs */}
                <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span>Productos:</span>
                    <span className="font-bold text-slate-900">
                      {plan.max_products >= 9999 ? 'Ilimitados' : `Hasta ${plan.max_products}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fotos de galería:</span>
                    <span className="font-bold text-slate-900">
                      {plan.max_images >= 9999 ? 'Ilimitadas' : `Hasta ${plan.max_images}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuarios / Administradores:</span>
                    <span className="font-bold text-slate-900">
                      {plan.max_staff >= 9999 ? 'Ilimitados' : `Hasta ${plan.max_staff}`}
                    </span>
                  </div>
                </div>

                {/* Feature checklist */}
                <div className="mt-6 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Lo que obtienes
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-98'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                  }`}
                >
                  <span>Comprar Plan {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={openAuthModal}
                  className="w-full py-2 text-center text-[11px] font-bold text-slate-500 hover:text-indigo-600"
                >
                  O prueba gratis por 14 días
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-900">Tabla Comparativa Detallada</h2>
          <p className="text-xs text-slate-500">Revisa minuciosamente cada función incluida en cada plan</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-4 w-1/3">Características</th>
                <th className="pb-4 text-center">Inicial (S/ 29)</th>
                <th className="pb-4 text-center text-indigo-600">Profesional (S/ 49)</th>
                <th className="pb-4 text-center">Premium (S/ 79)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 font-semibold text-slate-900">Catálogo de Productos</td>
                <td className="py-3 text-center">30 productos</td>
                <td className="py-3 text-center font-bold text-indigo-700">150 productos</td>
                <td className="py-3 text-center font-bold text-emerald-600">Ilimitados</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Galería de Imágenes</td>
                <td className="py-3 text-center">10 fotos</td>
                <td className="py-3 text-center font-bold text-indigo-700">50 fotos</td>
                <td className="py-3 text-center font-bold text-emerald-600">Ilimitadas</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Botón de Pedidos a WhatsApp</td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Panel de Pedidos & Estados</td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Directorio y CRM de Clientes</td>
                <td className="py-3 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Métricas & Estadísticas de Ventas</td>
                <td className="py-3 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3 text-center font-bold text-indigo-700">Avanzadas en Tiempo Real</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Dominio Personalizado (tutienda.com)</td>
                <td className="py-3 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-900">Nivel de Soporte</td>
                <td className="py-3 text-center">Estándar (Email)</td>
                <td className="py-3 text-center font-bold text-indigo-700">Prioritario WhatsApp</td>
                <td className="py-3 text-center font-bold text-emerald-600">VIP 24/7 Telefónico</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <HelpCircle className="w-4 h-4" /> Preguntas Frecuentes
          </div>
          <h2 className="text-2xl font-black text-slate-900">Resolvemos todas tus dudas</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50/70"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="max-w-5xl mx-auto p-8 sm:p-10 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black">
          ¿Listo para empezar a vender por internet hoy mismo?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Crea tu tienda en menos de 2 minutos. Comienza con nuestra prueba gratuita de 14 días sin necesidad de tarjeta.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear Negocio Gratis (14 Días)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
