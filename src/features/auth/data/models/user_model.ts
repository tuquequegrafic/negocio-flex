/**
 * Negocio Flex - User Data Model
 */

import { UserEntity, UserRole, AuthSessionEntity } from '../../domain/entities/user_entity';

export class UserModel implements UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly createdAt: string,
    public readonly phone?: string,
    public readonly avatarUrl?: string,
    public readonly organizationId?: string,
  ) {}

  static fromJson(json: any): UserModel {
    return new UserModel(
      json.id || `usr-${Date.now()}`,
      json.email || '',
      json.full_name || json.fullName || 'Usuario Negocio Flex',
      (json.role as UserRole) || 'owner',
      json.created_at || json.createdAt || new Date().toISOString(),
      json.phone,
      json.avatar_url || json.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      json.organization_id || json.organizationId,
    );
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      full_name: this.fullName,
      role: this.role,
      created_at: this.createdAt,
      phone: this.phone,
      avatar_url: this.avatarUrl,
      organization_id: this.organizationId,
    };
  }
}
