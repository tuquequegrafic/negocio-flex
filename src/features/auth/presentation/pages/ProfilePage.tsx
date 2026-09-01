/**
 * Negocio Flex - Profile Page / Mi Perfil (Fase 3)
 * Permite visualizar y editar el perfil personal del usuario: Avatar, Nombre y Teléfono.
 * El email permanece en modo solo lectura conforme a las directivas de seguridad.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthContext';
import { AvatarPicker } from '../widgets/AvatarPicker';
import { M3Card, M3Button, M3TextField, M3Badge } from '../../../../core/widgets/M3Components';
import {
  RequiredValidator,
  PhoneValidator,
} from '../../../../core/validators/app_validators';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';

export interface ProfilePageProps {
  onBackToHome: () => void;
  onNavigateToUpdatePassword?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToHome,
  onNavigateToUpdatePassword,
}) => {
  const { user, profile, updateProfile, uploadAvatar, refreshProfile, error, clearError } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || user?.phone || '');
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.fullName || user?.fullName || '');
      setPhone(profile?.phone || user?.phone || '');
    }
  }, [profile, user]);

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    clearError();
    setSaveSuccessMessage(null);
    try {
      const url = await uploadAvatar(file);
      if (url) {
        setSaveSuccessMessage('¡Foto de perfil actualizada con éxito!');
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    clearError();
    setSaveSuccessMessage(null);

    const errors: { fullName?: string; phone?: string } = {};

    const nameErr = RequiredValidator.validate(fullName, 'El nombre completo');
    if (nameErr) errors.fullName = nameErr;

    const phoneErr = PhoneValidator.validate(phone);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const success = await updateProfile({
        fullName,
        phone,
      });

      if (success) {
        setSaveSuccessMessage('¡Perfil actualizado con éxito!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Reciente';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Mi Perfil de Usuario
              </h1>
              <p className="text-xs text-slate-500">
                Información personal y credenciales de acceso
              </p>
            </div>
          </div>

          <M3Badge
            label={user?.role === 'super_admin' ? 'Super Admin' : 'Propietario / Dueño'}
            variant="primary"
            size="sm"
          />
        </div>

        {/* Notifications & Feedback */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Profile Card */}
        <M3Card variant="elevated" className="bg-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm border border-slate-200/80">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-100">
            <AvatarPicker
              currentAvatarUrl={profile?.avatarUrl || user?.avatarUrl}
              userName={fullName || 'Usuario'}
              onAvatarSelected={handleAvatarUpload}
              isLoading={isUploadingAvatar}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <M3TextField
              label="Nombre Completo"
              type="text"
              required
              disabled={isSaving}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Tu nombre y apellido"
              leadingIcon={<User className="w-4 h-4" />}
              error={formErrors.fullName}
            />

            {/* Email is read-only for security */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Correo Electrónico <span className="text-slate-400 font-normal">(Solo lectura)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={user?.email || 'usuario@negocio.pe'}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-9 pr-3 text-slate-500 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                El correo principal está vinculado a la autenticación de Supabase.
              </p>
            </div>

            <M3TextField
              label="Teléfono / WhatsApp"
              type="tel"
              disabled={isSaving}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+51 987 654 321"
              leadingIcon={<Phone className="w-4 h-4" />}
              error={formErrors.phone}
            />

            {/* Metadata info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Miembro desde:
                </span>
                <span className="font-semibold text-slate-800">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Seguridad RLS:
                </span>
                <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                  auth.uid() = id
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              {onNavigateToUpdatePassword && (
                <button
                  type="button"
                  onClick={onNavigateToUpdatePassword}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Cambiar Contraseña
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <M3Button
                  type="button"
                  variant="outlined"
                  onClick={onBackToHome}
                  disabled={isSaving}
                >
                  Cancelar
                </M3Button>

                <M3Button
                  type="submit"
                  variant="filled"
                  disabled={isSaving}
                  isLoading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Guardar Cambios
                </M3Button>
              </div>
            </div>

          </form>
        </M3Card>

      </div>
    </div>
  );
};
