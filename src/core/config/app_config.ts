/**
 * Negocio Flex - Configuración Central de la Aplicación
 * Centraliza variables de entorno, entorno de ejecución y metadatos de la plataforma.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  readonly appName: string;
  readonly technicalId: string;
  readonly version: string;
  readonly environment: AppEnvironment;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly supabase: {
    readonly url: string;
    readonly anonKey: string;
    readonly isConfigured: boolean;
  };
  readonly features: {
    readonly enableLogging: boolean;
    readonly offlineFallback: boolean;
  };
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env[key] as string) || defaultValue;
  }
  return defaultValue;
};

const isValidSupabaseConfig = (url?: string, anonKey?: string): boolean => {
  if (!url || !anonKey) return false;
  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();
  if (
    !trimmedUrl ||
    !trimmedKey ||
    trimmedUrl.includes('your-project') ||
    trimmedUrl.includes('example') ||
    trimmedUrl.includes('dummy') ||
    trimmedUrl === 'https://' ||
    trimmedUrl.length < 10 ||
    trimmedKey.includes('example-anon-key') ||
    trimmedKey.includes('dummy') ||
    trimmedKey.length < 20
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmedUrl);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 3;
  } catch {
    return false;
  }
};

const currentEnv = (getEnvVar('VITE_APP_ENV', 'development') as AppEnvironment);
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

export const APP_CONFIG: AppConfig = {
  appName: 'Negocio Flex',
  technicalId: 'negocio_flex',
  version: '1.0.0',
  environment: currentEnv,
  isDevelopment: currentEnv === 'development',
  isProduction: currentEnv === 'production',
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: isValidSupabaseConfig(supabaseUrl, supabaseAnonKey),
  },
  features: {
    enableLogging: currentEnv !== 'production',
    offlineFallback: true,
  },
};
