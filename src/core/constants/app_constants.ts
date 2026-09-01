/**
 * Negocio Flex - Constantes Globales
 * Define rutas, claves de almacenamiento local y roles de sistema.
 */

export const APP_ROUTES = {
  SPLASH: '/splash',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  UPDATE_PASSWORD: '/update-password',
  HOME: '/home',
  PROFILE: '/profile',
  ORGANIZATION_SELECTOR: '/organizations',
  DASHBOARD: '/dashboard',
  CUSTOMIZER: '/customizer',
  PRODUCTS: '/products',
  SERVICES: '/services',
  ORDERS: '/orders',
  APPOINTMENTS: '/appointments',
  CUSTOMERS: '/customers',
  SETTINGS: '/settings',
  SUPER_ADMIN: '/admin',
  CLIENT_PORTAL: '/portal',
} as const;

export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'negocio_flex_auth_token',
  USER_SESSION: 'negocio_flex_user_session',
  CURRENT_ORG_ID: 'negocio_flex_active_org_id',
  THEME_MODE: 'negocio_flex_theme_mode',
  OFFLINE_CACHE: 'negocio_flex_offline_cache',
  PASSWORD_RECOVERY_EMAIL: 'negocio_flex_pwd_recovery_email',
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PRODUCTS: 'products',
  BRANDING: 'branding',
} as const;

export const APP_DEFAULTS = {
  CURRENCY: 'S/',
  LOCALE: 'es-PE',
  TIMEZONE: 'America/Lima',
  SESSION_TIMEOUT_MINUTES: 120,
} as const;
