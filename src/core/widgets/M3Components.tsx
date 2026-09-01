/**
 * Negocio Flex - Componentes Base Material Design 3
 * Reutilizables, con soporte de accesibilidad, variantes M3 y gestión de estados.
 */

import React from 'react';
import { M3_SHAPES, M3_ELEVATIONS, M3_TYPOGRAPHY } from '../theme/material3_theme';

// ==========================================
// 1. M3 BUTTON
// ==========================================
export interface M3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const M3Button: React.FC<M3ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-base gap-2.5 min-h-[48px]',
  }[size];

  const variantClasses = {
    filled: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:bg-indigo-800',
    tonal: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 active:bg-indigo-200',
    outlined: 'border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    text: 'text-indigo-600 hover:bg-indigo-50/50 active:bg-indigo-100',
    elevated: 'bg-white hover:bg-slate-50 text-slate-800 shadow-sm border border-slate-200/80',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold ${M3_SHAPES.medium} transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

// ==========================================
// 2. M3 CARD
// ==========================================
export interface M3CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
}

export const M3Card: React.FC<M3CardProps> = ({
  children,
  variant = 'outlined',
  className = '',
  ...props
}) => {
  const variantClasses = {
    elevated: `bg-white ${M3_ELEVATIONS.level2} border-transparent`,
    filled: 'bg-slate-50/80 border-transparent',
    outlined: 'bg-white border border-slate-200/80 shadow-2xs',
  }[variant];

  return (
    <div
      className={`${M3_SHAPES.large} p-6 ${variantClasses} transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 3. M3 TEXT FIELD (INPUT)
// ==========================================
export interface M3TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const M3TextField: React.FC<M3TextFieldProps> = ({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `m3-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          className={`w-full text-sm ${M3_SHAPES.medium} border bg-white py-2.5 transition-colors focus:outline-none focus:ring-2 ${
            leadingIcon ? 'pl-9' : 'pl-3.5'
          } ${trailingIcon ? 'pr-9' : 'pr-3.5'} ${
            error
              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20 text-red-900'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20 text-slate-900'
          } ${className}`}
          {...props}
        />

        {trailingIcon && (
          <span className="absolute right-3 text-slate-400 flex items-center">
            {trailingIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

// ==========================================
// 4. M3 BADGE
// ==========================================
export interface M3BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const M3Badge: React.FC<M3BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const variantClasses = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    secondary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-md border ${sizeClasses} ${variantClasses}`}
    >
      {label}
    </span>
  );
};
