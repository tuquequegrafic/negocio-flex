/**
 * Negocio Flex - BackofficeTopBar Component (Fase 9)
 * Barra superior unificada del Backoffice.
 * Orquesta el selector multi-tenant de empresas, estado del plan,
 * accesos rápidos de tienda, perfil de usuario y acceso protegido a SuperAdmin.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Building2,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  Plus,
  Briefcase,
  Check,
  CreditCard,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { BrandLogo } from '../../../../components/BrandLogo';
import { useBackofficeNavigation } from '../hooks/useBackofficeNavigation';
import { useOrganization } from '../../../organizations/presentation/providers/OrganizationContext';
import { useAuth } from '../../../auth/presentation/providers/AuthContext';
import { useApp } from '../../../../context/AppContext';
import { useSubscription } from '../../../subscriptions/presentation/hooks/useSubscription';
import { calculateTrialDaysRemaining } from '../../../../core/utils/subscriptionLimits';

export interface BackofficeTopBarProps {
  readonly onOpenMobileMenu: () => void;
  readonly onNavigateScreen?: (screen: string) => void;
  readonly onOpenTutorial?: () => void;
}

export const BackofficeTopBar: React.FC<BackofficeTopBarProps> = ({
  onOpenMobileMenu,
  onNavigateScreen,
  onOpenTutorial,
}) => {
  const {
    activeView,
    setActiveView,
    userRole,
    isSuperAdmin,
    switchOrganization,
  } = useBackofficeNavigation();

  const {
    organizations: orgsList,
    activeOrganization,
  } = useOrganization();

  const {
    currentOrg,
    subscriptions,
    plans,
    openUpgradeModal,
  } = useApp();

  const { user: authUser, profile, logout } = useAuth();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const orgMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suscripción y plan actual: Única Fuente Canónica de Verdad
  const activeOrgId = activeOrganization?.id || currentOrg?.id;
  const {
    subscription: subFromHook,
    currentPlan: hookPlan,
  } = useSubscription(activeOrgId);

  const currentSub = subFromHook || subscriptions.find(s => s.organization_id === activeOrgId);
  const currentPlan = hookPlan || plans.find(p => p.id === currentSub?.plan_id) || plans[0];
  const trialDaysRemaining = calculateTrialDaysRemaining(currentSub);

  // Rol legible para el badge
  const roleLabel = {
    super_admin: 'Super Admin',
    owner: 'Propietario',
    admin: 'Administrador',
    staff: 'Colaborador',
    viewer: 'Lectura',
  }[userRole] || 'Miembro';

  const roleColor = {
    super_admin: 'bg-rose-50 text-rose-700 border-rose-200',
    owner: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    viewer: 'bg-slate-50 text-slate-700 border-slate-200',
  }[userRole];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Zona Izquierda: Hamburguesa Móvil + Logo + Switcher Multi-Tenant */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <BrandLogo variant="compact" size="sm" />
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* SELECTOR DE ORGANIZACIÓN / SEDE (Multi-Tenant Switcher Seguro) */}
        <div className="relative" ref={orgMenuRef}>
          <button
            type="button"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left max-w-[200px] sm:max-w-[260px]"
            aria-label="Seleccionar organización activa"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeOrganization?.name || currentOrg?.name || 'Seleccionar Empresa'}
              </span>
              <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span className="capitalize">{activeOrganization?.businessType || currentOrg?.business_type || 'Negocio'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{roleLabel}</span>
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menú Dropdown de Organizaciones Autorizadas */}
          {orgDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mis Empresas Autorizadas
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {orgsList.length}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {orgsList.map(org => {
                  const isActive = org.id === (activeOrganization?.id || currentOrg?.id);
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={async () => {
                        setOrgDropdownOpen(false);
                        await switchOrganization(org.id);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="truncate font-medium">{org.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{org.businessType}</p>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {onNavigateScreen && (
                <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOrgDropdownOpen(false);
                      onNavigateScreen('my_businesses');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ver Administrador de Negocios</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrgDropdownOpen(false);
                      onNavigateScreen('create_business');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Nueva Empresa</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zona Derecha: Estado de Plan + Atajos + SuperAdmin + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Badge de Plan SaaS */}
        <div
          onClick={() => openUpgradeModal?.('Consultar beneficios de plan')}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          title="Click para ver límites o mejorar plan"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">{currentPlan.name}</span>
          {trialDaysRemaining > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {trialDaysRemaining}d
            </span>
          )}
        </div>

        {/* Enlace a Tienda / Catálogo en Vivo */}
        <button
          type="button"
          onClick={() => setActiveView('client_catalog')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-2xs"
          title="Ver cómo ven los clientes tu catálogo online"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          <span>Ver Tienda</span>
        </button>

        {/* ACCESO EXCLUSIVO SUPER ADMIN (CERO TRUST: Estrictamente visible sólo si isSuperAdmin === true) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveView('super_admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeView === 'super_admin'
                ? 'bg-rose-700 text-white ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
            title="Consola de Administración Global SaaS"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Super Admin</span>
          </button>
        )}

        {/* Tutorial / Ayuda */}
        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Guía rápida y tutorial de uso"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Menú de Usuario / Perfil */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            aria-label="Menú de cuenta de usuario"
          >
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {profile?.fullName || authUser?.fullName || 'Usuario'}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold inline-block uppercase ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {(profile?.fullName || authUser?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.fullName || authUser?.fullName || 'Usuario'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {authUser?.email || profile?.email || ''}
                </p>
                <div className="mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="py-1">
                {onNavigateScreen && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigateScreen('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Mi Perfil de Usuario</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setActiveView('subscription');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Mi Plan y Facturación</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
