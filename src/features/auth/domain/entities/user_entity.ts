/**
 * Negocio Flex - Auth Domain Entities
 */

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'staff' | 'customer';

export interface UserEntity {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone?: string;
  readonly avatarUrl?: string;
  readonly role: UserRole;
  readonly organizationId?: string;
  readonly createdAt: string;
}

export interface AuthSessionEntity {
  readonly user: UserEntity;
  readonly token: string;
  readonly expiresAt?: number;
}
