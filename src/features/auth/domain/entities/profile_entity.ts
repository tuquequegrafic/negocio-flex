/**
 * Negocio Flex - Profile Entity (Domain Layer)
 * Representa el perfil del usuario en la tabla `profiles`.
 */

import { UserRole } from './user_entity';

export interface ProfileEntity {
  readonly id: string;
  readonly fullName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly avatarUrl?: string;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface UpdateProfileParams {
  readonly fullName?: string;
  readonly phone?: string;
  readonly avatarUrl?: string;
}
