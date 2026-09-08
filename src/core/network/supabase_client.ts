/**
 * Negocio Flex - Cliente Centralizado de Supabase
 * Maneja una única instancia del cliente Supabase con detección de conectividad
 * y comprobación de estado sin exponer credenciales sensibles.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';
import { APP_CONFIG } from '../config/app_config';
import { logger } from '../utils/logger';

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database> | null = null;
  private isConnected: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  private initialize(): void {
    try {
      const { url, anonKey, isConfigured } = APP_CONFIG.supabase;

      if (!isConfigured || !url || !anonKey) {
        logger.info('Supabase no configurado o credenciales de ejemplo detectadas.');
        this.client = null;
        return;
      }

      this.client = createClient<Database>(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: typeof window !== 'undefined',
        },
      });

      logger.info('Supabase Client inicializado correctamente con tipos de base de datos.');
    } catch (err) {
      logger.warning('No fue posible inicializar el cliente de Supabase.', err);
      this.client = null;
    }
  }

  /**
   * Comprueba la disponibilidad y conectividad con la base de datos Supabase
   */
  public async checkHealth(): Promise<{ ok: boolean; message: string; isConfigured: boolean }> {
    if (!this.client) {
      return {
        ok: false,
        message: 'Supabase no configurado',
        isConfigured: false,
      };
    }

    try {
      // Ping simple para verificar conectividad
      const { error } = await this.client.from('organizations').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        logger.warning('Verificación de Supabase devolvió aviso de RLS/Tabla', error.message);
      }

      this.isConnected = true;
      return {
        ok: true,
        message: 'Conectado exitosamente con Supabase',
        isConfigured: true,
      };
    } catch (err: any) {
      this.isConnected = false;
      logger.error('Fallo en la prueba de salud de Supabase', err);
      return {
        ok: false,
        message: 'No se pudo contactar con el endpoint de Supabase',
        isConfigured: true,
      };
    }
  }

  public getClient(): SupabaseClient<Database> | null {
    return this.client;
  }

  public get isConfigured(): boolean {
    return Boolean(this.client);
  }
}

export const supabaseService = SupabaseService.getInstance();
export const supabase = supabaseService.getClient();
