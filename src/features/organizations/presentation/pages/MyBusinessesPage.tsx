/**
 * Negocio Flex - Mis Negocios (Fase 4)
 * Listado de organizaciones multi-tenant a las que pertenece el usuario.
 * Permite seleccionar la organización activa, ver roles asignados y acceder a configuración.
 */

import React from 'react';
import { useOrganization } from '../providers/OrganizationContext';
import { useAuth } from '../../../auth/presentation/providers/AuthContext';
import { M3Card, M3Button, M3Badge } from '../../../../core/widgets/M3Components';
import {
  Building2,
  Plus,
  ArrowRight,
  Shield,
  Users,
  CheckCircle2,
  Settings,
  Store,
  Scissors,
  Dumbbell,
  Utensils,
  Briefcase,
  Layers,
  Home,
  UserCheck,
} from 'lucide-react';
import { BusinessType, OrganizationRole } from '../../domain/entities/organization_entity';

export interface MyBusinessesPageProps {
  onNavigateToCreate: () => void;
  onNavigateToEdit: (orgId: string) => void;
  onNavigateToMembers: (orgId: string) => void;
  onSelectAndEnter: (orgId: string) => void;
  onBackToHome: () => void;
}

const getBusinessTypeIcon = (type: BusinessType) => {
  switch (type) {
    case 'restaurant':
    case 'pasteleria':
      return <Utensils className="w-5 h-5" />;
    case 'salon':
    case 'barberia':
      return <Scissors className="w-5 h-5" />;
    case 'gym':
      return <Dumbbell className="w-5 h-5" />;
    case 'store':
    case 'boutique':
    case 'ferreteria':
      return <Store className="w-5 h-5" />;
    case 'professional':
    case 'veterinaria':
    case 'servicios_generales':
    default:
      return <Briefcase className="w-5 h-5" />;
  }
};

const getRoleBadge = (role?: OrganizationRole) => {
  switch (role) {
    case 'owner':
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">👑 Propietario (OWNER)</span>;
    case 'admin':
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🛡️ Administrador (ADMIN)</span>;
    case 'staff':
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">👤 Personal (STAFF)</span>;
  }
};

export const MyBusinessesPage: React.FC<MyBusinessesPageProps> = ({
  onNavigateToCreate,
  onNavigateToEdit,
  onNavigateToMembers,
  onSelectAndEnter,
  onBackToHome,
}) => {
  const { organizations, activeOrganization, selectOrganization, isLoading } = useOrganization();
  const { profile, user } = useAuth();

  const handleSelectBusiness = async (orgId: string) => {
    const success = await selectOrganization(orgId);
    if (success) {
      onSelectAndEnter(orgId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Volver al Inicio"
            >
              <Home className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Mis Negocios & Empresas</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Aislamiento Multi-Tenant • Roles & Permisos
              </p>
            </div>
          </div>

          <M3Button
            variant="filled"
            size="sm"
            onClick={onNavigateToCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Crear Negocio
          </M3Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        
        {/* Banner informativo de arquitectura Multi-Tenant */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Espacios de Trabajo Aislados</span>
            </h2>
            <p className="text-xs text-indigo-800/80 leading-relaxed max-w-2xl">
              Cada negocio cuenta con datos, configuración, miembros y políticas RLS independientes. Puedes participar en múltiples negocios con diferentes niveles de privilegio.
            </p>
          </div>
          <div className="text-xs font-semibold text-indigo-900 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs shrink-0">
            Usuario: <strong className="text-indigo-600">{profile?.fullName || user?.email}</strong>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Cargando tus organizaciones autorizadas...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && organizations.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">No tienes negocios registrados</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crea tu primera organización para comenzar a configurar tu catálogo, gestionar productos, servicios y membresías de equipo.
              </p>
            </div>
            <M3Button
              variant="filled"
              size="md"
              className="w-full justify-center"
              onClick={onNavigateToCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              Crear mi Primer Negocio
            </M3Button>
          </div>
        )}

        {/* Grid de Organizaciones */}
        {!isLoading && organizations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map((org) => {
              const isActive = activeOrganization?.id === org.id;
              const isOwnerOrAdmin = org.currentUserRole === 'owner' || org.currentUserRole === 'admin';

              return (
                <M3Card
                  key={org.id}
                  variant={isActive ? 'elevated' : 'outlined'}
                  className={`relative p-5 rounded-2xl transition-all flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 ring-indigo-600 bg-white shadow-md'
                      : 'bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-4">
                    
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: org.branding?.primaryColor || '#4F46E5' }}
                        >
                          {getBusinessTypeIcon(org.businessType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-base truncate">
                              {org.name}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block truncate">
                            /{org.slug}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" />
                          ACTIVO
                        </span>
                      )}
                    </div>

                    {/* Role & Business Type Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {getRoleBadge(org.currentUserRole)}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                        Rubro: {org.businessType}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {org.description || 'Sin descripción configurada.'}
                    </p>

                    {/* Info bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{org.memberCount ?? 1} miembro(s)</span>
                      </span>
                      <span>Moneda: <strong>{org.currency}</strong></span>
                    </div>

                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    <M3Button
                      variant={isActive ? 'filled' : 'outlined'}
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => handleSelectBusiness(org.id)}
                      icon={isActive ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                    >
                      {isActive ? 'Entrar al Negocio' : 'Seleccionar & Trabajar'}
                    </M3Button>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onNavigateToEdit(org.id)}
                          className="flex-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Información</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateToMembers(org.id)}
                          className="flex-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Miembros</span>
                        </button>
                      </div>
                    )}
                  </div>

                </M3Card>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
};
