/**
 * Negocio Flex - Get Authorized Navigation Items UseCase (Fase 9)
 * Filtra y agrupa las rutas de navegación accesibles para el usuario y tenant actual.
 */

import {
  BackofficeRouteConfig,
  BackofficeViewCategory,
} from '../entities/backoffice_view_entity';
import { BACKOFFICE_ROUTES } from '../../presentation/navigation/backoffice_routes';
import { CanAccessViewUseCase, CanAccessViewParams } from './can_access_view_usecase';

export interface GetAuthorizedNavigationItemsParams
  extends Omit<CanAccessViewParams, 'viewId'> {}

export interface NavigationCategoryGroup {
  readonly category: BackofficeViewCategory;
  readonly items: readonly BackofficeRouteConfig[];
}

export class GetAuthorizedNavigationItemsUseCase {
  private readonly canAccessUseCase: CanAccessViewUseCase;

  constructor(canAccessUseCase?: CanAccessViewUseCase) {
    this.canAccessUseCase = canAccessUseCase || new CanAccessViewUseCase();
  }

  /**
   * Obtiene la lista plana de rutas autorizadas y visibles en el menú
   */
  execute(params: GetAuthorizedNavigationItemsParams): readonly BackofficeRouteConfig[] {
    return BACKOFFICE_ROUTES.filter(route => {
      if (route.hiddenFromMenu) return false;

      const check = this.canAccessUseCase.execute({
        ...params,
        viewId: route.id,
      });

      return check.allowed;
    });
  }

  /**
   * Obtiene las rutas autorizadas agrupadas por categoría de backoffice
   */
  executeGrouped(
    params: GetAuthorizedNavigationItemsParams
  ): readonly NavigationCategoryGroup[] {
    const authorized = this.execute(params);
    const categoryOrder: BackofficeViewCategory[] = [
      'OPERACION',
      'CONFIGURACION',
      'SAAS',
      'HERRAMIENTAS',
      'GLOBAL',
    ];

    const groups: NavigationCategoryGroup[] = [];

    for (const cat of categoryOrder) {
      const items = authorized.filter(r => r.category === cat);
      if (items.length > 0) {
        groups.push({
          category: cat,
          items,
        });
      }
    }

    return groups;
  }
}
