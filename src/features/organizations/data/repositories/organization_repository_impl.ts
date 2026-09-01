/**
 * Negocio Flex - Organization Repository Implementation (Fase 4)
 */

import {
  IOrganizationRepository,
  CreateOrganizationParams,
} from '../../domain/repositories/organization_repository';
import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  OrganizationRole,
} from '../../domain/entities/organization_entity';
import { OrganizationDataSource } from '../datasources/organization_datasource';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class OrganizationRepositoryImpl implements IOrganizationRepository {
  constructor(private readonly dataSource: OrganizationDataSource = new OrganizationDataSource()) {}

  async getUserOrganizations(userId: string): Promise<OrganizationEntity[]> {
    try {
      return await this.dataSource.fetchUserOrganizations(userId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getOrganizationById(id: string): Promise<OrganizationEntity | null> {
    try {
      return await this.dataSource.fetchOrganizationById(id, 'usr-001');
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getOrganizationBySlug(slug: string): Promise<OrganizationEntity | null> {
    try {
      return await this.dataSource.fetchOrganizationBySlug(slug);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createOrganization(params: CreateOrganizationParams, creatorUserId: string): Promise<OrganizationEntity> {
    try {
      return await this.dataSource.createOrganization(params, creatorUserId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateOrganization(
    id: string,
    updates: Partial<OrganizationEntity>,
    callerUserId: string
  ): Promise<OrganizationEntity> {
    try {
      return await this.dataSource.updateOrganization(id, updates, callerUserId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getMembers(organizationId: string): Promise<OrganizationMemberEntity[]> {
    try {
      return await this.dataSource.fetchMembers(organizationId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async changeMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    callerUserId: string
  ): Promise<void> {
    try {
      await this.dataSource.changeMemberRole(organizationId, targetUserId, newRole, callerUserId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async removeMember(organizationId: string, targetUserId: string, callerUserId: string): Promise<void> {
    try {
      await this.dataSource.removeMember(organizationId, targetUserId, callerUserId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getSettings(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    try {
      return await this.dataSource.fetchSettings(organizationId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateSettings(
    organizationId: string,
    settings: Partial<OrganizationSettingsEntity>,
    callerUserId: string
  ): Promise<OrganizationSettingsEntity> {
    try {
      return await this.dataSource.updateSettings(organizationId, settings, callerUserId);
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
