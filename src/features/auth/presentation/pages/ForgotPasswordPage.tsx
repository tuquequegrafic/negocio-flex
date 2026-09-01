/**
 * Negocio Flex - Forgot Password Page (Fase 3)
 * Solicita el correo y envía instrucciones de recuperación protegiendo la privacidad.
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AuthCard } from '../widgets/AuthCard';
import { M3Button, M3TextField } from '../../../../core/widgets/M3Components';
import { EmailValidator } from '../../../../core/validators/app_validators';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToUpdatePassword: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateToLogin,
  onNavigateToUpdatePassword,
}) => {
  const { sendPasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    clearError();

    const err = EmailValidator.validate(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setEmailError(undefined);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Recuperar Contraseña"
      subtitle="Te ayudamos a restablecer el acceso a tu cuenta"
      footer={
        <div className="space-y-2 text-center">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
          </button>
        </div>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isSent ? (
        <div className="space-y-4 text-center py-2 animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Instrucciones enviadas</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si existe una cuenta asociada a <strong>{email}</strong>, recibirás instrucciones para recuperar tu contraseña.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <M3Button
              variant="filled"
              size="md"
              className="w-full"
              onClick={onNavigateToUpdatePassword}
            >
              Ingresar Nueva Contraseña
            </M3Button>

            <M3Button
              variant="outlined"
              size="md"
              className="w-full"
              onClick={() => setIsSent(false)}
            >
              Reintentar con otro correo
            </M3Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Ingresa tu correo electrónico registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
          </p>

          <M3TextField
            label="Correo Electrónico"
            type="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ejemplo@negocio.pe"
            leadingIcon={<Mail className="w-4 h-4" />}
            error={emailError}
          />

          <M3Button
            type="submit"
            variant="filled"
            size="md"
            className="w-full mt-2"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
          >
            Enviar Instrucciones
          </M3Button>
        </form>
      )}
    </AuthCard>
  );
};
