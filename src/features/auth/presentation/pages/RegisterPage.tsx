/**
 * Negocio Flex - Register Page / Sign Up (Fase 3)
 * Registro de nuevos usuarios con confirmación de contraseña, validaciones centralizadas y mensajes amigables.
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AuthCard } from '../widgets/AuthCard';
import { M3Button, M3TextField } from '../../../../core/widgets/M3Components';
import {
  EmailValidator,
  PasswordValidator,
  RequiredValidator,
  PhoneValidator,
} from '../../../../core/validators/app_validators';
import { Mail, Lock, User, Phone, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { register, status, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const isLoading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    clearError();

    const errors: {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const nameErr = RequiredValidator.validate(fullName, 'El nombre completo');
    if (nameErr) errors.fullName = nameErr;

    const emailErr = EmailValidator.validate(email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = PhoneValidator.validate(phone);
    if (phoneErr) errors.phone = phoneErr;

    const passErr = PasswordValidator.validate(password, 6);
    if (passErr) errors.password = passErr;

    const matchErr = PasswordValidator.validateMatch(password, confirmPassword);
    if (matchErr) errors.confirmPassword = matchErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const success = await register(email, password, fullName, phone);
    if (success) {
      onRegisterSuccess();
    }
  };

  return (
    <AuthCard
      title="Crear Cuenta en Negocio Flex"
      subtitle="Regístrate para comenzar a gestionar tu negocio de forma inteligente"
      footer={
        <p className="text-xs text-slate-500">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            disabled={isLoading}
            onClick={onNavigateToLogin}
            className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer disabled:opacity-50"
          >
            Inicia sesión aquí
          </button>
        </p>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <M3TextField
          label="Nombre Completo"
          type="text"
          required
          disabled={isLoading}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Ej: Carlos Mendoza"
          leadingIcon={<User className="w-4 h-4" />}
          error={formErrors.fullName}
        />

        <M3TextField
          label="Correo Electrónico"
          type="email"
          required
          disabled={isLoading}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="carlos@negocio.pe"
          leadingIcon={<Mail className="w-4 h-4" />}
          error={formErrors.email}
        />

        <M3TextField
          label="Teléfono / Celular (Opcional)"
          type="tel"
          disabled={isLoading}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+51 987 654 321"
          leadingIcon={<Phone className="w-4 h-4" />}
          error={formErrors.phone}
        />

        <M3TextField
          label="Contraseña"
          type="password"
          required
          disabled={isLoading}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          leadingIcon={<Lock className="w-4 h-4" />}
          error={formErrors.password}
        />

        <M3TextField
          label="Confirmar Contraseña"
          type="password"
          required
          disabled={isLoading}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Repite tu contraseña"
          leadingIcon={<Lock className="w-4 h-4" />}
          error={formErrors.confirmPassword}
        />

        <M3Button
          type="submit"
          variant="filled"
          size="md"
          className="w-full mt-2"
          disabled={isLoading}
          isLoading={isLoading}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Crear mi Cuenta
        </M3Button>
      </form>
    </AuthCard>
  );
};
