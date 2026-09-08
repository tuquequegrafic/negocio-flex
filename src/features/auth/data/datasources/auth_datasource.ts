/**
 * Negocio Flex - Auth & Profile Datasource
 * Conecta exclusivamente con Supabase Auth, PostgreSQL `profiles` y Supabase Storage `avatars`.
 * Sin creación de usuarios ni sesiones simuladas/mock.
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { STORAGE_BUCKETS } from '../../../../core/constants/app_constants';
import { Database } from '../../../../types/database.types';
import { UserModel } from '../models/user_model';
import { ProfileModel } from '../models/profile_model';
import { AuthSessionEntity } from '../../domain/entities/user_entity';
import { UpdateProfileParams } from '../../domain/entities/profile_entity';
import { AuthException, ServerException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export interface IAuthDataSource {
  signIn(email: string, password?: string): Promise<AuthSessionEntity>;
  signUp(email: string, password?: string, fullName?: string, phone?: string): Promise<AuthSessionEntity>;
  signOut(): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  getSession(): Promise<AuthSessionEntity | null>;
  getUser(): Promise<UserModel | null>;
  getProfile(userId: string): Promise<ProfileModel | null>;
  updateProfile(userId: string, updates: UpdateProfileParams): Promise<ProfileModel>;
  uploadAvatar(userId: string, file: File): Promise<string>;
}

export class SupabaseAuthDataSource implements IAuthDataSource {
  private get supabase() {
    return supabaseService.getClient();
  }

  private ensureClient() {
    const client = this.supabase;
    if (!client) {
      throw new AuthException(
        'Supabase no está configurado. Por favor define las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
      );
    }
    return client;
  }

  async signIn(email: string, password?: string): Promise<AuthSessionEntity> {
    logger.info('Iniciando autenticación con Supabase Auth...', { email });

    const client = this.ensureClient();

    if (!password) {
      throw new AuthException('Debes ingresar tu contraseña.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      logger.warning('Error en autenticación Supabase:', error.message);
      // Mensajes de error legibles y amigables
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new AuthException('El correo o la contraseña son incorrectos.');
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new AuthException('Por favor confirma tu correo electrónico antes de iniciar sesión.');
      }
      throw new AuthException(error.message || 'Error al iniciar sesión.');
    }

    if (!data.user || !data.session) {
      throw new AuthException('No se pudo establecer la sesión.');
    }

    const profile = await this.getProfile(data.user.id);

    const userModel = UserModel.fromJson({
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario',
      phone: profile?.phone || data.user.user_metadata?.phone,
      avatarUrl: profile?.avatarUrl || data.user.user_metadata?.avatar_url,
      role: profile?.role || (profile?.isSuperAdmin ? 'super_admin' : 'owner'),
      createdAt: data.user.created_at,
      isSuperAdmin: profile?.isSuperAdmin || false,
    });

    return {
      user: userModel,
      token: data.session.access_token,
      expiresAt: data.session.expires_at,
    };
  }

  async signUp(
    email: string,
    password?: string,
    fullName?: string,
    phone?: string
  ): Promise<AuthSessionEntity> {
    logger.info('Registrando nuevo usuario en Supabase Auth...', { email });

    const client = this.ensureClient();

    if (!password) {
      throw new AuthException('Debes ingresar una contraseña de al menos 6 caracteres.');
    }

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || '',
          phone: phone?.trim() || '',
        },
      },
    });

    if (error) {
      logger.warning('Error en registro de Supabase:', error.message);
      if (error.message.toLowerCase().includes('already registered')) {
        throw new AuthException('Este correo electrónico ya está registrado.');
      }
      throw new AuthException(error.message || 'No fue posible crear la cuenta.');
    }

    if (!data.user) {
      throw new AuthException('No fue posible completar el registro.');
    }

    const userModel = UserModel.fromJson({
      id: data.user.id,
      email: data.user.email,
      fullName: fullName?.trim() || data.user.email?.split('@')[0] || 'Usuario',
      phone: phone?.trim() || undefined,
      role: 'owner',
      createdAt: data.user.created_at,
      isSuperAdmin: false,
    });

    return {
      user: userModel,
      token: data.session?.access_token || '',
      expiresAt: data.session?.expires_at,
    };
  }

  async signOut(): Promise<void> {
    logger.info('Cerrando sesión en Supabase Auth');
    const client = this.supabase;
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        logger.warning('Aviso al cerrar sesión en Supabase:', error.message);
      }
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    logger.info('Solicitando reseteo de contraseña en Supabase Auth...', { email });
    const client = this.ensureClient();

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/update-password`
      : undefined;

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      logger.warning('Error en resetPasswordForEmail:', error.message);
      throw new AuthException(error.message || 'No se pudo enviar el correo de recuperación.');
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    logger.info('Actualizando contraseña de usuario en Supabase Auth');
    const client = this.ensureClient();

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      logger.warning('Error en updateUser password:', error.message);
      throw new AuthException(error.message || 'No fue posible actualizar la contraseña.');
    }
  }

  async getSession(): Promise<AuthSessionEntity | null> {
    const client = this.supabase;
    if (!client) return null;

    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.user) {
        return null;
      }

      const supaUser = data.session.user;
      const profile = await this.getProfile(supaUser.id);

      const userModel = UserModel.fromJson({
        id: supaUser.id,
        email: supaUser.email,
        fullName: profile?.fullName || supaUser.user_metadata?.full_name || supaUser.email?.split('@')[0] || 'Usuario',
        phone: profile?.phone || supaUser.user_metadata?.phone,
        avatarUrl: profile?.avatarUrl || supaUser.user_metadata?.avatar_url,
        role: profile?.role || (profile?.isSuperAdmin ? 'super_admin' : 'owner'),
        createdAt: supaUser.created_at,
        isSuperAdmin: profile?.isSuperAdmin || false,
      });

      return {
        user: userModel,
        token: data.session.access_token,
        expiresAt: data.session.expires_at,
      };
    } catch (err) {
      logger.warning('Error al obtener sesión de Supabase:', err);
      return null;
    }
  }

  async getUser(): Promise<UserModel | null> {
    const client = this.supabase;
    if (!client) return null;

    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) return null;

      const profile = await this.getProfile(data.user.id);
      return UserModel.fromJson({
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario',
        phone: profile?.phone || data.user.user_metadata?.phone,
        avatarUrl: profile?.avatarUrl || data.user.user_metadata?.avatar_url,
        role: profile?.role || (profile?.isSuperAdmin ? 'super_admin' : 'owner'),
        createdAt: data.user.created_at,
        isSuperAdmin: profile?.isSuperAdmin || false,
      });
    } catch {
      return null;
    }
  }

  async getProfile(userId: string): Promise<ProfileModel | null> {
    const client = this.supabase;
    if (!client || !userId) return null;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return ProfileModel.fromJson(data);
    } catch (err) {
      logger.warning('Aviso al consultar tabla profiles:', err);
      return null;
    }
  }

  async updateProfile(userId: string, updates: UpdateProfileParams): Promise<ProfileModel> {
    logger.info('Actualizando perfil de usuario en Supabase...', { userId });
    const client = this.ensureClient();

    const payload: Database['public']['Tables']['profiles']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone ? updates.phone.trim() : null;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { data, error } = await client
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      logger.error('Error al actualizar perfil en PostgreSQL:', error);
      throw new ServerException(error?.message || 'No se pudo guardar la actualización en la base de datos.');
    }

    return ProfileModel.fromJson(data);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    logger.info('Subiendo avatar a Supabase Storage...', { userId, name: file.name, size: file.size });
    const client = this.ensureClient();

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      logger.error('Error al subir a Supabase Storage:', uploadError.message);
      throw new ServerException(uploadError.message || 'No fue posible subir la imagen al servidor.');
    }

    const { data } = client.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new ServerException('No se pudo obtener la URL pública de la imagen.');
    }

    return data.publicUrl;
  }
}

