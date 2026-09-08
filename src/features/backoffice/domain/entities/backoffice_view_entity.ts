/**
 * Negocio Flex - Backoffice Domain Entities (Fase 9)
 * Entidades y tipos para la orquestación centralizada de navegación,
 * vistas, módulos, roles (RBAC) y suscripciones.
 */

import { OrganizationModules, UserRole } from '../../../../types';
import { OrganizationAction } from '../../../organizations/domain/entities/organization_entity';

export type BackofficeRole = 'super_admin' | 'owner' | 'admin' | 'staff' | 'viewer';

export type BackofficeViewCategory =
  | 'OPERACION'
  | 'CONFIGURACION'
  | 'SAAS'
  | 'HERRAMIENTAS'
  | 'GLOBAL';

export type BackofficeViewId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'services'
  | 'orders'
  | 'appointments'
  | 'customers'
  | 'customizer'
  | 'settings'
  | 'business_info'
  | 'business_members'
  | 'subscription'
  | 'pricing'
  | 'landing'
  | 'gallery'
  | 'test_center'
  | 'client_catalog'
  | 'client_portal'
  | 'public_page'
  | 'super_admin';

export interface BackofficeBadgeContext {
  readonly pendingOrdersCount: number;
  readonly pendingAppointmentsCount: number;
  readonly productsCount: number;
  readonly customersCount: number;
  readonly pendingApprovalsCount: number;
  readonly trialDaysRemaining?: number;
}

export interface BackofficeRouteConfig {
  readonly id: BackofficeViewId;
  readonly label: string;
  readonly shortLabel?: string;
  readonly category: BackofficeViewCategory;
  readonly iconName: string;
  readonly requiredRoles?: readonly BackofficeRole[];
  readonly requiredPermission?: OrganizationAction;
  readonly requiredModule?: keyof OrganizationModules;
  readonly isSuperAdminOnly?: boolean;
  readonly hiddenFromMenu?: boolean;
  readonly isPublicOrSpecial?: boolean;
  readonly description?: string;
}

export type AccessDeniedReason =
  | 'UNAUTHENTICATED'
  | 'ROLE_RESTRICTED'
  | 'PERMISSION_DENIED'
  | 'MODULE_DISABLED'
  | 'PLAN_UPGRADE_REQUIRED'
  | 'SUPER_ADMIN_REQUIRED'
  | 'ORGANIZATION_REQUIRED';

export interface ViewAccessCheckResult {
  readonly allowed: boolean;
  readonly reason?: AccessDeniedReason;
  readonly message?: string;
  readonly requiredRole?: BackofficeRole;
  readonly requiredModule?: keyof OrganizationModules;
  readonly suggestedAction?: 'upgrade_plan' | 'switch_org' | 'contact_admin' | 'go_dashboard';
}
