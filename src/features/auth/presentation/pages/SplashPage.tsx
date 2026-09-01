/**
 * Negocio Flex - Splash Screen
 * Comprueba:
 * 1. Inicialización de la app
 * 2. Disponibilidad y estado de Supabase
 * 3. Estado de autenticación
 * Luego redirige automáticamente a Login o al área correspondiente.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthContext';
import { supabaseService } from '../../../../core/network/supabase_client';
import { APP_CONFIG } from '../../../../core/config/app_config';
import { CheckCircle2, Loader2, Sparkles, Server } from 'lucide-react';

export interface SplashPageProps {
  onComplete: (isAuthenticated: boolean) => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
  const { status, checkSession } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Verificando servicios...');
  const [stepProgress, setStepProgress] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    const runStartupChecks = async () => {
      // Paso 1: Configuración base
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;
      setStepProgress(2);
      setSupabaseStatus('Comprobando conexión con base de datos...');

      // Paso 2: Supabase Health Check
      const health = await supabaseService.checkHealth();
      if (!isMounted) return;
      setSupabaseStatus(health.message);
      setStepProgress(3);

      // Paso 3: Verificar sesión
      await checkSession();
      await new Promise(resolve => setTimeout(resolve, 600));

      if (!isMounted) return;
      onComplete(status === 'authenticated');
    };

    runStartupChecks();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-8">
        
        {/* Logo / App Symbol */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-500/40 animate-pulse">
            NF
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white">
            NEGOCIO FLEX
          </h1>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            v{APP_CONFIG.version} • {APP_CONFIG.environment.toUpperCase()}
          </p>
        </div>

        {/* Diagnostic Status Box */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs shadow-xl">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" /> Diagnóstico Inicial
            </span>
            <span className="font-mono text-[10px] text-indigo-400 font-bold">{stepProgress}/3</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300">
              {stepProgress > 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              )}
              <span>Configuración del núcleo cargada</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              {stepProgress > 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : stepProgress === 2 ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className="truncate">{supabaseStatus}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              {stepProgress >= 3 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
              )}
              <span>Estado de autenticación validado</span>
            </div>
          </div>
        </div>

        {/* Bottom loading bar */}
        <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-pulse rounded-full w-2/3" />
        </div>

      </div>
    </div>
  );
};
