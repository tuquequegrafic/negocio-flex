/**
 * Negocio Flex - Servicio de Almacenamiento e Imágenes (Storage Service)
 * FASE 11.9: Gestión de buckets Supabase, compresión de imágenes, validación y modo resiliente.
 */

import { supabase } from '../network/supabase_client';
import { logger } from '../utils/logger';

export type StorageBucket = 'logos' | 'covers' | 'products' | 'gallery';

export interface ImageUploadResult {
  url: string;
  success: boolean;
  error?: string;
  isLocalFallback: boolean;
  fileName: string;
  sizeBytes: number;
}

export class StorageService {
  private static readonly MAX_FILE_SIZE_MB = 5;
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * Valida archivo antes de procesarlo
   */
  public static validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo.' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Formato no soportado (${file.type}). Usa JPG, PNG, WebP o SVG.`,
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.MAX_FILE_SIZE_MB) {
      return {
        valid: false,
        error: `La imagen excede el límite de ${this.MAX_FILE_SIZE_MB}MB (Tamaño actual: ${fileSizeMB.toFixed(2)}MB).`,
      };
    }

    return { valid: true };
  }

  /**
   * Comprime y optimiza imagen en el navegador antes de subir
   */
  public static async compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Error al decodificar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sube una imagen al bucket correspondiente de Supabase o genera URL Data resiliente
   */
  public static async uploadImage(
    file: File,
    bucket: StorageBucket,
    organizationId: string
  ): Promise<ImageUploadResult> {
    // 1. Validar
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return {
        url: '',
        success: false,
        error: validation.error,
        isLocalFallback: true,
        fileName: file?.name || 'unknown',
        sizeBytes: file?.size || 0,
      };
    }

    try {
      // 2. Comprimir y optimizar localmente
      const compressedDataUrl = await this.compressImage(file);

      // 3. Si Supabase está conectado, intentar subir al bucket
      if (supabase) {
        const fileExt = file.name.split('.').pop() || 'webp';
        const cleanFileName = `${organizationId}/${bucket}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(cleanFileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(cleanFileName);
          logger.info(`Imagen subida exitosamente a Supabase Storage: [${bucket}] ${cleanFileName}`);
          return {
            url: publicData.publicUrl,
            success: true,
            isLocalFallback: false,
            fileName: file.name,
            sizeBytes: file.size,
          };
        } else {
          logger.warning('Error en Supabase Storage, utilizando DataURL local optimizado:', error?.message);
        }
      }

      // 4. Fallback local DataURL (100% funcional en cliente)
      return {
        url: compressedDataUrl,
        success: true,
        isLocalFallback: true,
        fileName: file.name,
        sizeBytes: file.size,
      };
    } catch (err: any) {
      logger.error('Error durante la subida o compresión de imagen:', err);
      return {
        url: '',
        success: false,
        error: err?.message || 'Error al procesar la imagen.',
        isLocalFallback: true,
        fileName: file.name,
        sizeBytes: file.size,
      };
    }
  }
}
