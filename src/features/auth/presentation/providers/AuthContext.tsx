/**
 * Negocio Flex - Auth State Provider
 * Gestiona el ciclo de vida de autenticación: initial, loading, authenticated, unauthenticated, error.
 * Maneja sesión, perfil sincronizado, reseteo de contraseña y subida de avatar.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { UserEntity, AuthSessionEntity } from '../../domain/entities/user_entity';
import { ProfileEntity, UpdateProfileParams } from '../../domain/entities/profile_entity';
import { AuthRepositoryImpl } from '../../data/repositories/auth_repository_impl';
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
import { normalizeError } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  status: AuthStatus;
  user: UserEntity | null;
  profile: ProfileEntity | null;
  token: string | null;
  error: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, password?: string, fullName?: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (updates: UpdateProfileParams) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  clearError: () => void;
  checkSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [user, setUser] = useState<UserEntity | null>(null);
  const [profile, setProfile] = useState<ProfileEntity | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const checkSession = useCallback(async () => {
    try {
      setStatus('loading');
      const session = await getSessionUseCase.execute();
      if (session) {
        setUser(session.user);
        setToken(session.token);
        setStatus('authenticated');
        logger.info('Sesión restaurada para:', { email: session.user.email });

        // Cargar perfil
        const p = await getProfileUseCase.execute(session.user.id);
        if (p) setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
        setToken(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      logger.warning('No hay sesión previa guardada');
      setUser(null);
      setProfile(null);
      setToken(null);
      setStatus('unauthenticated');
    }
  }, [getSessionUseCase, getProfileUseCase]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      setStatus('loading');
      setError(null);
      const session = await signInUseCase.execute({ email, password });
      setUser(session.user);
      setToken(session.token);
      setStatus('authenticated');

      const p = await getProfileUseCase.execute(session.user.id);
      if (p) setProfile(p);

      return true;
    } catch (err: any) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      setStatus('unauthenticated');
      logger.error('Fallo de inicio de sesión:', normalized.technicalDetails);
      return false;
    }
  };

  const register = async (
    email: string,
    password?: string,
    fullName?: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      setStatus('loading');
      setError(null);
      const session = await signUpUseCase.execute({
        email,
        password,
        fullName: fullName || '',
        phone,
      });
      setUser(session.user);
      setToken(session.token);
      setStatus('authenticated');

      const p = await getProfileUseCase.execute(session.user.id);
      if (p) setProfile(p);

      return true;
    } catch (err: any) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      setStatus('unauthenticated');
      logger.error('Fallo de registro:', normalized.technicalDetails);
      return false;
    }
  };

  const logout = async () => {
    try {
      setStatus('loading');
      await signOutUseCase.execute();
    } finally {
      setUser(null);
      setProfile(null);
      setToken(null);
      setStatus('unauthenticated');
      setError(null);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      await sendPasswordResetUseCase.execute({ email });
      return true;
    } catch (err: any) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return false;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      setError(null);
      await updatePasswordUseCase.execute({ newPassword });
      return true;
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      const normalized = normalizeError(err);
      setError(normalized.userMessage);
      return null;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        profile,
        token,
        error,
        login,
        register,
        logout,
        sendPasswordReset,
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
