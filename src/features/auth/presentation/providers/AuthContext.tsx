/**
 * Negocio Flex - Auth State Provider
 * Fuente única de verdad para el ciclo de vida de autenticación e identidad del usuario.
 * Integra `supabase.auth.onAuthStateChange` y sincroniza sesión y perfiles.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { UserEntity, AuthSessionEntity } from '../../domain/entities/user_entity';
import { ProfileEntity, UpdateProfileParams } from '../../domain/entities/profile_entity';
import { AuthRepositoryImpl } from '../../data/repositories/auth_repository_impl';
import { UserModel } from '../../data/models/user_model';
import {
  SignInUseCase,
  SignUpUseCase,
  SignOutUseCase,
  GetCurrentSessionUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
  SendPasswordResetUseCase,
  UpdatePasswordUseCase,
  UploadAvatarUseCase,
} from '../../domain/usecases/auth_usecases';
import { supabaseService, supabase } from '../../../../core/network/supabase_client';
import { normalizeError } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';
import { STORAGE_KEYS } from '../../../../core/constants/app_constants';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  readonly status: AuthStatus;
  readonly loading: boolean;
  readonly isAuthenticated: boolean;
  readonly user: UserEntity | null;
  readonly session: AuthSessionEntity | null;
  readonly profile: ProfileEntity | null;
  readonly token: string | null;
  readonly error: string | null;
  readonly isPasswordRecovery: boolean;
  setIsPasswordRecovery: (isRecovery: boolean) => void;
  signIn: (email: string, password?: string) => Promise<boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password?: string, fullName?: string, phone?: string) => Promise<boolean>;
  register: (email: string, password?: string, fullName?: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (updates: UpdateProfileParams) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  clearError: () => void;
  checkSession: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [user, setUser] = useState<UserEntity | null>(null);
  const [session, setSession] = useState<AuthSessionEntity | null>(null);
  const [profile, setProfile] = useState<ProfileEntity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  const authRepo = useMemo(() => new AuthRepositoryImpl(), []);
  const signInUseCase = useMemo(() => new SignInUseCase(authRepo), [authRepo]);
  const signUpUseCase = useMemo(() => new SignUpUseCase(authRepo), [authRepo]);
  const signOutUseCase = useMemo(() => new SignOutUseCase(authRepo), [authRepo]);
  const getSessionUseCase = useMemo(() => new GetCurrentSessionUseCase(authRepo), [authRepo]);
  const getProfileUseCase = useMemo(() => new GetProfileUseCase(authRepo), [authRepo]);
  const updateProfileUseCase = useMemo(() => new UpdateProfileUseCase(authRepo), [authRepo]);
  const sendPasswordResetUseCase = useMemo(() => new SendPasswordResetUseCase(authRepo), [authRepo]);
  const updatePasswordUseCase = useMemo(() => new UpdatePasswordUseCase(authRepo), [authRepo]);
  const uploadAvatarUseCase = useMemo(() => new UploadAvatarUseCase(authRepo), [authRepo]);

  const isInitializedRef = useRef<boolean>(false);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const p = await getProfileUseCase.execute(user.id);
      if (p) {
        setProfile(p);
      }
    } catch (err) {
      logger.warning('No se pudo refrescar el perfil:', err);
    }
  }, [user?.id, getProfileUseCase]);

  /**
   * Sincroniza la sesión y perfil desde Supabase Auth
   */
  const syncUserFromSupabase = useCallback(
    async (supaUser: SupabaseUser, supaSession?: SupabaseSession | null) => {
      try {
        const p = await getProfileUseCase.execute(supaUser.id);
        if (p) setProfile(p);

        const userModel = UserModel.fromJson({
          id: supaUser.id,
          email: supaUser.email,
          fullName: p?.fullName || (supaUser.user_metadata?.full_name as string) || supaUser.email?.split('@')[0] || 'Usuario',
          phone: p?.phone || (supaUser.user_metadata?.phone as string),
          avatarUrl: p?.avatarUrl || (supaUser.user_metadata?.avatar_url as string),
          role: p?.role || (p?.isSuperAdmin ? 'super_admin' : 'owner'),
          createdAt: supaUser.created_at,
          isSuperAdmin: p?.isSuperAdmin || false,
        });

        const activeSession: AuthSessionEntity = {
          user: userModel,
          token: supaSession?.access_token || '',
          expiresAt: supaSession?.expires_at,
        };

        setUser(userModel);
        setSession(activeSession);
        setStatus('authenticated');
        setError(null);
      } catch (err: unknown) {
        logger.warning('Error al sincronizar datos del usuario:', err);
      }
    },
    [getProfileUseCase]
  );

  /**
   * Comprueba la sesión activa de Supabase
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      setStatus('loading');
      const activeSession = await getSessionUseCase.execute();
      if (activeSession && activeSession.user) {
        setUser(activeSession.user);
        setSession(activeSession);
        setStatus('authenticated');
        setError(null);
        logger.info('Sesión activa detectada en Supabase Auth para:', { email: activeSession.user.email });

        // Cargar perfil en segundo plano
        getProfileUseCase.execute(activeSession.user.id).then(p => {
          if (p) setProfile(p);
        });

        return true;
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setStatus('unauthenticated');
        return false;
      }
    } catch (err) {
      logger.info('No hay sesión de Supabase activa');
      setUser(null);
      setSession(null);
      setProfile(null);
      setStatus('unauthenticated');
      return false;
    }
  }, [getSessionUseCase, getProfileUseCase]);

  /**
   * Suscripción a eventos en tiempo real de Supabase Auth
   */
  useEffect(() => {
    const supabaseClient = supabaseService.getClient();

    // 1. Carga inicial
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      checkSession();
    }

    // 2. Suscribirse a onAuthStateChange si Supabase está disponible
    if (!supabaseClient) {
      return;
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, newSession) => {
      logger.info('Evento Supabase Auth detectado:', event);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (newSession?.user) {
            await syncUserFromSupabase(newSession.user, newSession);
          }
          break;

        case 'PASSWORD_RECOVERY':
          setIsPasswordRecovery(true);
          if (newSession?.user) {
            await syncUserFromSupabase(newSession.user, newSession);
          }
          break;

        case 'SIGNED_OUT':
          setUser(null);
          setSession(null);
          setProfile(null);
          setStatus('unauthenticated');
          setIsPasswordRecovery(false);
          setError(null);
          break;

        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, syncUserFromSupabase]);

  // Operaciones de autenticación
  const signIn = async (email: string, password?: string): Promise<boolean> => {
    try {
      setStatus('loading');
      setError(null);
      const newSession = await signInUseCase.execute({ email, password });
      setUser(newSession.user);
      setSession(newSession);
      setStatus('authenticated');

      const p = await getProfileUseCase.execute(newSession.user.id);
      if (p) setProfile(p);

      return true;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      setStatus('unauthenticated');
      logger.error('Fallo de inicio de sesión:', normalized.technicalDetails);
      return false;
    }
  };

  const signUp = async (
    email: string,
    password?: string,
    fullName?: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      setStatus('loading');
      setError(null);
      const newSession = await signUpUseCase.execute({
        email,
        password,
        fullName: fullName || '',
        phone,
      });
      setUser(newSession.user);
      setSession(newSession);
      setStatus('authenticated');

      const p = await getProfileUseCase.execute(newSession.user.id);
      if (p) setProfile(p);

      return true;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      setStatus('unauthenticated');
      logger.error('Fallo de registro:', normalized.technicalDetails);
      return false;
    }
  };

  const signOut = async () => {
    try {
      setStatus('loading');
      await signOutUseCase.execute();
      supabase.removeAllChannels();
    } catch (e) {
      logger.warning('Aviso durante signOutUseCase:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setStatus('unauthenticated');
      setIsPasswordRecovery(false);
      setError(null);

      // Limpieza exhaustiva de claves sensibles de localStorage (Paso 8 y 10)
      try {
        const sensitivePrefixes = [
          'sb-',
          'supabase',
          'negocio_flex_',
          'negocioflex_',
          'negocio_flex_active_org',
          'negocioflex_active_org',
          'negocioflex_current_org',
        ];
        const keysToRemove: string[] = [
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER_SESSION,
          STORAGE_KEYS.CURRENT_ORG_ID,
          STORAGE_KEYS.PASSWORD_RECOVERY_EMAIL,
          'negocioflex_current_org_id',
          'negocio_flex_active_org_id',
        ];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && sensitivePrefixes.some(p => key.startsWith(p))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => {
          try {
            localStorage.removeItem(k);
          } catch {
            // Ignorar errores individuales
          }
        });
      } catch {
        // Ignorar si el almacenamiento local está restringido
      }
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      await sendPasswordResetUseCase.execute({ email });
      return true;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return false;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      setError(null);
      await updatePasswordUseCase.execute({ newPassword });
      setIsPasswordRecovery(false);
      return true;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return false;
    }
  };

  const updateProfile = async (updates: UpdateProfileParams): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes iniciar sesión para editar tu perfil.');
      return false;
    }
    try {
      setError(null);
      const updated = await updateProfileUseCase.execute(user.id, updates);
      setProfile(updated);
      setUser(prev =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              phone: updated.phone,
              avatarUrl: updated.avatarUrl,
            }
          : null
      );
      return true;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      setError('Debes iniciar sesión para subir un avatar.');
      return null;
    }
    try {
      setError(null);
      const url = await uploadAvatarUseCase.execute(user.id, file);
      await updateProfile({ avatarUrl: url });
      return url;
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return null;
    }
  };

  const clearError = () => setError(null);

  // Derivados
  const loading = status === 'loading' || status === 'initial';
  const isAuthenticated = status === 'authenticated' && user !== null;
  const token = session?.token || null;

  return (
    <AuthContext.Provider
      value={{
        status,
        loading,
        isAuthenticated,
        user,
        session,
        profile,
        token,
        error,
        isPasswordRecovery,
        setIsPasswordRecovery,
        signIn,
        login: signIn,
        signUp,
        register: signUp,
        signOut,
        logout: signOut,
        resetPassword,
        sendPasswordReset: resetPassword,
        updatePassword,
        updateProfile,
        uploadAvatar,
        clearError,
        checkSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

