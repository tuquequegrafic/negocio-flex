import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BUSINESS_TYPE_LABELS } from '../core/utils/formatters';
import { BusinessType } from '../types';
import { 
  Building2, 
  Sparkles, 
  Utensils, 
  Scissors, 
  Dumbbell, 
  ShoppingBag, 
  Briefcase, 
  Check, 
  ArrowRight,
  Layers,
  Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { createOrganization } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<BusinessType>('restaurant');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');

  const typeIcons: Record<string, any> = {
    restaurant: Utensils,
    salon: Scissors,
    gym: Dumbbell,
    store: ShoppingBag,
    professional: Briefcase,
    custom: Sparkles
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    const defaultMods = BUSINESS_TYPE_LABELS[selectedType].defaultModules;
    const initialMods: Record<string, boolean> = {
      products: defaultMods.includes('products'),
      services: defaultMods.includes('services'),
      orders: defaultMods.includes('orders'),
      appointments: defaultMods.includes('appointments'),
      delivery: defaultMods.includes('delivery'),
      promotions: true,
      gallery: true,
      whatsapp: true,
      notifications: true,
      analytics: true
    };

    createOrganization({
      name: businessName,
      business_type: selectedType,
      description: description || `Bienvenido al espacio oficial de ${businessName}`,
      initialModules: initialMods
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* Steps Indicator */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Paso {step} de 3</span>
          <h2 className="text-xl font-bold text-slate-900">
            {step === 1 && 'Selecciona el Tipo de Negocio'}
            {step === 2 && 'Datos de Identidad'}
            {step === 3 && 'Confirmar & Configurar'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-8 h-2 rounded-full transition-all ${
                i <= step ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Type Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Los módulos recomendados y la estructura de la app se adaptarán automáticamente a tu giro comercial.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map(typeKey => {
              const info = BUSINESS_TYPE_LABELS[typeKey];
              const Icon = typeIcons[typeKey] || Sparkles;
              const isSelected = selectedType === typeKey;

              return (
                <div
                  key={typeKey}
                  onClick={() => setSelectedType(typeKey)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{info.label}</h3>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Módulos: {info.defaultModules.slice(0, 3).join(', ')}...
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Name & Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial de tu Negocio</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ej: Trattoria Bella Italia, Barber King, FitLife..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Breve</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="¿Qué productos o servicios ofreces a tu comunidad?"
              className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={!businessName.trim()}
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Summary & Ready */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo de Negocio:</span>
              <strong className="text-slate-900">{BUSINESS_TYPE_LABELS[selectedType].label}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nombre del Negocio:</span>
              <strong className="text-slate-900">{businessName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Plan Asignado:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Prueba Gratuita 14 Días</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Al hacer clic en &quot;Crear Espacio de Negocio&quot;, se generará automáticamente tu identificador Multi-Tenant, base de datos aislada, catálogo y portal web para clientes.
          </p>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Atrás
            </button>
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Crear Espacio de Negocio
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
