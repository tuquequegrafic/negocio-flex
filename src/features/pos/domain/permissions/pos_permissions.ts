export type PosRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER' | 'SUPER_ADMIN';

export class PosPermissions {
  /**
   * Determina si un rol puede abrir, operar y registrar ventas en el Punto de Venta.
   * Restricción estricta: 'VIEWER' tiene prohibido el acceso a funciones operativas y financieras.
   */
  static canOperatePos(role: string | null | undefined): boolean {
    if (!role) return false;
    const normalized = role.toUpperCase();
    return ['OWNER', 'ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(normalized);
  }

  /**
   * Determina si un rol puede cerrar caja y realizar arqueos de turno.
   */
  static canCloseShift(role: string | null | undefined): boolean {
    if (!role) return false;
    const normalized = role.toUpperCase();
    return ['OWNER', 'ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(normalized);
  }

  /**
   * Determina si un rol puede configurar cajas registradoras y series de comprobantes.
   */
  static canManageRegisters(role: string | null | undefined): boolean {
    if (!role) return false;
    const normalized = role.toUpperCase();
    return ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(normalized);
  }
}
