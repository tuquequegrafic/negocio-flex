/**
 * Negocio Flex - Can Access View UseCase (Fase 9)
 * Motor de validación Zero Trust para acceso a vistas del Backoffice.
 * Evalúa roles, permisos organizacionales, módulos activos y privilegios de SuperAdmin.
 */

import {
  BackofficeRole,
  BackofficeViewId,
  ViewAccessCheckResult,
} from '../entities/backoffice_view_entity';
import { BACKOFFICE_ROUTES } from '../../presentation/navigation/backoffice_routes';
import { OrganizationAction } from '../../../organizations/domain/entities/organization_entity';

export interface CanAccessViewParams {
  readonly viewId: string;
  readonly role?: BackofficeRole | string | null;
  readonly isSuperAdmin?: boolean;
  readonly activeModules?: Record<string, boolean> | null;
  readonly hasPermission?: (action: OrganizationAction) => boolean;
  readonly hasActiveOrg?: boolean;
}

export class CanAccessViewUseCase {
  /**
   * Evalúa de forma pura y determinista si el usuario puede acceder a una vista.
   */
  execute(params: CanAccessViewParams): ViewAccessCheckResult {
    const {
      viewId,
      role,
      isSuperAdmin = false,
      activeModules,
      hasPermission,
      hasActiveOrg = true,
    } = params;

    // Vistas públicas o de vista previa de tienda
    if (['client_catalog', 'client_portal', 'public_page'].includes(viewId)) {
      return { allowed: true };
    }

    const route = BACKOFFICE_ROUTES.find(r => r.id === viewId);

    // Si la ruta no está registrada en el Backoffice, denegar por defecto
    if (!route) {
      return {
        allowed: false,
        reason: 'ROLE_RESTRICTED',
        message: `La vista "${viewId}" no está registrada en el sistema.`,
        suggestedAction: 'go_dashboard',
      };
    }

    const normalizedRole: BackofficeRole = this.normalizeRole(role, isSuperAdmin);

    // 1. REGLA ESTRICTA: SuperAdmin Only
    if (route.isSuperAdminOnly) {
      const authorizedSuperAdmin = isSuperAdmin === true || normalizedRole === 'super_admin';
      if (!authorizedSuperAdmin) {
        return {
          allowed: false,
          reason: 'SUPER_ADMIN_REQUIRED',
          message: 'Acceso estrictamente restringido a Administradores Globales de la plataforma SaaS.',
          suggestedAction: 'go_dashboard',
        };
      }
      return { allowed: true };
    }

    // SuperAdmin tiene pase de supervisión global a todas las pantallas estándar
    if (isSuperAdmin || normalizedRole === 'super_admin') {
      return { allowed: true };
    }

    // 2. Requerimiento de Organización Activa para pantallas de tenant
    const globalViewsWithoutTenant = ['landing', 'pricing'];
    if (!hasActiveOrg && !globalViewsWithoutTenant.includes(route.id)) {
      return {
        allowed: false,
        reason: 'ORGANIZATION_REQUIRED',
        message: 'Debes seleccionar o pertenecer a una empresa activa para acceder a este módulo.',
        suggestedAction: 'switch_org',
      };
    }

    // 3. Validación por Roles Permitidos (RBAC)
    if (route.requiredRoles && route.requiredRoles.length > 0) {
      if (!route.requiredRoles.includes(normalizedRole)) {
        return {
          allowed: false,
          reason: 'ROLE_RESTRICTED',
          message: `El rol actual ("${normalizedRole}") no cuenta con autorización para acceder a "${route.label}".`,
          suggestedAction: 'go_dashboard',
        };
      }
    }

    // 4. Validación por Permiso Específico en la Organización
    if (route.requiredPermission && typeof hasPermission === 'function') {
      const hasActionPerm = hasPermission(route.requiredPermission);
      if (!hasActionPerm) {
        return {
          allowed: false,
          reason: 'PERMISSION_DENIED',
          message: `No posees el permiso "${route.requiredPermission}" necesario para acceder a "${route.label}".`,
          suggestedAction: 'go_dashboard',
        };
      }
    }

    // 5. Validación por Módulo Activo en el Tenant
    if (route.requiredModule && activeModules) {
      const isModuleEnabled = activeModules[route.requiredModule];
      if (isModuleEnabled === false) {
        return {
          allowed: false,
          reason: 'MODULE_DISABLED',
          requiredModule: route.requiredModule,
          message: `El módulo "${route.label}" se encuentra deshabilitado para esta empresa.`,
          suggestedAction: 'upgrade_plan',
        };
      }
    }

    // Acceso permitido
    return { allowed: true };
  }

  /**
   * Normaliza strings de roles heterogéneos al enum canónico BackofficeRole
   */
  private normalizeRole(role?: string | null, isSuperAdmin?: boolean): BackofficeRole {
    if (isSuperAdmin) return 'super_admin';
    if (!role) return 'viewer';

    const r = role.toLowerCase().trim();
    if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
    if (r === 'owner' || r === 'propietario') return 'owner';
    if (r === 'admin' || r === 'administrador') return 'admin';
    if (r === 'staff' || r === 'colaborador' || r === 'employee') return 'staff';
    if (r === 'viewer' || r === 'customer' || r === 'cliente') return 'viewer';

    return 'viewer';
  }
}
