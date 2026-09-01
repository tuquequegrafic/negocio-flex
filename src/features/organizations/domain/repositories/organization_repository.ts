/**
 * Negocio Flex - Organization Repository Contract (Fase 4)
 */

import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  BusinessType,
  OrganizationRole,
} from '../entities/organization_entity';

export interface CreateOrganizationParams {
  name: string;
  businessType: BusinessType;
  slug?: string;
  description?: string;
  phone?: string;
  primaryColor?: string;
}

export interface IOrganizationRepository {
  /**
   * Obtiene todas las organizaciones donde el usuario es miembro activo
   */
  getUserOrganizations(userId: string): Promise<OrganizationEntity[]>;

  /**
   * Obtiene la información detallada de una organización por su ID
   */
  getOrganizationById(id: string): Promise<OrganizationEntity | null>;

  /**
   * Busca una organización por su slug público único
   */
  getOrganizationBySlug(slug: string): Promise<OrganizationEntity | null>;

  /**
   * Crea una organización de forma atómica (crea org + asigna owner + crea settings)
   */
  createOrganization(params: CreateOrganizationParams, creatorUserId: string): Promise<OrganizationEntity>;

  /**
   * Actualiza la información básica del negocio (requiere rol OWNER o ADMIN)
   */
  updateOrganization(id: string, updates: Partial<OrganizationEntity>, callerUserId: string): Promise<OrganizationEntity>;

  /**
   * Lista los miembros de la organización
   */
  getMembers(organizationId: string): Promise<OrganizationMemberEntity[]>;

  /**
   * Modifica el rol de un miembro (requiere rol OWNER y no permite dejar a la org sin owner)
   */
  changeMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    callerUserId: string
  ): Promise<void>;

  /**
   * Elimina a un miembro de la organización
   */
  removeMember(organizationId: string, targetUserId: string, callerUserId: string): Promise<void>;

  /**
   * Obtiene la configuración de la organización
   */
  getSettings(organizationId: string): Promise<OrganizationSettingsEntity | null>;

  /**
   * Actualiza la configuración de la organización
   */
  updateSettings(
    organizationId: string,
    settings: Partial<OrganizationSettingsEntity>,
    callerUserId: string
  ): Promise<OrganizationSettingsEntity>;
}
