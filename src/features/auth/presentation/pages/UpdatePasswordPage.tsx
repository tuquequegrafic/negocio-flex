/**
 * Negocio Flex - Update Password Page (Fase 3)
 * Permite ingresar una nueva contraseña validada con confirmación y retroalimentación positiva.
 */

import React, { useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AuthCard } from '../widgets/AuthCard';
import { M3Button, M3TextField } from '../../../../core/widgets/M3Components';
import { PasswordValidator } from '../../../../core/validators/app_validators';
import { Lock, CheckCircle2, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

export interface UpdatePasswordPageProps {
  onNavigateToLogin: () => void;
  onUpdateSuccess: () => void;
}

export const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({
  onNavigateToLogin,
  onUpdateSuccess,
}) => {
  const { updatePassword, error, clearError } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    clearError();

    const errors: { newPassword?: string; confirmPassword?: string } = {};

    const passErr = PasswordValidator.validate(newPassword, 6);
    if (passErr) errors.newPassword = passErr;

    const matchErr = PasswordValidator.validateMatch(newPassword, confirmPassword);
    if (matchErr) errors.confirmPassword = matchErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const ok = await updatePassword(newPassword);
      if (ok) {
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Nueva Contraseña"
      subtitle="Establece una contraseña segura para tu cuenta"
      footer={
        <div className="text-center">
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

      {isSuccess ? (
        <div className="space-y-4 text-center py-3 animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">¡Contraseña Actualizada!</h3>
            <p className="text-xs text-slate-600">
              Tu contraseña ha sido modificada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
            </p>
          </div>

          <M3Button
            variant="filled"
            size="md"
            className="w-full mt-2"
            onClick={onUpdateSuccess}
          >
            Continuar
          </M3Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <M3TextField
            label="Nueva Contraseña"
            type="password"
            required
            disabled={isSubmitting}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            leadingIcon={<Lock className="w-4 h-4" />}
            error={formErrors.newPassword}
          />

          <M3TextField
            label="Confirmar Nueva Contraseña"
            type="password"
            required
            disabled={isSubmitting}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite tu nueva contraseña"
            leadingIcon={<Lock className="w-4 h-4" />}
            error={formErrors.confirmPassword}
          />

          <M3Button
            type="submit"
            variant="filled"
            size="md"
            className="w-full mt-2"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            icon={<KeyRound className="w-4 h-4" />}
          >
            Guardar Nueva Contraseña
          </M3Button>
        </form>
      )}
    </AuthCard>
  );
};
