/**
 * Negocio Flex - Service DataSource (Fase 4.3)
 * Integración Real con Supabase PostgreSQL para la tabla `services`.
 * Fuente única de verdad: PostgreSQL (services).
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { ServiceModel } from '../models/service_model';
import {
  CreateServiceParams,
  UpdateServiceParams,
} from '../../domain/entities/service_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class ServiceDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado');
    }
    return client;
  }

  /**
   * Obtiene todos los servicios de una organización ordenados por display_order.
   */
  async fetchServicesByOrg(organizationId: string): Promise<ServiceModel[]> {
    logger.info('Consultando servicios de organización en Supabase...', { organizationId });
    const client = this.getClient();

    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error al consultar servicios en Supabase:', error);
      throw new Error(`Error al consultar servicios: ${error.message}`);
    }

    return (data || []).map((row: Database['public']['Tables']['services']['Row']) =>
      ServiceModel.fromRow(row)
    );
  }

  /**
   * Obtiene un servicio individual por su ID
   */
  async fetchServiceById(id: string): Promise<ServiceModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar servicio por ID en Supabase:', error);
      throw new Error(`Error al obtener servicio: ${error.message}`);
    }

    if (!data) return null;
    return ServiceModel.fromRow(data);
  }

  /**
   * Inserta un nuevo servicio en la tabla `services`
   */
  async createService(params: CreateServiceParams): Promise<ServiceModel> {
    logger.info('Insertando nuevo servicio en Supabase...', {
      orgId: params.organizationId,
      name: params.name,
      price: params.price,
      duration: params.durationMinutes,
    });
    const client = this.getClient();

    const insertPayload: Database['public']['Tables']['services']['Insert'] = {
      organization_id: params.organizationId,
      category_id: params.categoryId ?? null,
      name: params.name,
      description: params.description ?? '',
      price: params.price,
      promo_price: params.promoPrice ?? null,
      duration_minutes: params.durationMinutes ?? 30,
      image_url: params.imageUrl ?? null,
      is_active: params.isActive ?? true,
      is_featured: params.isFeatured ?? false,
      display_order: params.displayOrder ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('services')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('Error al crear servicio en Supabase:', error);
      throw new Error(`No fue posible crear el servicio: ${error.message}`);
    }

    return ServiceModel.fromRow(data, params.categoryName);
  }

  /**
   * Actualiza un servicio existente en la tabla `services`
   */
  async updateService(id: string, params: UpdateServiceParams): Promise<ServiceModel> {
    logger.info('Actualizando servicio en Supabase...', { id });
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['services']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.categoryId !== undefined) updatePayload.category_id = params.categoryId;
    if (params.price !== undefined) updatePayload.price = params.price;
    if (params.promoPrice !== undefined) updatePayload.promo_price = params.promoPrice;
    if (params.durationMinutes !== undefined) updatePayload.duration_minutes = params.durationMinutes;
    if (params.imageUrl !== undefined) updatePayload.image_url = params.imageUrl;
    if (params.isActive !== undefined) updatePayload.is_active = params.isActive;
    if (params.isFeatured !== undefined) updatePayload.is_featured = params.isFeatured;
    if (params.displayOrder !== undefined) updatePayload.display_order = params.displayOrder;

    const { data, error } = await client
      .from('services')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar servicio en Supabase:', error);
      throw new Error(`No fue posible actualizar el servicio: ${error.message}`);
    }

    return ServiceModel.fromRow(data, params.categoryName);
  }

  /**
   * Elimina un servicio de la tabla `services`
   */
  async deleteService(id: string): Promise<void> {
    logger.info('Eliminando servicio en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar servicio en Supabase:', error);
      throw new Error(`No fue posible eliminar el servicio: ${error.message}`);
    }
  }

  /**
   * Alterna el estado activo de un servicio
   */
  async toggleServiceActive(id: string, isActive: boolean): Promise<ServiceModel> {
    logger.info('Alternando estado activo de servicio en Supabase...', { id, isActive });
    const client = this.getClient();

    const { data, error } = await client
      .from('services')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al alternar estado activo de servicio en Supabase:', error);
      throw new Error(`Error al cambiar estado del servicio: ${error.message}`);
    }

    return ServiceModel.fromRow(data);
  }

  /**
   * Alterna el estado destacado de un servicio
   */
  async toggleServiceFeatured(id: string, isFeatured: boolean): Promise<ServiceModel> {
    logger.info('Alternando estado destacado de servicio en Supabase...', { id, isFeatured });
    const client = this.getClient();

    const { data, error } = await client
      .from('services')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al alternar estado destacado de servicio en Supabase:', error);
      throw new Error(`Error al cambiar estado destacado del servicio: ${error.message}`);
    }

    return ServiceModel.fromRow(data);
  }

  /**
   * Actualiza el orden de visualización (`display_order`) para una lista de servicios
   */
  async reorderServices(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    logger.info('Actualizando orden de servicios en Supabase...', { organizationId, count: orderedItems.length });
    const client = this.getClient();

    const updatePromises = orderedItems.map((item) =>
      client
        .from('services')
        .update({
          display_order: item.displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('organization_id', organizationId)
    );

    const results = await Promise.all(updatePromises);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) {
      logger.error('Error al reordenar servicios en Supabase:', firstError.error);
      throw new Error(`Error al actualizar el orden de los servicios: ${firstError.error.message}`);
    }
  }
}
