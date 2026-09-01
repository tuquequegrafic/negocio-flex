/**
 * Negocio Flex - Profile Data Model
 * Serializa y deserializa datos de la tabla `profiles` de Supabase / PostgreSQL.
 */

import { ProfileEntity } from '../../domain/entities/profile_entity';
import { UserRole } from '../../domain/entities/user_entity';

export class ProfileModel implements ProfileEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly createdAt: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly avatarUrl?: string,
    public readonly updatedAt?: string,
  ) {}

  static fromJson(json: any): ProfileModel {
    return new ProfileModel(
      json.id,
      json.full_name || json.fullName || 'Usuario',
      (json.role as UserRole) || 'owner',
      json.created_at || json.createdAt || new Date().toISOString(),
      json.email,
      json.phone,
      json.avatar_url || json.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      json.updated_at || json.updatedAt,
    );
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      full_name: this.fullName,
      email: this.email,
      phone: this.phone,
      avatar_url: this.avatarUrl,
      role: this.role,
      created_at: this.createdAt,
      updated_at: this.updatedAt || new Date().toISOString(),
    };
  }
}
