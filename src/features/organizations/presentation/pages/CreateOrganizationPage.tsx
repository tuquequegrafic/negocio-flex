/**
 * Negocio Flex - Crear Mi Negocio (Fase 4)
 * Formulario de creación atómica de una nueva organización.
 * Asigna automáticamente al creador como OWNER y genera configuración por defecto.
 */

import React, { useState, useEffect } from 'react';
import { useOrganization } from '../providers/OrganizationContext';
import { BusinessType } from '../../domain/entities/organization_entity';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import { M3Card, M3Button, M3TextField, M3Badge } from '../../../../core/widgets/M3Components';
import {
  Building2,
  Utensils,
  Scissors,
  Dumbbell,
  Store,
  Briefcase,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

export interface CreateOrganizationPageProps {
  onBack: () => void;
  onSuccess: (orgId: string) => void;
}

const BUSINESS_TYPE_OPTIONS: { type: BusinessType; title: string; desc: string; icon: any }[] = [
  {
    type: 'restaurant',
    title: 'Restaurante / Cafetería',
    desc: 'Menú digital, delivery, pedidos de cocina y reservas de mesa.',
    icon: Utensils,
  },
  {
    type: 'salon',
    title: 'Peluquería / Barbería / Spa',
    desc: 'Agenda de citas por profesional, servicios y catálogo de belleza.',
    icon: Scissors,
  },
  {
    type: 'gym',
    title: 'Gimnasio / Centro Fitness',
    desc: 'Membresías, pases, reserva de clases y suplementos deportivos.',
    icon: Dumbbell,
  },
  {
    type: 'store',
    title: 'Tienda / Comercio / Retail',
    desc: 'Catálogo de productos, control de stock y pedidos por WhatsApp.',
    icon: Store,
  },
  {
    type: 'professional',
    title: 'Consultorio / Servicios Profesionales',
    desc: 'Atención personalizada, cotizaciones y reserva de horarios.',
    icon: Briefcase,
  },
  {
    type: 'other',
    title: 'Otro Rubro / Personalizado',
    desc: 'Configura módulos dinámicos según el modelo de tu emprendimiento.',
    icon: Layers,
  },
];

export const CreateOrganizationPage: React.FC<CreateOrganizationPageProps> = ({
  onBack,
  onSuccess,
}) => {
  const { createNewOrganization } = useOrganization();

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generación automática del slug basada en el nombre mientras el usuario no lo haya editado manualmente
  useEffect(() => {
    if (!isSlugCustomized) {
      setSlug(SlugValidator.normalize(name));
    }
  }, [name, isSlugCustomized]);

  const slugValidationError = SlugValidator.validate(slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Ingresa el nombre del negocio');
      return;
    }
    if (slugValidationError) {
      setErrorMessage(slugValidationError);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createNewOrganization(
        name.trim(),
        businessType,
        slug.trim(),
        description.trim(),
        phone.trim(),
        primaryColor
      );

      onSuccess(created.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar el negocio. Verifica los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Crear Mi Negocio</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Alta de nuevo Tenant con rol OWNER automático
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Asignación OWNER Garantizada</span>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No se pudo crear el negocio</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <M3Card variant="elevated" className="p-6 sm:p-8 bg-white rounded-3xl space-y-5 shadow-xs border border-slate-200/80">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>1. Identidad de tu Negocio</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ingresa el nombre público y el identificador único para tu enlace web.
              </p>
            </div>

            <div className="space-y-4">
              <M3TextField
                label="Nombre del Negocio / Empresa"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Restaurante El Sabor, Peluquería Glamour..."
              />

              {/* Slug Input & Live URL Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Slug / Identificador URL Único
                  </label>
                  {isSlugCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugCustomized(false);
                        setSlug(SlugValidator.normalize(name));
                      }}
                      className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                    >
                      Autogenerar desde el nombre
                    </button>
                  )}
                </div>

                <div className="relative flex rounded-xl shadow-2xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-mono">
                    negocioflex.pe/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => {
                      setIsSlugCustomized(true);
                      setSlug(SlugValidator.normalize(e.target.value));
                    }}
                    placeholder="mi-negocio"
                    className={`block w-full flex-1 rounded-none rounded-r-xl border text-xs font-mono py-2.5 px-3 focus:outline-none focus:ring-2 ${
                      slugValidationError
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  {slugValidationError ? (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {slugValidationError}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Formato URL válido
                    </span>
                  )}
                  <span className="text-slate-400">Normalizado a minúsculas sin caracteres especiales</span>
                </div>
              </div>
            </div>
          </M3Card>

          {/* Section 2: Rubro / Business Type */}
          <M3Card variant="elevated" className="p-6 sm:p-8 bg-white rounded-3xl space-y-5 shadow-xs border border-slate-200/80">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>2. Selecciona el Rubro del Negocio</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ajusta las herramientas operativas iniciales (productos, citas, pedidos) según tu industria.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {BUSINESS_TYPE_OPTIONS.map((item) => {
                const isSelected = businessType === item.type;
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.type}
                    onClick={() => setBusinessType(item.type)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">{item.title}</h3>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 self-end">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Seleccionado</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </M3Card>

          {/* Section 3: Contact & Description (Optional) */}
          <M3Card variant="elevated" className="p-6 sm:p-8 bg-white rounded-3xl space-y-5 shadow-xs border border-slate-200/80">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                3. Datos Complementarios (Opcionales)
              </h2>
              <p className="text-xs text-slate-500">
                Información de contacto inicial para tu nuevo espacio de trabajo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <M3TextField
                label="Teléfono / WhatsApp Comercial"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Color Primario de Marca</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 p-1 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 font-bold">{primaryColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <M3TextField
              label="Descripción breve del negocio"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Especialistas en cocina marina y atención de banquetes..."
            />
          </M3Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <M3Button
              type="button"
              variant="outlined"
              size="md"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancelar
            </M3Button>

            <M3Button
              type="submit"
              variant="filled"
              size="md"
              isLoading={isSubmitting}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Crear Empresa & Asignar OWNER
            </M3Button>
          </div>

        </form>

      </main>

    </div>
  );
};
