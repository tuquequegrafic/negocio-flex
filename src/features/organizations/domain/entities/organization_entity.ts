/**
 * Negocio Flex - Organization & Multi-Tenant Domain Entities (Fase 4)
 * Define las entidades fundamentales de organizaciones, miembros, roles y permisos.
 */

export type BusinessType =
  | 'restaurant'
  | 'salon'
  | 'gym'
  | 'store'
  | 'professional'
  | 'other'
  | 'pasteleria'
  | 'barberia'
  | 'ferreteria'
  | 'veterinaria'
  | 'boutique'
  | 'servicios_generales'
  | 'personalizado';

export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

export type OrganizationRole = 'owner' | 'admin' | 'staff';

export type PlatformRole = 'super_admin' | 'user';

export type MemberStatus = 'active' | 'inactive' | 'invited' | 'suspended';

export type OrganizationAction =
  | 'edit_business_info'
  | 'manage_members'
  | 'change_member_roles'
  | 'remove_members'
  | 'invite_members'
  | 'configure_settings'
  | 'view_metrics'
  | 'view_catalog'
  | 'manage_catalog'
  | 'view_orders'
  | 'manage_orders';

export interface OrgBrandingEntity {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly logoUrl?: string;
  readonly bannerUrl?: string;
  readonly fontName?: string;
  readonly slogan?: string;
}

export interface OrgModulesConfigEntity {
  readonly enableProducts: boolean;
  readonly enableServices: boolean;
  readonly enableAppointments: boolean;
  readonly enableInventory: boolean;
  readonly enableOrders: boolean;
  readonly enableWhatsappCheckout: boolean;
  readonly enableStaffManagement: boolean;
  readonly enableReviews: boolean;
}

export interface OrganizationSettingsEntity {
  readonly id: string;
  readonly organizationId: string;
  readonly language: string;
  readonly timezone: string;
  readonly currency: string;
  readonly dynamicConfig?: Record<string, any>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrganizationMemberEntity {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrganizationRole;
  readonly status: MemberStatus;
  readonly userFullName?: string;
  readonly userEmail?: string;
  readonly userAvatarUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrganizationEntity {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly businessType: BusinessType;
  readonly status: OrganizationStatus;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly description?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly currency: string;
  readonly branding: OrgBrandingEntity;
  readonly modules: OrgModulesConfigEntity;
  readonly settings?: OrganizationSettingsEntity;
  readonly currentUserRole?: OrganizationRole;
  readonly memberCount?: number;
}

/**
 * Matriz de Permisos por Rol en la Organización
 */
export const hasPermission = (
  role: OrganizationRole | undefined | null,
  action: OrganizationAction
): boolean => {
  if (!role) return false;

  switch (role) {
    case 'owner':
      // OWNER tiene control total sobre su negocio
      return true;

    case 'admin':
      // ADMIN puede gestionar operaciones y catálogo, pero no eliminar miembros ni cambiar roles de owners
      switch (action) {
        case 'edit_business_info':
        case 'configure_settings':
        case 'view_metrics':
        case 'view_catalog':
        case 'manage_catalog':
        case 'view_orders':
        case 'manage_orders':
        case 'invite_members':
          return true;
        case 'manage_members':
        case 'change_member_roles':
        case 'remove_members':
        default:
          return false;
      }

    case 'staff':
      // STAFF tiene permisos operativos restringidos
      switch (action) {
        case 'view_catalog':
        case 'view_orders':
        case 'manage_orders':
          return true;
        case 'edit_business_info':
        case 'manage_members':
        case 'change_member_roles':
        case 'remove_members':
        case 'invite_members':
        case 'configure_settings':
        case 'view_metrics':
        case 'manage_catalog':
        default:
          return false;
      }

    default:
      return false;
  }
};
