/**
 * Negocio Flex - Login Page (Fase 3)
 * Pantalla de inicio de sesión con validación centralizada, feedback amigable y estética Material Design 3.
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AuthCard } from '../widgets/AuthCard';
import { M3Button, M3TextField } from '../../../../core/widgets/M3Components';
import { EmailValidator, PasswordValidator } from '../../../../core/validators/app_validators';
import { Mail, Lock, LogIn, AlertCircle, KeyRound, UserCheck } from 'lucide-react';

export interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
}) => {
  const { login, status, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const isLoading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    clearError();

    const errors: { email?: string; password?: string } = {};

    const emailErr = EmailValidator.validate(email);
    if (emailErr) errors.email = emailErr;

    const passErr = PasswordValidator.validate(password, 4);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const success = await login(email, password);
    if (success) {
      onLoginSuccess();
    }
  };

  const handleQuickDemo = async (role: 'owner' | 'admin') => {
    if (isLoading) return;
    const demoEmail = role === 'admin' ? 'superadmin@negocioflex.pe' : 'dueno@negocioflex.pe';
    setEmail(demoEmail);
    setPassword('demo1234');
    const success = await login(demoEmail, 'demo1234');
    if (success) {
      onLoginSuccess();
    }
  };

  return (
    <AuthCard
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta de Negocio Flex"
      footer={
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            ¿No tienes una cuenta aún?{' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={onNavigateToRegister}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer disabled:opacity-50"
            >
              Crear una cuenta
            </button>
          </p>

          {/* Quick Demo Credentials */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Acceso Rápido de Prueba (Demo)
            </span>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo('owner')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                👤 Usuario / Dueño
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo('admin')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                🛡️ Administrador
              </button>
            </div>
          </div>
        </div>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <M3TextField
          label="Correo Electrónico"
          type="email"
          required
          disabled={isLoading}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ejemplo@negocio.pe"
          leadingIcon={<Mail className="w-4 h-4" />}
          error={formErrors.email}
        />

        <div>
          <M3TextField
            label="Contraseña"
            type="password"
            required
            disabled={isLoading}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            leadingIcon={<Lock className="w-4 h-4" />}
            error={formErrors.password}
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onNavigateToForgotPassword}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer disabled:opacity-50"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <M3Button
          type="submit"
          variant="filled"
          size="md"
          className="w-full mt-2"
          disabled={isLoading}
          isLoading={isLoading}
          icon={<LogIn className="w-4 h-4" />}
        >
          Iniciar Sesión
        </M3Button>
      </form>
    </AuthCard>
  );
};
