import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  Sparkles, 
  ShoppingBag, 
  MessageSquare, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Store, 
  BarChart3, 
  Globe, 
  Layers, 
  Clock, 
  Users, 
  Play, 
  Check, 
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../core/utils/formatters';

interface LandingScreenProps {
  onStartOnboarding: () => void;
  onGoToDashboard: () => void;
  onOpenPricing: () => void;
  onOpenLegal: (tab: 'terms' | 'privacy' | 'cookies' | 'refunds') => void;
  onOpenTestCenter: () => void;
  onOpenTutorial?: (role?: 'ADMIN' | 'CUSTOMER') => void;
  onOpenInstallApp?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartOnboarding,
  onGoToDashboard,
  onOpenPricing,
  onOpenLegal,
  onOpenTestCenter,
  onOpenTutorial,
  onOpenInstallApp
}) => {
  const { currentOrg, plans, openAuthModal, setActiveView } = useApp();
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [demoActiveCategory, setDemoActiveCategory] = useState('Pollo & Brasas');

  const demoItems = [
    { name: '1/4 Pollo a la Brasa + Papas + Ensalada', price: 21.90, tag: 'Más Vendido' },
    { name: '1/2 Pollo a la Brasa con Cremas y Gaseosa', price: 39.50, tag: 'Recomendado' },
    { name: 'Combo Familiar Completo 1 Pollo + Papas XL', price: 72.00, tag: 'Familiar' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          <div className="cursor-pointer" onClick={onGoToDashboard}>
            <BrandLogo variant="horizontal" size="md" theme="dark" />
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo Funciona</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo en Vivo</a>
            <a href="#precios" className="hover:text-white transition-colors">Planes y Precios</a>
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Descargar App
              </button>
            )}
            {onOpenTutorial && (
              <button
                onClick={() => onOpenTutorial('ADMIN')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Guía y Tutorial
              </button>
            )}
            <button 
              onClick={onOpenTestCenter}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-bold"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              Suite QA (Fase 12)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Mi Panel
            </button>
            <button
              onClick={onStartOnboarding}
              className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5"
            >
              <span>Empezar Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>La solución #1 para digitalizar tu negocio y vender directo por WhatsApp</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Crea tu Negocio Online y Recibe Pedidos Directo a tu <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">WhatsApp</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Sin comisiones abusivas por venta. Tu catálogo digital personalizado, carrito interactivo, control de inventario y panel de pedidos en tiempo real.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onStartOnboarding}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:scale-102 transition-all flex items-center justify-center gap-2"
            >
              <span>CREAR MI TIENDA GRATIS (14 DÍAS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Ver Demostración</span>
            </button>
          </div>

          {/* Official Brand Identity Card with 4 Pillars */}
          <div className="pt-6 max-w-2xl mx-auto">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <BrandLogo variant="compact" size="lg" theme="dark" />
              </div>
              <p className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                TU NEGOCIO. TU MARCA. TUS PEDIDOS. SIN LÍMITES.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-center">
                <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-1">
                  <div className="text-blue-400 text-lg">🏬</div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                    CREA TU PÁGINA
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-1">
                  <div className="text-emerald-400 text-lg">🛒</div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                    RECIBE PEDIDOS
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-green-950/40 border border-green-800/40 space-y-1">
                  <div className="text-green-400 text-lg">💬</div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                    CLIENTES POR WHATSAPP
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-1">
                  <div className="text-indigo-400 text-lg">📊</div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                    GESTIONA EN UN LUGAR
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Configuración en 3 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>0% comisiones por pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Soporte 100% en español</span>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Live Demo Preview (FASE 11.10 & 11.11) */}
      <section id="demo" className="py-20 bg-slate-900/60 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Experiencia del Cliente
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Así verán tus clientes tu catálogo en el celular
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Diseño ultra rápido y optimizado para compras directas con envío de pedido en formato limpio a WhatsApp.
            </p>
          </div>

          {/* Interactive Mockup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Interactive Mobile Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[340px] bg-slate-950 rounded-[40px] border-4 border-slate-700 shadow-2xl p-3 relative overflow-hidden">
                
                {/* Phone Speaker Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* Simulated Store Screen */}
                <div className="bg-slate-900 rounded-[30px] p-4 text-slate-100 space-y-3 text-xs">
                  {/* Store Header */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                      🍗
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">La Brasa Real Gourmet</h4>
                      <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Abierto ahora • Delivery S/ 5.00
                      </p>
                    </div>
                  </div>

                  {/* Categories Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    {['Pollo & Brasas', 'Bebidas', 'Guarniciones'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setDemoActiveCategory(cat)}
                        className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                          demoActiveCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Products List */}
                  <div className="space-y-2">
                    {demoItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">{item.tag}</span>
                          <p className="font-bold text-white text-xs leading-tight">{item.name}</p>
                          <p className="font-black text-emerald-400 text-xs">{formatCurrency(item.price, 'S/')}</p>
                        </div>
                        <button className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[11px] shrink-0 hover:bg-indigo-500">
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Simulated Cart / WhatsApp Checkout Button */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={onStartOnboarding}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Pedir por WhatsApp (2 items • S/ 61.40)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Feature Highlights */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                  Todo Incluido
                </span>
                <h3 className="text-2xl font-black text-white">
                  Diseñado para multiplicar tus ventas diarias
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Recepción Automática en WhatsApp</h4>
                    <p className="text-slate-400 mt-0.5">
                      Recibes el mensaje estructurado con el nombre del cliente, dirección, detalle exacto de productos y total calculado.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Panel Administrativo & Métricas en Vivo</h4>
                    <p className="text-slate-400 mt-0.5">
                      Control de ventas diarias, productos más vendidos, estados de pedidos (Pendiente, Preparando, Enviado) y CRM de clientes.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Tu Propio Enlace o Dominio Web</h4>
                    <p className="text-slate-400 mt-0.5">
                      Comparte tu link en Instagram, TikTok, Facebook y Google Maps para que tus clientes compren sin instalar ninguna app.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onStartOnboarding}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <span>Probar Gratis por 14 Días</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* Pricing Section (FASE 11.15 & 12.18) */}
      <section id="precios" className="py-20 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Planes Transparentes
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Elige el plan ideal para tu negocio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Comienza hoy con 14 días de prueba gratuita. Cancela en cualquier momento sin penalizaciones.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mt-4">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  billingPeriod === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Facturación Mensual
              </button>
              <button
                onClick={() => setBillingPeriod('ANNUAL')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'ANNUAL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Facturación Anual</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-md font-black">
                  -20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map(plan => {
              const isPopular = plan.slug === 'profesional';
              const price = billingPeriod === 'MONTHLY' ? plan.price_monthly : Math.round((plan.price_annual || plan.price_monthly * 10) / 12);

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between relative transition-all ${
                    isPopular
                      ? 'bg-linear-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10'
                      : 'bg-slate-900/70 border border-slate-800'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                      MÁS RECOMENDADO ⭐
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        {formatCurrency(price, 'S/')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">/mes</span>
                      {billingPeriod === 'ANNUAL' && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                          Facturado anualmente ({formatCurrency(plan.price_annual || price * 12, 'S/')}/año)
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800/60">
                    <button
                      onClick={onStartOnboarding}
                      className={`w-full py-3 rounded-xl font-black text-xs transition-all shadow-md ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isPopular ? 'Elegir Profesional' : `Empezar con ${plan.name}`}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer & Legal Links */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <BrandLogo variant="horizontal" size="sm" theme="dark" showTagline />
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 text-slate-400 font-medium">
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">
                Términos y Condiciones
              </button>
              <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">
                Política de Privacidad
              </button>
              <button onClick={() => onOpenLegal('cookies')} className="hover:text-white transition-colors">
                Cookies
              </button>
              <button onClick={() => onOpenLegal('refunds')} className="hover:text-white transition-colors">
                Cancelaciones
              </button>
              {onOpenInstallApp && (
                <button onClick={onOpenInstallApp} className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                  Descargar App Móvil
                </button>
              )}
              {onOpenTutorial && (
                <button onClick={() => onOpenTutorial('ADMIN')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Manual de Uso
                </button>
              )}
              <button onClick={onOpenTestCenter} className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                Centro de Pruebas QA
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>© 2026 Negocio Flex. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Infraestructura 100% Operativa en la Nube</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
