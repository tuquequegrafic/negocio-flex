/**
 * Negocio Flex - Appointment Permissions & RBAC (Fase 11: Dominio Puro)
 * 
 * Reglas de autorización deterministas para el módulo de citas y agenda:
 * - super_admin / owner / admin: gestión total, reagendar, cancelar y eliminar citas
 * - staff: gestión operativa (confirmar cita, marcar realizada/completada, cancelar),
 *          pero NO eliminación destructiva de los registros
 * - viewer: solo lectura de la agenda, sin permisos de mutación
 */

import { BackofficeRole } from '../../../backoffice/domain/entities/backoffice_view_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class AppointmentPermissions {
  /**
   * Verifica si el rol puede visualizar la agenda y lista de citas.
   */
  static canView(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff', 'viewer'].includes(normalized);
  }

  /**
   * Verifica si el rol puede actualizar el estado de una cita (confirmar, completar, etc.)
   */
  static canUpdateStatus(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Verifica si el rol puede cancelar una cita.
   */
  static canCancel(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Verifica si el rol puede reagendar o editar los datos de una cita.
   */
  static canReschedule(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Verifica si el rol puede eliminar físicamente una cita.
   * Solo disponible para administración (super_admin, owner, admin).
   */
  static canDelete(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin'].includes(normalized);
  }

  /**
   * Verifica si el rol puede agendar una cita internamente desde el backoffice.
   */
  static canCreateInternal(role?: BackofficeRole | string): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase();
    return ['super_admin', 'owner', 'admin', 'staff'].includes(normalized);
  }

  /**
   * Aserta permiso para actualizar estado.
   */
  static assertCanUpdateStatus(role?: BackofficeRole | string): void {
    if (!this.canUpdateStatus(role)) {
      throw new UnauthorizedException(
        `El rol '${role || 'desconocido'}' no tiene privilegios para modificar el estado de citas.`
      );
    }
  }

  /**
   * Aserta permiso para eliminar citas.
   */
  static assertCanDelete(role?: BackofficeRole | string): void {
    if (!this.canDelete(role)) {
      throw new UnauthorizedException(
        `El rol '${role || 'desconocido'}' no tiene privilegios para eliminar citas del sistema.`
      );
    }
  }
}
