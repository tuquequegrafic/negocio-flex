/**
 * Negocio Flex - Auth Card Layout
 * Contenedor visual centrado para Splash, Login y Registro con estética Material Design 3.
 */

import React from 'react';
import { M3Card } from '../../../../core/widgets/M3Components';
import { ShieldCheck } from 'lucide-react';

export const AuthCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background ambient lights */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-600/30">
            NF
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            NEGOCIO FLEX
          </h1>
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
            Plataforma SaaS Multi-Empresa
          </p>
        </div>

        {/* Main Form Card */}
        <M3Card variant="elevated" className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-white/20">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          {children}

          {footer && (
            <div className="pt-3 border-t border-slate-100 text-center">
              {footer}
            </div>
          )}
        </M3Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aislamiento de datos con Row-Level Security (RLS)</span>
        </div>

      </div>
    </div>
  );
};
