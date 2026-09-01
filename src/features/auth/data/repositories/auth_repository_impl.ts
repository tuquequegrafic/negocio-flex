/**
 * Negocio Flex - Auth Repository Implementation
 * Conecta el contrato de dominio con la fuente de datos de Supabase y almacenamiento local.
 */

import {
  IAuthRepository,
  LoginParams,
  RegisterParams,
  ResetPasswordParams,
  UpdatePasswordParams,
} from '../../domain/repositories/auth_repository';
import { UserEntity, AuthSessionEntity } from '../../domain/entities/user_entity';
import { ProfileEntity, UpdateProfileParams } from '../../domain/entities/profile_entity';
import { IAuthDataSource, SupabaseAuthDataSource } from '../datasources/auth_datasource';
import { supabaseService } from '../../../../core/network/supabase_client';
import { normalizeError } from '../../../../core/errors/app_exceptions';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(private readonly dataSource: IAuthDataSource = new SupabaseAuthDataSource()) {}

  async signIn(params: LoginParams): Promise<AuthSessionEntity> {
    try {
      return await this.dataSource.signIn(params.email, params.password);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  // Backward compatibility alias
  async login(params: LoginParams): Promise<AuthSessionEntity> {
    return this.signIn(params);
  }

  async signUp(params: RegisterParams): Promise<AuthSessionEntity> {
    try {
      return await this.dataSource.signUp(params.email, params.password, params.fullName, params.phone);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  // Backward compatibility alias
  async register(params: RegisterParams): Promise<AuthSessionEntity> {
    return this.signUp(params);
  }

  async signOut(): Promise<void> {
    try {
      await this.dataSource.signOut();
    } catch (error) {
      throw normalizeError(error);
    }
  }

  // Backward compatibility alias
  async logout(): Promise<void> {
    return this.signOut();
  }

  async sendPasswordResetEmail(params: ResetPasswordParams): Promise<void> {
    try {
      await this.dataSource.sendPasswordResetEmail(params.email);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updatePassword(params: UpdatePasswordParams): Promise<void> {
    try {
      await this.dataSource.updatePassword(params.newPassword);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getCurrentUser(): Promise<UserEntity | null> {
    try {
      return await this.dataSource.getUser();
    } catch {
      return null;
    }
  }

  async getCurrentSession(): Promise<AuthSessionEntity | null> {
    try {
      return await this.dataSource.getSession();
    } catch {
      return null;
    }
  }

  async getProfile(userId: string): Promise<ProfileEntity | null> {
    try {
      return await this.dataSource.getProfile(userId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateProfile(userId: string, updates: UpdateProfileParams): Promise<ProfileEntity> {
    try {
      return await this.dataSource.updateProfile(userId, updates);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      return await this.dataSource.uploadAvatar(userId, file);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    return await supabaseService.checkHealth();
  }
}
