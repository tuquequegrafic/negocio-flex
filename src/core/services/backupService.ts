/**
 * Negocio Flex - Servicio de Copias de Seguridad (Backup & Restore Service)
 * FASE 12.15: Exportación completa de base de datos a JSON, importación, restauración y validación.
 */

import { logger } from '../utils/logger';

export interface SystemBackupData {
  version: string;
  timestamp: string;
  app: string;
  organizations: any[];
  products: any[];
  categories: any[];
  services: any[];
  customers: any[];
  orders: any[];
  appointments: any[];
  gallery: any[];
  subscriptions: any[];
  paymentTransactions: any[];
  users: any[];
}

export class BackupService {
  /**
   * Genera el snapshot completo de datos en memoria y lo descarga como archivo JSON
   */
  public static createAndDownloadBackup(data: {
    organizations: any[];
    products: any[];
    categories: any[];
    services: any[];
    customers: any[];
    orders: any[];
    appointments: any[];
    gallery: any[];
    subscriptions: any[];
    paymentTransactions: any[];
    users: any[];
  }): void {
    try {
      const backup: SystemBackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        app: 'Negocio Flex SaaS',
        ...data,
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `backup_negocio_flex_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Copia de seguridad generada y descargada exitosamente.');
    } catch (err) {
      logger.error('Error al generar la copia de seguridad:', err);
      throw new Error('No se pudo generar la copia de seguridad.');
    }
  }

  /**
   * Valida la estructura de un archivo de copia de seguridad JSON
   */
  public static validateBackupFile(content: string): { valid: boolean; data?: SystemBackupData; error?: string } {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'El archivo no contiene un objeto JSON válido.' };
      }

      if (!Array.isArray(parsed.organizations) || !Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) {
        return { valid: false, error: 'Estructura de respaldo inválida (faltan tablas clave como organizaciones, productos u órdenes).' };
      }

      return { valid: true, data: parsed as SystemBackupData };
    } catch (err: any) {
      return { valid: false, error: 'Error al interpretar el archivo JSON: ' + err.message };
    }
  }
}
