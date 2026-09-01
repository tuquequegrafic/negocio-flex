import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  User, 
  CreditCard, 
  Check, 
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import { SubscriptionPlan } from '../types';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    plans, 
    registerNewTenantAccount, 
    setActiveView,
    requireSuperAdminApproval
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: User details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [whatsapp, setWhatsapp] = useState('');

  // Step 3: Plan & Trial Choice
  const [selectedPlanId, setSelectedPlanId] = useState('plan-profesional');
  const [startWithTrial, setStartWithTrial] = useState(true);

  if (!isAuthModalOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !whatsapp) return;
    setStep(3);
  };

  const handleFinalSubmit = () => {
    registerNewTenantAccount({
      fullName,
      email,
      businessName,
      businessType,
      whatsapp,
      selectedPlanId,
      startWithTrial
    });
    setStep(4);
  };

  const handleGoToDashboard = () => {
    closeAuthModal();
    setActiveView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 sm:px-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="icon-only" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Paso {step} de 4
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {step === 1 ? 'Crear Cuenta' : step === 2 ? 'Tu Negocio' : step === 3 ? 'Elegir Plan' : '¡Bienvenido!'}
                </span>
              </div>
              <h2 className="text-base font-black text-white">
                {step === 1 && 'Crea tu cuenta de Administrador'}
                {step === 2 && 'Configura los datos de tu Negocio'}
                {step === 3 && 'Selecciona tu Plan de Lanzamiento'}
                {step === 4 && '¡Tu plataforma está lista!'}
              </h2>
            </div>
          </div>

          {step !== 4 && (
            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Wizard Steps Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          
          {/* Step 1: User Account */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  Comienza ingresando tus datos personales. Con este email y contraseña accederás a tu panel de control.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza Ramos"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contraseña Segura
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <span>Continuar al Paso 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  Configura la identidad básica de tu negocio para que tus clientes puedan encontrarte.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre Comercial del Negocio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Pastelería Dolce Amor"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rubro o Tipo de Negocio
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="restaurant">🍔 Restaurante / Cafetería / Comida</option>
                  <option value="salon">✂️ Salón de Belleza / Barbería / Spa</option>
                  <option value="store">🛍️ Tienda de Ropa / Calzado / Accesorios</option>
                  <option value="gym">🏋️ Gimnasio / Fitness / Deportes</option>
                  <option value="services">💼 Servicios Profesionales / Consultoría</option>
                  <option value="other">📦 Otro tipo de comercio</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Número de WhatsApp para recibir Pedidos
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Aquí llegarán los pedidos formateados directamente cuando un cliente compre.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <span>Continuar al Paso 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Plan Selection & Free Trial toggle */}
          {step === 3 && (
            <div className="space-y-6">
              
              {/* Free Trial Banner Option */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Prueba Gratuita de 14 Días
                    </div>
                    <p className="text-xs text-indigo-800">
                      Empieza hoy sin tarjeta de crédito ni compromiso.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startWithTrial}
                    onChange={(e) => setStartWithTrial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Plans options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlanId === p.id
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{p.name}</span>
                        {p.id === 'plan-profesional' && (
                          <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-md uppercase">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        S/ {p.price_monthly.toFixed(2)}
                        <span className="text-[10px] font-normal text-slate-500"> /mes</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                        {p.max_products >= 9999 ? 'Catálogo Ilimitado' : `Hasta ${p.max_products} productos`}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                      {selectedPlanId === p.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Seleccionado
                        </>
                      ) : (
                        <span>Seleccionar</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-98 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {startWithTrial ? 'Comenzar 14 Días Gratis' : 'Crear Negocio y Proceder'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Onboarding Screen */}
          {step === 4 && (
            <div className="py-4 text-center space-y-4">
              {requireSuperAdminApproval ? (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50">
                    <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider">
                      <span>⏳ Solicitud Recibida • En Proceso de Aprobación</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">¡Registro Enviado a Revisión!</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Tu solicitud para registrar el negocio <strong>{businessName}</strong> ha sido enviada al <strong>Super Administrador</strong> para su validación y activación oficial.
                    </p>
                  </div>

                  {/* Visual Approval Process Timeline */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left space-y-3">
                    <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">
                      Estado del Proceso de Admisión:
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Formulario de registro completado</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-amber-700 font-bold">
                        <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0"></div>
                        <span>2. Revisión de Super Administrador (En cola)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">3</div>
                        <span>3. Activación y acceso a tu catálogo y WhatsApp</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl max-w-md mx-auto text-left text-xs text-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Solicitante:</span>
                      <span className="font-bold text-slate-800">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Correo:</span>
                      <span className="font-bold text-slate-800">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Negocio:</span>
                      <span className="font-bold text-slate-800">{businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan Solicitado:</span>
                      <span className="font-bold text-indigo-700">
                        {plans.find(p => p.id === selectedPlanId)?.name || 'Profesional'}
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Button */}
                  <div className="pt-2 max-w-md mx-auto space-y-2">
                    <a
                      href={`https://wa.me/51987654321?text=${encodeURIComponent(`Hola Enrique (Super Admin), acabo de registrar mi negocio "${businessName}" (${email}) en Negocio Flex y solicito la aprobación y activación de mi cuenta.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Agilizar Aprobación por WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        closeAuthModal();
                        setActiveView('dashboard');
                      }}
                      className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-98 transition-all"
                    >
                      Entendido, Volver al Inicio
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">¡Cuenta Creada Exitosamente!</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Tu negocio <strong>{businessName}</strong> ha sido aprovisionado en la plataforma multi-tenant con su catálogo, WhatsApp y panel listos para usar.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Administrador:</span>
                      <span className="font-bold text-slate-800">{fullName} ({email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Negocio:</span>
                      <span className="font-bold text-slate-800">{businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan Seleccionado:</span>
                      <span className="font-bold text-indigo-600">
                        {plans.find(p => p.id === selectedPlanId)?.name || 'Profesional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado:</span>
                      <span className="font-bold text-emerald-600">
                        {startWithTrial ? '🟡 14 Días de Prueba Activa' : '🟢 Cuenta Activa'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleGoToDashboard}
                      className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg active:scale-98 transition-all"
                    >
                      Entrar a Mi Panel de Control
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
