/**
 * Negocio Flex - Avatar Picker Widget (Fase 3)
 * Componente interactivo para selección, validación y subida de avatar a Supabase Storage.
 */

import React, { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AvatarValidator } from '../../../../core/validators/app_validators';

interface AvatarPickerProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarSelected: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatarUrl,
  userName,
  onAvatarSelected,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validationError = AvatarValidator.validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      await onAvatarSelected(file);
    } catch (err: any) {
      setErrorMessage('No fue posible subir el avatar. Intenta nuevamente.');
    }
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col items-center space-y-2.5">
      <div className="relative group">
        {/* Avatar Circle */}
        <div className="w-24 h-24 rounded-full ring-4 ring-indigo-50 overflow-hidden bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-3xl font-black shadow-md">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={userName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Overlay button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
          title="Cambiar foto de perfil"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Cambiar</span>
            </>
          )}
        </button>

        {/* Small floating badge */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-2 border-white transition-colors cursor-pointer"
          title="Subir foto"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="text-center space-y-0.5">
        <span className="text-xs font-bold text-slate-700 block">Foto de Perfil</span>
        <span className="text-[11px] text-slate-400 block">JPG, PNG o WebP (máx. 3 MB)</span>
      </div>

      {errorMessage && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 text-[11px] text-red-700 max-w-xs animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
