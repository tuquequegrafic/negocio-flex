/**
 * Negocio Flex - Sistema de Logging Centralizado
 * Proporciona niveles DEBUG, INFO, WARNING, ERROR.
 * IMPORTANTE: Nunca imprime contraseñas, tokens JWT, secret keys ni credenciales sensibles.
 */

import { APP_CONFIG } from '../config/app_config';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

const SENSITIVE_KEYS = [
  'password',
  'contraseña',
  'token',
  'jwt',
  'secret',
  'anonkey',
  'service_role',
  'apikey',
  'auth',
  'authorization',
  'credit_card',
  'tarjeta',
];

/**
 * Sanitiza recursivamente objetos y strings para eliminar posibles secretos.
 */
function sanitizeData(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    // Mask potential JWT tokens
    if (/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(data) && data.length > 30) {
      return '[REDACTED_JWT_TOKEN]';
    }
    return data;
  }
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sens => lowerKey.includes(sens));
      cleanObj[key] = isSensitive ? '[PROTECTED_VALUE]' : sanitizeData(data[key]);
    }
    return cleanObj;
  }
  return data;
}

class AppLogger {
  private isEnabled = APP_CONFIG.features.enableLogging;

  debug(message: string, context?: any): void {
    if (!this.isEnabled) return;
    console.debug(`%c[DEBUG] [NegocioFlex] ${message}`, 'color: #64748B; font-weight: bold;', context ? sanitizeData(context) : '');
  }

  info(message: string, context?: any): void {
    if (!this.isEnabled) return;
    console.info(`%c[INFO] [NegocioFlex] ${message}`, 'color: #2563EB; font-weight: bold;', context ? sanitizeData(context) : '');
  }

  warning(message: string, context?: any): void {
    console.warn(`%c[WARN] [NegocioFlex] ${message}`, 'color: #D97706; font-weight: bold;', context ? sanitizeData(context) : '');
  }

  error(message: string, error?: any): void {
    console.error(`%c[ERROR] [NegocioFlex] ${message}`, 'color: #DC2626; font-weight: bold;', error ? sanitizeData(error) : '');
  }
}

export const logger = new AppLogger();
