/**
 * Negocio Flex - BackofficeSidebar Component (Fase 9)
 * Barra lateral de navegación centralizada y modular.
 * Agrupa rutas por categorías de negocio, renderiza insignias en vivo
 * y respeta estrictamente el RBAC y los módulos activados.
 */

import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Calendar,
  ShoppingBag,
  Layers,
  Sparkles,
  Users,
  Palette,
  Building2,
  UserCheck,
  CreditCard,
  Tag,
  Globe,
  ImageIcon,
  Zap,
  ShieldCheck,
  X,
  Smartphone,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { useBackofficeNavigation } from '../hooks/useBackofficeNavigation';
import { CATEGORY_METADATA } from '../navigation/backoffice_routes';
import { useApp } from '../../../../context/AppContext';

export interface BackofficeSidebarProps {
  readonly isOpenMobile: boolean;
  readonly onCloseMobile: () => void;
  readonly onOpenLegal?: () => void;
  readonly onOpenInstall?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Truck,
  Calendar,
  ShoppingBag,
  Layers,
  Sparkles,
  Users,
  Palette,
  Building2,
  UserCheck,
  CreditCard,
  Tag,
  Globe,
  ImageIcon,
  Zap,
  ShieldCheck,
  Receipt,
};

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  onOpenLegal,
  onOpenInstall,
}) => {
  const {
    activeView,
    setActiveView,
    groupedRoutes,
    badges,
  } = useBackofficeNavigation();

  const { openUpgradeModal } = useApp();

  const handleNavigate = (viewId: string) => {
    setActiveView(viewId);
    onCloseMobile();
  };

  const getBadgeForRoute = (routeId: string) => {
    switch (routeId) {
      case 'orders':
        return badges.pendingOrdersCount > 0 ? (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full">
            {badges.pendingOrdersCount}
          </span>
        ) : null;
      case 'appointments':
        return badges.pendingAppointmentsCount > 0 ? (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-900 rounded-full">
            {badges.pendingAppointmentsCount}
          </span>
        ) : null;
      case 'products':
        return badges.productsCount > 0 ? (
          <span className="ml-auto px-1.5 py-0.2 text-[10px] font-medium text-slate-400">
            {badges.productsCount}
          </span>
        ) : null;
      case 'customers':
        return badges.customersCount > 0 ? (
          <span className="ml-auto px-1.5 py-0.2 text-[10px] font-medium text-slate-400">
            {badges.customersCount}
          </span>
        ) : null;
      case 'super_admin':
        return badges.pendingApprovalsCount > 0 ? (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full animate-pulse">
            {badges.pendingApprovalsCount}
          </span>
        ) : null;
      default:
        return null;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Cabecera Móvil */}
      <div className="lg:hidden h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-white text-sm">Menú de Navegación</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de Grupos y Rutas de Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {groupedRoutes.map(group => {
          const catMeta = CATEGORY_METADATA[group.category];
          return (
            <div key={group.category} className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {catMeta?.label || group.category}
              </div>

              <div className="space-y-0.5">
                {group.items.map(route => {
                  const Icon = ICON_MAP[route.iconName] || LayoutDashboard;
                  const isActive = activeView === route.id;
                  const isSuperAdminItem = route.isSuperAdminOnly;

                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleNavigate(route.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? isSuperAdminItem
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-indigo-600 text-white shadow-xs'
                          : isSuperAdminItem
                          ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{route.label}</span>
                      {getBadgeForRoute(route.id)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Banner de Ayuda / Accesos Secundarios Inferiores */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-750">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-200">Plan SaaS Activo</span>
            <button
              type="button"
              onClick={() => openUpgradeModal?.('Mejora de plan desde barra lateral')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-0.5"
            >
              Mejorar
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Desbloquea pedidos ilimitados, WhatsApp directo y dominio propio.
          </p>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          {onOpenInstall && (
            <button
              type="button"
              onClick={onOpenInstall}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {onOpenLegal && (
            <button
              type="button"
              onClick={onOpenLegal}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Términos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Escritorio (fijo) */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20">
        {sidebarContent}
      </aside>

      {/* Sidebar Móvil (Drawer deslizable) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
