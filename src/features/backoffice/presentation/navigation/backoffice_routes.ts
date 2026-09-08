/**
 * Negocio Flex - Backoffice Central Route Registry (Fase 9)
 * Única Fuente de Verdad para las vistas administrativas, RBAC,
 * módulos requeridos, categorización visual y metadatos.
 */

import { BackofficeRouteConfig } from '../../domain/entities/backoffice_view_entity';

export const BACKOFFICE_ROUTES: readonly BackofficeRouteConfig[] = [
  // ─── OPERACIÓN (Núcleo de Gestión Diaria) ──────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard & Métricas',
    shortLabel: 'Dashboard',
    category: 'OPERACION',
    iconName: 'LayoutDashboard',
    description: 'Resumen ejecutivo, ventas, pedidos y atajos rápidos del negocio.',
  },
  {
    id: 'pos',
    label: 'Punto de Venta (POS) & Cajas',
    shortLabel: 'POS & Caja',
    category: 'OPERACION',
    iconName: 'Receipt',
    description: 'Ventas en mostrador, arqueo de caja, pagos en efectivo/digitales y tickets.',
  },
  {
    id: 'orders',
    label: 'Pedidos & Despacho',
    shortLabel: 'Pedidos',
    category: 'OPERACION',
    iconName: 'Truck',
    requiredModule: 'orders',
    description: 'Gestión y despacho de órdenes online, delivery y WhatsApp.',
  },
  {
    id: 'appointments',
    label: 'Reservas & Agenda',
    shortLabel: 'Reservas',
    category: 'OPERACION',
    iconName: 'Calendar',
    requiredModule: 'appointments',
    description: 'Control de citas presenciales, horarios y asignación de personal.',
  },
  {
    id: 'products',
    label: 'Catálogo de Productos',
    shortLabel: 'Productos',
    category: 'OPERACION',
    iconName: 'ShoppingBag',
    requiredModule: 'products',
    description: 'Gestión de inventario, precios, promociones e imágenes de productos.',
  },
  {
    id: 'categories',
    label: 'Categorías',
    shortLabel: 'Categorías',
    category: 'OPERACION',
    iconName: 'Layers',
    description: 'Organización taxonómica para productos y servicios.',
  },
  {
    id: 'services',
    label: 'Servicios & Tarifas',
    shortLabel: 'Servicios',
    category: 'OPERACION',
    iconName: 'Sparkles',
    requiredModule: 'services',
    description: 'Catálogo de servicios prestados, duraciones y costos.',
  },
  {
    id: 'customers',
    label: 'Clientes & CRM (360°)',
    shortLabel: 'Clientes',
    category: 'OPERACION',
    iconName: 'Users',
    description: 'Perfiles 360°, segmentación VIP, historial de compras y notas.',
  },

  // ─── CONFIGURACIÓN & NEGOCIO ──────────────────────────────────────────
  {
    id: 'customizer',
    label: 'Personalizar Marca & App',
    shortLabel: 'Marca',
    category: 'CONFIGURACION',
    iconName: 'Palette',
    requiredRoles: ['owner', 'admin', 'super_admin'],
    requiredPermission: 'configure_settings',
    description: 'Personalización visual, colores corporativos, logo y banners.',
  },
  {
    id: 'business_info',
    label: 'Información del Negocio',
    shortLabel: 'Datos Negocio',
    category: 'CONFIGURACION',
    iconName: 'Building2',
    requiredRoles: ['owner', 'admin', 'super_admin'],
    requiredPermission: 'edit_business_info',
    description: 'Nombre comercial, rubro, slug URL, teléfono y dirección.',
  },
  {
    id: 'business_members',
    label: 'Miembros & Permisos',
    shortLabel: 'Equipo',
    category: 'CONFIGURACION',
    iconName: 'UserCheck',
    requiredRoles: ['owner', 'admin', 'super_admin'],
    requiredPermission: 'manage_members',
    description: 'Gestión de colaboradores, asignación de roles (Owner, Admin, Staff).',
  },

  // ─── MONETIZACIÓN & SAAS ──────────────────────────────────────────────
  {
    id: 'subscription',
    label: 'Mi Plan y Facturación',
    shortLabel: 'Suscripción',
    category: 'SAAS',
    iconName: 'CreditCard',
    requiredRoles: ['owner', 'admin', 'super_admin'],
    description: 'Estado de suscripción SaaS, límites de uso y métodos de pago.',
  },
  {
    id: 'pricing',
    label: 'Ver Planes y Precios',
    shortLabel: 'Planes',
    category: 'SAAS',
    iconName: 'Tag',
    description: 'Comparador de planes Inicial, Profesional y Empresarial.',
  },
  {
    id: 'landing',
    label: 'Landing Page SaaS',
    shortLabel: 'Landing SaaS',
    category: 'SAAS',
    iconName: 'Globe',
    description: 'Página de presentación institucional de la plataforma Negocio Flex.',
  },

  // ─── HERRAMIENTAS & UTILIDADES ────────────────────────────────────────
  {
    id: 'gallery',
    label: 'Galería de Imágenes',
    shortLabel: 'Galería',
    category: 'HERRAMIENTAS',
    iconName: 'ImageIcon',
    description: 'Biblioteca multimedia de fotografías del local y trabajos.',
  },
  {
    id: 'test_center',
    label: 'Suite QA & Auditoría',
    shortLabel: 'Test Center',
    category: 'HERRAMIENTAS',
    iconName: 'Zap',
    requiredRoles: ['owner', 'admin', 'super_admin'],
    description: 'Centro de pruebas automáticas, simulador de eventos y salud del sistema.',
  },

  // ─── ADMINISTRACIÓN GLOBAL (Aislado estrictamente para SuperAdmin) ────
  {
    id: 'super_admin',
    label: 'Panel Global Super Admin',
    shortLabel: 'Super Admin',
    category: 'GLOBAL',
    iconName: 'ShieldCheck',
    isSuperAdminOnly: true,
    requiredRoles: ['super_admin'],
    description: 'Control de toda la plataforma SaaS: aprobación de tenants, webhooks y métricas.',
  },
] as const;

export const CATEGORY_METADATA = {
  OPERACION: {
    label: 'Operación Diaria',
    order: 1,
  },
  CONFIGURACION: {
    label: 'Configuración & Empresa',
    order: 2,
  },
  SAAS: {
    label: 'SaaS & Facturación',
    order: 3,
  },
  HERRAMIENTAS: {
    label: 'Herramientas',
    order: 4,
  },
  GLOBAL: {
    label: 'Plataforma Global',
    order: 5,
  },
} as const;

export function getRouteConfig(viewId: string): BackofficeRouteConfig | undefined {
  return BACKOFFICE_ROUTES.find(r => r.id === viewId);
}
