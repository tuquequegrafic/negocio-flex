/**
 * Negocio Flex - useBackofficeNavigation Hook (Fase 9)
 * Hook centralizado que orquesta el estado de navegación, RBAC,
 * filtrado de rutas y cambio seguro de organización (Multi-Tenant).
 */

import { useMemo, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { useOrganization } from '../../../organizations/presentation/providers/OrganizationContext';
import { useAuth } from '../../../auth/presentation/providers/AuthContext';
import {
  BackofficeRole,
  BackofficeRouteConfig,
  ViewAccessCheckResult,
} from '../../domain/entities/backoffice_view_entity';
import { CanAccessViewUseCase } from '../../domain/usecases/can_access_view_usecase';
import {
  GetAuthorizedNavigationItemsUseCase,
  NavigationCategoryGroup,
} from '../../domain/usecases/get_authorized_navigation_items_usecase';
import { getRouteConfig } from '../navigation/backoffice_routes';
import { logger } from '../../../../core/utils/logger';

export interface UseBackofficeNavigationReturn {
  readonly activeView: string;
  readonly setActiveView: (view: string) => void;
  readonly currentRoute?: BackofficeRouteConfig;
  readonly authorizedRoutes: readonly BackofficeRouteConfig[];
  readonly groupedRoutes: readonly NavigationCategoryGroup[];
  readonly userRole: BackofficeRole;
  readonly isSuperAdmin: boolean;
  readonly activeOrganizationId?: string;
  readonly canAccess: (viewId: string) => boolean;
  readonly checkViewAccess: (viewId: string) => ViewAccessCheckResult;
  readonly switchOrganization: (orgId: string) => Promise<void>;
  readonly badges: {
    readonly pendingOrdersCount: number;
    readonly pendingAppointmentsCount: number;
    readonly productsCount: number;
    readonly customersCount: number;
    readonly pendingApprovalsCount: number;
  };
}

export const useBackofficeNavigation = (): UseBackofficeNavigationReturn => {
  const {
    activeView,
    setActiveView,
    orders,
    appointments,
    products,
    customers,
    pendingApprovalsCount,
    setCurrentOrgId,
    currentOrg,
    currentUser,
    currentRole: legacyRole,
  } = useApp();

  const {
    activeOrganization,
    userRole: orgRole,
    isOwner,
    isAdmin,
    isStaff,
    can: hasOrgPermission,
    selectOrganization,
  } = useOrganization();

  const { user: authUser, profile } = useAuth();

  // Instancias de casos de uso (puros y memoizados)
  const canAccessUseCase = useMemo(() => new CanAccessViewUseCase(), []);
  const getNavItemsUseCase = useMemo(
    () => new GetAuthorizedNavigationItemsUseCase(canAccessUseCase),
    [canAccessUseCase]
  );

  // Detección estricta de SuperAdmin (Zero Trust: a nivel de perfil autenticado y bandera de usuario)
  const isSuperAdmin = useMemo<boolean>(() => {
    return (
      profile?.isSuperAdmin === true ||
      profile?.role === 'super_admin' ||
      authUser?.role === 'super_admin' ||
      currentUser?.is_super_admin === true ||
      legacyRole === 'SUPER_ADMIN'
    );
  }, [profile, authUser, currentUser, legacyRole]);

  // Normalización del rol de negocio activo
  const userRole = useMemo<BackofficeRole>(() => {
    if (isSuperAdmin) return 'super_admin';
    if (isOwner || orgRole === 'owner') return 'owner';
    if (isAdmin || orgRole === 'admin') return 'admin';
    if (isStaff || orgRole === 'staff') return 'staff';
    return 'viewer';
  }, [isSuperAdmin, isOwner, isAdmin, isStaff, orgRole]);

  // Módulos activos del tenant
  const activeModules = useMemo(() => {
    if (currentOrg?.settings?.active_modules) {
      return currentOrg.settings.active_modules;
    }
    if (activeOrganization?.modules) {
      return {
        products: activeOrganization.modules.enableProducts,
        services: activeOrganization.modules.enableServices,
        orders: activeOrganization.modules.enableOrders,
        appointments: activeOrganization.modules.enableAppointments,
        gallery: true,
      };
    }
    return null;
  }, [currentOrg, activeOrganization]);

  // Verificación individual de acceso a una vista
  const checkViewAccess = useCallback(
    (viewId: string): ViewAccessCheckResult => {
      return canAccessUseCase.execute({
        viewId,
        role: userRole,
        isSuperAdmin,
        activeModules: activeModules as any,
        hasPermission: hasOrgPermission,
        hasActiveOrg: Boolean(activeOrganization || currentOrg),
      });
    },
    [canAccessUseCase, userRole, isSuperAdmin, activeModules, hasOrgPermission, activeOrganization, currentOrg]
  );

  const canAccess = useCallback(
    (viewId: string): boolean => {
      return checkViewAccess(viewId).allowed;
    },
    [checkViewAccess]
  );

  // Rutas autorizadas para el usuario y tenant
  const authorizedRoutes = useMemo(() => {
    return getNavItemsUseCase.execute({
      role: userRole,
      isSuperAdmin,
      activeModules: activeModules as any,
      hasPermission: hasOrgPermission,
      hasActiveOrg: Boolean(activeOrganization || currentOrg),
    });
  }, [getNavItemsUseCase, userRole, isSuperAdmin, activeModules, hasOrgPermission, activeOrganization, currentOrg]);

  // Rutas agrupadas por categoría para la barra lateral
  const groupedRoutes = useMemo(() => {
    return getNavItemsUseCase.executeGrouped({
      role: userRole,
      isSuperAdmin,
      activeModules: activeModules as any,
      hasPermission: hasOrgPermission,
      hasActiveOrg: Boolean(activeOrganization || currentOrg),
    });
  }, [getNavItemsUseCase, userRole, isSuperAdmin, activeModules, hasOrgPermission, activeOrganization, currentOrg]);

  // Metadatos de la ruta activa actual
  const currentRoute = useMemo(() => {
    return getRouteConfig(activeView);
  }, [activeView]);

  // Badges numéricos en tiempo real
  const badges = useMemo(() => {
    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    const pendingAppointmentsCount = appointments.filter(a => a.status === 'PENDING').length;
    const productsCount = products.length;
    const customersCount = customers.length;

    return {
      pendingOrdersCount,
      pendingAppointmentsCount,
      productsCount,
      customersCount,
      pendingApprovalsCount,
    };
  }, [orders, appointments, products, customers, pendingApprovalsCount]);

  /**
   * Cambio de Organización Multi-Tenant con Cero Fuga de Datos:
   * 1. Sincroniza OrganizationContext
   * 2. Sincroniza AppContext (que gatilla la recarga limpia de catálogos, pedidos y clientes)
   * 3. Verifica si la vista actual sigue permitida para la nueva organización; si no, redirige a dashboard.
   */
  const switchOrganization = useCallback(
    async (targetOrgId: string) => {
      if (!targetOrgId) return;

      logger.info('Iniciando cambio de organización en Backoffice...', { targetOrgId });

      try {
        // 1. Sincronizar contexto organizacional (RBAC y miembro)
        await selectOrganization(targetOrgId);

        // 2. Sincronizar AppContext para recarga reactiva de datos del tenant
        setCurrentOrgId(targetOrgId);

        // 3. Evaluar compatibilidad de la vista activa tras el cambio
        const accessCheck = checkViewAccess(activeView);
        if (!accessCheck.allowed) {
          logger.warning(
            `La vista actual "${activeView}" no está permitida en la nueva organización. Redirigiendo a Dashboard.`,
            accessCheck
          );
          setActiveView('dashboard');
        }
      } catch (err) {
        logger.error('Error al cambiar de organización:', err);
      }
    },
    [selectOrganization, setCurrentOrgId, checkViewAccess, activeView, setActiveView]
  );

  return {
    activeView,
    setActiveView,
    currentRoute,
    authorizedRoutes,
    groupedRoutes,
    userRole,
    isSuperAdmin,
    activeOrganizationId: activeOrganization?.id || currentOrg?.id,
    canAccess,
    checkViewAccess,
    switchOrganization,
    badges,
  };
};
