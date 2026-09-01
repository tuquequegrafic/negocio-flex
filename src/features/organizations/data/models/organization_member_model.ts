/**
 * Negocio Flex - Organization Member Model (Fase 4)
 */

import {
  OrganizationMemberEntity,
  OrganizationRole,
  MemberStatus,
} from '../../domain/entities/organization_entity';

export class OrganizationMemberModel implements OrganizationMemberEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly role: OrganizationRole,
    public readonly status: MemberStatus,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly userFullName?: string,
    public readonly userEmail?: string,
    public readonly userAvatarUrl?: string,
  ) {}

  static fromJson(json: any): OrganizationMemberModel {
    const rawProfiles = json.profiles || json.user || {};
    return new OrganizationMemberModel(
      json.id,
      json.organization_id || json.organizationId,
      json.user_id || json.userId,
      (json.role || 'staff') as OrganizationRole,
      (json.status || 'active') as MemberStatus,
      json.created_at || json.createdAt || new Date().toISOString(),
      json.updated_at || json.updatedAt || new Date().toISOString(),
      rawProfiles.full_name || rawProfiles.fullName || json.user_full_name || json.userFullName,
      rawProfiles.email || json.user_email || json.userEmail,
      rawProfiles.avatar_url || rawProfiles.avatarUrl || json.user_avatar_url || json.userAvatarUrl,
    );
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      organization_id: this.organizationId,
      user_id: this.userId,
      role: this.role,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      user_full_name: this.userFullName,
      user_email: this.userEmail,
      user_avatar_url: this.userAvatarUrl,
    };
  }
}
