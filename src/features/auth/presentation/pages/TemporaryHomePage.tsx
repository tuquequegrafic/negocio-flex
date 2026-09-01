/**
 * Negocio Flex - Home / Hub Central (Fase 4: Multi-Tenant)
 * Pantalla principal con contexto de organización activa, roles, selector de negocios y accesos rápidos.
 */

import React from 'react';
import { useAuth } from '../providers/AuthContext';
import { useOrganization } from '../../../organizations/presentation/providers/OrganizationContext';
import { M3Card, M3Button, M3Badge } from '../../../../core/widgets/M3Components';
import {
  User,
  LogOut,
  ShieldCheck,
  Building2,
  Plus,
  KeyRound,
  Layers,
  ArrowRight,
  Settings,
  Users,
  Utensils,
  Scissors,
  Dumbbell,
  Store,
  Briefcase,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { BusinessType, OrganizationRole } from '../../../organizations/domain/entities/organization_entity';

export interface TemporaryHomePageProps {
  onNavigateToProfile: () => void;
  onNavigateToUpdatePassword: () => void;
  onNavigateToMyBusinesses: () => void;
  onNavigateToCreateBusiness: () => void;
  onNavigateToEditBusiness: (orgId: string) => void;
  onNavigateToMembers: (orgId: string) => void;
  onExploreWorkspace?: () => void;
}

const getBusinessTypeIcon = (type?: BusinessType) => {
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

const getRoleBadge = (role?: OrganizationRole | null) => {
  switch (role) {
    case 'owner':
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">👑 Propietario (OWNER)</span>;
    case 'admin':
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🛡️ Administrador (ADMIN)</span>;
    case 'staff':
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">👤 Personal (STAFF)</span>;
    default:
      return null;
  }
};

export const TemporaryHomePage: React.FC<TemporaryHomePageProps> = ({
  onNavigateToProfile,
  onNavigateToUpdatePassword,
  onNavigateToMyBusinesses,
  onNavigateToCreateBusiness,
  onNavigateToEditBusiness,
  onNavigateToMembers,
  onExploreWorkspace,
}) => {
  const { user, profile, logout } = useAuth();
  const {
    organizations,
    activeOrganization,
    userRole,
    isOwner,
    isAdmin,
    selectOrganization,
    isLoading: isOrgLoading,
  } = useOrganization();

  const displayName = profile?.fullName || user?.fullName || 'Usuario';
  const displayEmail = profile?.email || user?.email || 'sin-correo@negocioflex.pe';
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-600/40">
            NF
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            NEGOCIO FLEX
          </h1>
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
            Fase 4: Multi-Tenant, Organizaciones & Roles
          </p>
        </div>

        {/* Main Hub Card */}
        <M3Card variant="elevated" className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-white/20">
          
          {/* User Welcome Block */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl border border-indigo-200 overflow-hidden shrink-0 shadow-xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  ¡Hola, {displayName}!
                </h2>
                <M3Badge label="En línea" variant="success" size="sm" />
              </div>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>

          {/* Active Business Context Card */}
          {activeOrganization ? (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Espacio de Trabajo Activo
                </span>
                {organizations.length > 1 && (
                  <button
                    type="button"
                    onClick={onNavigateToMyBusinesses}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cambiar ({organizations.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: activeOrganization.branding?.primaryColor || '#4F46E5' }}
                >
                  {getBusinessTypeIcon(activeOrganization.businessType)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {activeOrganization.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    negocioflex.pe/{activeOrganization.slug}
                  </p>
                  <div className="pt-1.5 flex flex-wrap items-center gap-2">
                    {getRoleBadge(userRole)}
                  </div>
                </div>
              </div>

              {/* Sub-actions for active business */}
              {(isOwner || isAdmin) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => onNavigateToEditBusiness(activeOrganization.id)}
                    className="flex-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Información</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToMembers(activeOrganization.id)}
                    className="flex-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white py-1.5 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3 h-3" />
                    <span>Miembros</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-center">
              <Building2 className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-xs font-bold text-amber-900">Aún no tienes un negocio registrado</h3>
              <p className="text-[11px] text-amber-700">Crea tu primera empresa para comenzar a operar con rol OWNER.</p>
              <M3Button
                variant="filled"
                size="sm"
                className="w-full justify-center"
                onClick={onNavigateToCreateBusiness}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Crear Mi Negocio
              </M3Button>
            </div>
          )}

          {/* Quick Actions Navigation */}
          <div className="space-y-2">
            
            {onExploreWorkspace && activeOrganization && (
              <M3Button
                variant="filled"
                size="md"
                className="w-full justify-center"
                onClick={onExploreWorkspace}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Entrar al Negocio
              </M3Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNavigateToMyBusinesses}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mis Negocios</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">{organizations.length} registrados</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onNavigateToCreateBusiness}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Crear Negocio</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">Nuevo Tenant</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mi Perfil</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">Datos personales</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onNavigateToUpdatePassword}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                    <span>Seguridad</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">Contraseña</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <M3Button
                variant="text"
                size="sm"
                className="w-full text-red-600 hover:bg-red-50 justify-center"
                onClick={async () => {
                  await logout();
                }}
                icon={<LogOut className="w-4 h-4" />}
              >
                Cerrar Sesión
              </M3Button>
            </div>

          </div>

        </M3Card>

        {/* Security verification footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aislamiento Multi-Tenant • Roles OWNER / ADMIN / STAFF • Supabase RLS</span>
        </div>

      </div>
    </div>
  );
};
