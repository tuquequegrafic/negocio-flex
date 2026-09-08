/**
 * Negocio Flex - Inventory RBAC Permissions (Fase 12)
 * Matriz de autorización estricta para operaciones de inventario y libro mayor.
 */

import { UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class InventoryPermissions {
  /**
   * Determina si el rol puede realizar ajustes manuales de stock o registrar compras.
   * Exclusivo para 'owner', 'admin' y 'super_admin'.
   */
  static canAdjustInventory(role: string): boolean {
    const normalized = role.toLowerCase();
    return normalized === 'owner' || normalized === 'admin' || normalized === 'super_admin';
  }

  /**
   * Determina si el rol puede alterar el precio de costo (cost_price) de los productos.
   * Exclusivo para 'owner', 'admin' y 'super_admin'.
   */
  static canModifyCostPrice(role: string): boolean {
    const normalized = role.toLowerCase();
    return normalized === 'owner' || normalized === 'admin' || normalized === 'super_admin';
  }

  /**
   * Determina si el rol puede consultar el Libro Mayor histórico de movimientos.
   * Permitido para 'owner', 'admin', 'staff' y 'super_admin'.
   */
  static canViewLedger(role: string): boolean {
    const normalized = role.toLowerCase();
    return ['owner', 'admin', 'staff', 'super_admin', 'viewer'].includes(normalized);
  }

  /**
   * Determina si el rol puede ejecutar deducciones automáticas por venta.
   */
  static canDeductOnSale(role: string): boolean {
    const normalized = role.toLowerCase();
    return ['owner', 'admin', 'staff', 'super_admin'].includes(normalized);
  }

  /**
   * Aserción estricta para ajustes manuales de stock.
   */
  static assertCanAdjust(role?: string): void {
    if (!role || !this.canAdjustInventory(role)) {
      throw new UnauthorizedException(
        'Acceso denegado: Solo administradores y propietarios pueden realizar ajustes manuales o entradas de inventario.'
      );
    }
  }

  /**
   * Aserción estricta para modificar precios de costo.
   */
  static assertCanModifyCost(role?: string): void {
    if (!role || !this.canModifyCostPrice(role)) {
      throw new UnauthorizedException(
        'Acceso denegado: Solo administradores y propietarios tienen autorización para modificar el costo de compra.'
      );
    }
  }
}
