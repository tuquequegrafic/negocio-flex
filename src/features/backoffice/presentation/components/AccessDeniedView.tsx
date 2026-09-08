/**
 * Negocio Flex - AccessDeniedView Component (Fase 9)
 * Pantalla de denegación de acceso Zero Trust.
 * Proporciona retroalimentación contextual clara y opciones de navegación seguras.
 */

import React from 'react';
import {
  ShieldAlert,
  Lock,
  Zap,
  ArrowLeft,
  Building2,
  Tag,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { ViewAccessCheckResult } from '../../domain/entities/backoffice_view_entity';

export interface AccessDeniedViewProps {
  readonly checkResult: ViewAccessCheckResult;
  readonly onGoDashboard: () => void;
  readonly onGoPricing?: () => void;
  readonly onSwitchOrg?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  checkResult,
  onGoDashboard,
  onGoPricing,
  onSwitchOrg,
}) => {
  const { reason, message, requiredModule, suggestedAction } = checkResult;

  const getIcon = () => {
    switch (reason) {
      case 'SUPER_ADMIN_REQUIRED':
        return <Lock className="w-12 h-12 text-rose-600" />;
      case 'ROLE_RESTRICTED':
      case 'PERMISSION_DENIED':
        return <ShieldAlert className="w-12 h-12 text-amber-600" />;
      case 'MODULE_DISABLED':
        return <Zap className="w-12 h-12 text-indigo-600" />;
      case 'PLAN_UPGRADE_REQUIRED':
        return <CreditCard className="w-12 h-12 text-emerald-600" />;
      case 'ORGANIZATION_REQUIRED':
        return <Building2 className="w-12 h-12 text-blue-600" />;
      default:
        return <AlertCircle className="w-12 h-12 text-slate-600" />;
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'SUPER_ADMIN_REQUIRED':
        return 'Acceso Restringido: Super Administrador';
      case 'ROLE_RESTRICTED':
        return 'Nivel de Autorización Insuficiente';
      case 'PERMISSION_DENIED':
        return 'Permiso No Concedido';
      case 'MODULE_DISABLED':
        return 'Módulo No Habilitado';
      case 'PLAN_UPGRADE_REQUIRED':
        return 'Función Disponible en Plan Superior';
      case 'ORGANIZATION_REQUIRED':
        return 'Selección de Empresa Requerida';
      default:
        return 'Acceso No Autorizado';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[60vh]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 mb-6">
          {getIcon()}
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {getTitle()}
        </h2>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {message || 'No tienes los permisos requeridos para interactuar con esta sección del sistema.'}
        </p>

        {requiredModule && (
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Módulo requerido:</span> {requiredModule}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onGoDashboard}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>

          {(suggestedAction === 'upgrade_plan' || reason === 'MODULE_DISABLED' || reason === 'PLAN_UPGRADE_REQUIRED') && onGoPricing && (
            <button
              type="button"
              onClick={onGoPricing}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Explorar Planes y Mejoras
            </button>
          )}

          {(suggestedAction === 'switch_org' || reason === 'ORGANIZATION_REQUIRED') && onSwitchOrg && (
            <button
              type="button"
              onClick={onSwitchOrg}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Seleccionar Otra Empresa
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
            Zero Trust Policy • Negocio Flex Backoffice
          </span>
        </div>
      </div>
    </div>
  );
};
