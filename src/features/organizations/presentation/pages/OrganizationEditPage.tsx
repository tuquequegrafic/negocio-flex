/**
 * Negocio Flex - Información Básica del Negocio (Fase 4)
 * Permite editar el nombre, rubro, slug y datos de contacto de la organización activa.
 * Solo accesible para usuarios con roles autorizados (OWNER o ADMIN).
 */

import React, { useState, useEffect } from 'react';
import { useOrganization } from '../providers/OrganizationContext';
import { BusinessType } from '../../domain/entities/organization_entity';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import { M3Card, M3Button, M3TextField, M3Badge } from '../../../../core/widgets/M3Components';
import {
  Building2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export interface OrganizationEditPageProps {
  organizationId: string;
  onBack: () => void;
  onSaved: () => void;
}

export const OrganizationEditPage: React.FC<OrganizationEditPageProps> = ({
  organizationId,
  onBack,
  onSaved,
}) => {
  const { organizations, updateOrganizationInfo, isOwner, isAdmin, can } = useOrganization();

  const org = organizations.find(o => o.id === organizationId);

  const [name, setName] = useState(org?.name || '');
  const [businessType, setBusinessType] = useState<BusinessType>(org?.businessType || 'restaurant');
  const [slug, setSlug] = useState(org?.slug || '');
  const [phone, setPhone] = useState(org?.phone || '');
  const [description, setDescription] = useState(org?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setBusinessType(org.businessType);
      setSlug(org.slug);
      setPhone(org.phone || '');
      setDescription(org.description || '');
    }
  }, [org]);

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <M3Card variant="elevated" className="p-8 text-center max-w-md bg-white rounded-3xl space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Negocio no encontrado</h2>
          <p className="text-xs text-slate-500">No se encontró la información del negocio solicitado o no tienes membresía activa.</p>
          <M3Button variant="filled" onClick={onBack}>Volver a Mis Negocios</M3Button>
        </M3Card>
      </div>
    );
  }

  const isAuthorized = isOwner || isAdmin || org.currentUserRole === 'owner' || org.currentUserRole === 'admin';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <M3Card variant="elevated" className="p-8 text-center max-w-md bg-white rounded-3xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
          <p className="text-xs text-slate-500">
            Tu rol actual ({org.currentUserRole?.toUpperCase()}) no tiene privilegios para editar la información general del negocio. Esta acción está reservada para OWNER o ADMIN.
          </p>
          <M3Button variant="filled" onClick={onBack}>Volver a Mis Negocios</M3Button>
        </M3Card>
      </div>
    );
  }

  const slugError = SlugValidator.validate(slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('El nombre del negocio es obligatorio.');
      return;
    }
    if (slugError) {
      setErrorMessage(slugError);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await updateOrganizationInfo(org.id, {
        name: name.trim(),
        businessType,
        slug: SlugValidator.normalize(slug),
        phone: phone.trim(),
        description: description.trim(),
      });

      setSuccessMessage('Información del negocio actualizada correctamente.');
      setTimeout(() => {
        onSaved();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'No fue posible guardar los cambios.');
    } finally {
      setIsSaving(false);
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
                <span>Información del Negocio</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                {org.name} • {org.currentUserRole?.toUpperCase()}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permiso Autorizado</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error al actualizar</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-bold">{successMessage}</p>
            </div>
          )}

          <M3Card variant="elevated" className="p-6 sm:p-8 bg-white rounded-3xl space-y-5 shadow-xs border border-slate-200/80">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Datos Principales</h2>
              <p className="text-xs text-slate-500">Actualiza los datos de identificación corporativa</p>
            </div>

            <div className="space-y-4">
              <M3TextField
                label="Nombre del Negocio"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre comercial"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Rubro del Negocio</label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value as BusinessType)}
                  className="w-full text-sm rounded-xl border border-slate-300 bg-white py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="restaurant">🍽️ Restaurante / Cafetería</option>
                  <option value="salon">💈 Peluquería / Salón de Belleza</option>
                  <option value="gym">🏋️ Gimnasio / Fitness</option>
                  <option value="store">🛍️ Tienda / Retail</option>
                  <option value="professional">💼 Consultorio / Servicios Profesionales</option>
                  <option value="other">✨ Otro / Personalizado</option>
                </select>
              </div>

              {/* Slug Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Slug / Identificador URL
                </label>
                <div className="relative flex rounded-xl shadow-2xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-mono">
                    negocioflex.pe/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(SlugValidator.normalize(e.target.value))}
                    className="block w-full flex-1 rounded-none rounded-r-xl border border-slate-300 text-xs font-mono py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-500">{slugError}</p>
                )}
              </div>

              <M3TextField
                label="Teléfono / WhatsApp"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
              />

              <M3TextField
                label="Descripción del Negocio"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción breve de los productos o servicios..."
              />
            </div>
          </M3Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <M3Button
              type="button"
              variant="outlined"
              size="md"
              onClick={onBack}
              disabled={isSaving}
            >
              Cancelar
            </M3Button>

            <M3Button
              type="submit"
              variant="filled"
              size="md"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Guardar Cambios
            </M3Button>
          </div>

        </form>

      </main>

    </div>
  );
};
