/**
 * Negocio Flex - Auth Repository Interface (Contrato de Dominio)
 * Define todas las operaciones del ciclo de vida de autenticación y perfil.
 */

import { UserEntity, AuthSessionEntity } from '../entities/user_entity';
import { ProfileEntity, UpdateProfileParams } from '../entities/profile_entity';

export interface LoginParams {
  readonly email: string;
  readonly password?: string;
}

export interface RegisterParams {
  readonly email: string;
  readonly password?: string;
  readonly fullName: string;
  readonly phone?: string;
}

export interface ResetPasswordParams {
  readonly email: string;
}

export interface UpdatePasswordParams {
  readonly newPassword: string;
}

export interface IAuthRepository {
  signIn(params: LoginParams): Promise<AuthSessionEntity>;
  signUp(params: RegisterParams): Promise<AuthSessionEntity>;
  signOut(): Promise<void>;
  sendPasswordResetEmail(params: ResetPasswordParams): Promise<void>;
  updatePassword(params: UpdatePasswordParams): Promise<void>;
  getCurrentUser(): Promise<UserEntity | null>;
  getCurrentSession(): Promise<AuthSessionEntity | null>;
  getProfile(userId: string): Promise<ProfileEntity | null>;
  updateProfile(userId: string, updates: UpdateProfileParams): Promise<ProfileEntity>;
  uploadAvatar(userId: string, file: File): Promise<string>;
  checkHealth(): Promise<{ ok: boolean; message: string }>;
}
