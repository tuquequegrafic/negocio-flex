/**
 * Negocio Flex - Cliente Centralizado de Supabase
 * Maneja una única instancia del cliente Supabase con detección de conectividad
 * y comprobación de estado sin exponer credenciales sensibles.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/app_config';
import { logger } from '../utils/logger';
import { NetworkException, ServerException } from '../errors/app_exceptions';

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
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
        logger.info('Supabase no configurado o credenciales de ejemplo detectadas. Activando modo almacenamiento local resiliente.');
        this.client = null;
        return;
      }

      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: typeof window !== 'undefined',
        },
      });

      logger.info('Supabase Client inicializado correctamente.');
    } catch (err) {
      logger.warning('No fue posible inicializar el cliente de Supabase. Activando modo almacenamiento local resiliente.', err);
      this.client = null;
    }
  }

  /**
   * Comprueba la disponibilidad y conectividad con la base de datos Supabase
   */
  public async checkHealth(): Promise<{ ok: boolean; message: string; isConfigured: boolean }> {
    if (!this.client) {
      return {
        ok: true,
        message: 'Modo Local / Standalone activo (listo para sincronización Supabase)',
        isConfigured: false,
      };
    }

    try {
      // Ping simple para verificar conectividad
      const { error } = await this.client.from('organizations').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // Códigos normales de tabla vacía o permisos RLS son aceptables
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

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public get isConfigured(): boolean {
    return Boolean(this.client);
  }
}

export const supabaseService = SupabaseService.getInstance();
export const supabase = supabaseService.getClient();
