/**
 * Negocio Flex - Sistema de Tema Material Design 3 (M3)
 * Define la paleta global del sistema Negocio Flex, tipografías, elevaciones y formas.
 * 
 * IMPORTANTE: Este tema pertenece al núcleo de Negocio Flex. La personalización
 * cromática dinámica por organización se aplica sobre los componentes de cara al cliente.
 */

export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
}

export const M3_LIGHT_SCHEME: M3ColorScheme = {
  primary: '#4F46E5', // Indigo 600
  onPrimary: '#FFFFFF',
  primaryContainer: '#EEF2FF', // Indigo 50
  onPrimaryContainer: '#312E81', // Indigo 900
  secondary: '#0D9488', // Teal 600
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F0FDFA', // Teal 50
  onSecondaryContainer: '#134E4A',
  tertiary: '#7C3AED', // Violet 600
  onTertiary: '#FFFFFF',
  background: '#F8FAFC', // Slate 50
  onBackground: '#0F172A', // Slate 900
  surface: '#FFFFFF',
  onSurface: '#1E293B', // Slate 800
  surfaceVariant: '#F1F5F9', // Slate 100
  onSurfaceVariant: '#64748B', // Slate 500
  outline: '#CBD5E1', // Slate 300
  outlineVariant: '#E2E8F0', // Slate 200
  error: '#DC2626', // Red 600
  onError: '#FFFFFF',
  errorContainer: '#FEF2F2', // Red 50
  onErrorContainer: '#991B1B', // Red 800
};

export const M3_SHAPES = {
  none: 'rounded-none',
  extraSmall: 'rounded-sm', // 4px
  small: 'rounded-md',      // 6px
  medium: 'rounded-xl',     // 12px
  large: 'rounded-2xl',     // 16px
  extraLarge: 'rounded-3xl',// 24px
  full: 'rounded-full',     // 9999px
} as const;

export const M3_ELEVATIONS = {
  level0: 'shadow-none',
  level1: 'shadow-xs',
  level2: 'shadow-sm',
  level3: 'shadow-md',
  level4: 'shadow-lg',
  level5: 'shadow-xl',
} as const;

export const M3_TYPOGRAPHY = {
  displayLarge: 'text-4xl font-black tracking-tight leading-tight',
  displayMedium: 'text-3xl font-extrabold tracking-tight',
  displaySmall: 'text-2xl font-bold tracking-tight',
  headlineMedium: 'text-xl font-bold tracking-tight',
  titleLarge: 'text-lg font-bold',
  titleMedium: 'text-base font-semibold',
  titleSmall: 'text-sm font-semibold',
  bodyLarge: 'text-base font-normal leading-relaxed',
  bodyMedium: 'text-sm font-normal leading-normal',
  bodySmall: 'text-xs font-normal text-slate-500',
  labelLarge: 'text-sm font-semibold tracking-wide',
  labelMedium: 'text-xs font-semibold uppercase tracking-wider',
  labelSmall: 'text-[10px] font-bold uppercase tracking-widest',
} as const;
