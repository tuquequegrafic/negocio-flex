/**
 * Negocio Flex - Order Permissions & RBAC (Fase 11: Dominio Puro)
 * 
 * Reglas de autorización deterministas para el módulo de pedidos según roles de backoffice:
 * - super_admin: acceso total sin restricciones
 * - owner / admin: gestión completa, creación, avance de estados, cancelación y eliminación
 * - staff: gestión operativa (confirmar, preparar, listo, despachar, entregar, cancelar operativo)
 *          pero NO eliminación destructiva de pedidos
 * - viewer: solo lectura analítica, prohibida cualquier mutación de datos
 */

import { BackofficeRole } from '../../../backoffice/domain/entities/backoffice_view_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class OrderPermissions {
  /**
   * Verifica si el rol puede visualizar pedidos de la organización.
   */
  static canView(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff', 'viewer'].includes(normalized);
  }

  /**
   * Verifica si el rol puede cambiar el estado operacional de un pedido (despacho, cocina, etc.)
   */
  static canUpdateStatus(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Verifica si el rol puede cancelar un pedido.
   */
  static canCancel(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Verifica si el rol puede eliminar físicamente un pedido de los registros.
   * Solo disponible para administración (owner, admin, super_admin).
   * El personal operativo (staff) y observadores (viewer) tienen prohibida la eliminación.
   */
  static canDelete(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin'].includes(normalized);
  }

  /**
   * Verifica si el rol puede crear pedidos internamente desde el panel.
   */
  static canCreateInternal(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Lanza UnauthorizedException si el rol no tiene permiso para actualizar estado.
   */
  static assertCanUpdateStatus(role?: BackofficeRole | string): void {
    if (!this.canUpdateStatus(role)) {
      throw new UnauthorizedException(
        `El rol '${role || 'desconocido'}' no tiene privilegios para modificar el estado de pedidos.`
      );
    }
  }

  /**
   * Lanza UnauthorizedException si el rol no tiene permiso para eliminar.
   */
  static assertCanDelete(role?: BackofficeRole | string): void {
    if (!this.canDelete(role)) {
      throw new UnauthorizedException(
        `El rol '${role || 'desconocido'}' no tiene permisos para eliminar pedidos del sistema.`
      );
    }
  }
}
