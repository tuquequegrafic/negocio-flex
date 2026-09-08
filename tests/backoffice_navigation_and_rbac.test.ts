/**
 * Negocio Flex - Tests de Fase 9: Backoffice Central, RBAC Zero Trust y Orquestación
 */

import { describe, it, expect } from 'vitest';
import { CanAccessViewUseCase } from '../src/features/backoffice/domain/usecases/can_access_view_usecase';
import { GetAuthorizedNavigationItemsUseCase } from '../src/features/backoffice/domain/usecases/get_authorized_navigation_items_usecase';
import { BACKOFFICE_ROUTES } from '../src/features/backoffice/presentation/navigation/backoffice_routes';
import { BackofficeRole } from '../src/features/backoffice/domain/entities/backoffice_view_entity';

describe('Fase 9: CanAccessViewUseCase (Zero Trust RBAC Engine)', () => {
  const canAccessUseCase = new CanAccessViewUseCase();

  it('permite vistas públicas sin requerir organización ni credenciales activas', () => {
    const result = canAccessUseCase.execute({
      viewId: 'client_catalog',
      role: null,
      isSuperAdmin: false,
      hasActiveOrg: false,
      activeModules: {},
      hasPermission: () => false,
    });

    expect(result.allowed).toBe(true);
  });

  it('bloquea la vista super_admin para cualquier usuario no super admin', () => {
    const roles: (BackofficeRole | null)[] = ['owner', 'admin', 'staff', 'viewer', null];

    roles.forEach(role => {
      const result = canAccessUseCase.execute({
        viewId: 'super_admin',
        role,
        isSuperAdmin: false,
        hasActiveOrg: true,
        activeModules: { superadmin: true },
        hasPermission: () => true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('SUPER_ADMIN_REQUIRED');
    });
  });

  it('autoriza la vista super_admin exclusivamente cuando isSuperAdmin es true', () => {
    const result = canAccessUseCase.execute({
      viewId: 'super_admin',
      role: 'super_admin',
      isSuperAdmin: true,
      hasActiveOrg: false,
      activeModules: {},
      hasPermission: () => true,
    });

    expect(result.allowed).toBe(true);
  });

  it('bloquea vistas que requieren organización si hasActiveOrg es false', () => {
    const result = canAccessUseCase.execute({
      viewId: 'dashboard',
      role: 'admin',
      isSuperAdmin: false,
      hasActiveOrg: false,
      activeModules: {},
      hasPermission: () => true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ORGANIZATION_REQUIRED');
  });

  it('bloquea vistas cuando el módulo correspondiente está deshabilitado en active_modules', () => {
    const result = canAccessUseCase.execute({
      viewId: 'appointments',
      role: 'owner',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: {
        appointments: false,
      },
      hasPermission: () => true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('MODULE_DISABLED');
  });

  it('bloquea vistas cuando el rol no está permitido en requiredRoles', () => {
    const result = canAccessUseCase.execute({
      viewId: 'business_info',
      role: 'staff',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: {},
      hasPermission: () => true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ROLE_RESTRICTED');
  });

  it('bloquea vistas cuando el usuario no cuenta con el permiso granular requerido', () => {
    const result = canAccessUseCase.execute({
      viewId: 'customizer',
      role: 'admin',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: {},
      hasPermission: (action) => {
        return action !== 'configure_settings';
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('PERMISSION_DENIED');
  });

  it('autoriza vistas normales para un owner con permisos y módulos activos', () => {
    const result = canAccessUseCase.execute({
      viewId: 'orders',
      role: 'owner',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: { orders: true },
      hasPermission: () => true,
    });

    expect(result.allowed).toBe(true);
  });
});

describe('Fase 9: GetAuthorizedNavigationItemsUseCase (Orquestador de Rutas)', () => {
  const getNavUseCase = new GetAuthorizedNavigationItemsUseCase();

  it('oculta rutas de Super Admin para usuarios estándar', () => {
    const authorizedRoutes = getNavUseCase.execute({
      role: 'owner',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: { products: true, orders: true, services: true, appointments: true },
      hasPermission: () => true,
    });

    const superAdminItem = authorizedRoutes.find(item => item.id === 'super_admin');
    expect(superAdminItem).toBeUndefined();
  });

  it('incluye super_admin cuando isSuperAdmin es true', () => {
    const authorizedRoutes = getNavUseCase.execute({
      role: 'super_admin',
      isSuperAdmin: true,
      hasActiveOrg: true,
      activeModules: {},
      hasPermission: () => true,
    });

    const superAdminItem = authorizedRoutes.find(item => item.id === 'super_admin');
    expect(superAdminItem).toBeDefined();
    expect(superAdminItem?.id).toBe('super_admin');
  });

  it('filtra módulos deshabilitados (ej. appointments)', () => {
    const authorizedRoutes = getNavUseCase.execute({
      role: 'owner',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: { appointments: false, products: true },
      hasPermission: () => true,
    });

    const appointmentRoute = authorizedRoutes.find(r => r.id === 'appointments');
    expect(appointmentRoute).toBeUndefined();
  });

  it('agrupa los elementos ordenadamente por categorías de negocio', () => {
    const groups = getNavUseCase.executeGrouped({
      role: 'owner',
      isSuperAdmin: false,
      hasActiveOrg: true,
      activeModules: {},
      hasPermission: () => true,
    });

    expect(groups.length).toBeGreaterThan(0);
    groups.forEach(group => {
      expect(group.category).toBeDefined();
      expect(group.items.length).toBeGreaterThan(0);
    });
  });
});

describe('Fase 9: Integridad del Registro de Rutas (BACKOFFICE_ROUTES)', () => {
  it('todas las rutas tienen id, label, category y iconName válidos', () => {
    expect(BACKOFFICE_ROUTES.length).toBeGreaterThan(10);

    const ids = new Set<string>();
    BACKOFFICE_ROUTES.forEach(route => {
      expect(route.id).toBeTruthy();
      expect(route.label).toBeTruthy();
      expect(route.category).toBeTruthy();
      expect(route.iconName).toBeTruthy();

      // No permitir ids duplicados
      expect(ids.has(route.id)).toBe(false);
      ids.add(route.id);
    });
  });
});
