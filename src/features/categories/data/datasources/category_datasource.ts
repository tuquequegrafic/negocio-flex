/**
 * Negocio Flex - Category DataSource (Fase 4.1)
 * Integración Real con Supabase PostgreSQL para la tabla `categories`.
 * Fuente única de verdad: PostgreSQL (categories).
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { CategoryModel } from '../models/category_model';
import {
  CreateCategoryParams,
  UpdateCategoryParams,
} from '../../domain/entities/category_entity';
import {
  UnauthorizedException,
  NotFoundException,
} from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class CategoryDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado');
    }
    return client;
  }

  /**
   * Obtiene todas las categorías de una organización ordenadas por display_order.
   * Supabase RLS valida que el usuario sea miembro activo de la organización o catálogo público activo.
   */
  async fetchCategoriesByOrg(organizationId: string): Promise<CategoryModel[]> {
    logger.info('Consultando categorías de organización en Supabase...', { organizationId });
    const client = this.getClient();

    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error al consultar categorías en Supabase:', error);
      throw new Error(`Error al consultar categorías: ${error.message}`);
    }

    return (data || []).map((row: Database['public']['Tables']['categories']['Row']) =>
      CategoryModel.fromRow(row)
    );
  }

  /**
   * Obtiene una categoría individual por su ID
   */
  async fetchCategoryById(id: string): Promise<CategoryModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar categoría por ID en Supabase:', error);
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }

    if (!data) return null;
    return CategoryModel.fromRow(data);
  }

  /**
   * Inserta una nueva categoría en la tabla `categories`
   */
  async createCategory(params: CreateCategoryParams): Promise<CategoryModel> {
    logger.info('Insertando nueva categoría en Supabase...', {
      orgId: params.organizationId,
      name: params.name,
      type: params.type,
    });
    const client = this.getClient();

    const insertPayload: Database['public']['Tables']['categories']['Insert'] = {
      organization_id: params.organizationId,
      name: params.name,
      description: params.description ?? null,
      image_url: params.imageUrl ?? null,
      icon: params.icon ?? '🏷️',
      type: params.type,
      display_order: params.displayOrder ?? 0,
      is_active: params.isActive ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('categories')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('Error al crear categoría en Supabase:', error);
      throw new Error(`No fue posible crear la categoría: ${error.message}`);
    }

    return CategoryModel.fromRow(data);
  }

  /**
   * Actualiza una categoría existente en la tabla `categories`
   */
  async updateCategory(id: string, params: UpdateCategoryParams): Promise<CategoryModel> {
    logger.info('Actualizando categoría en Supabase...', { id });
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['categories']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.imageUrl !== undefined) updatePayload.image_url = params.imageUrl;
    if (params.icon !== undefined) updatePayload.icon = params.icon;
    if (params.type !== undefined) updatePayload.type = params.type;
    if (params.displayOrder !== undefined) updatePayload.display_order = params.displayOrder;
    if (params.isActive !== undefined) updatePayload.is_active = params.isActive;

    const { data, error } = await client
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar categoría en Supabase:', error);
      throw new Error(`No fue posible actualizar la categoría: ${error.message}`);
    }

    return CategoryModel.fromRow(data);
  }

  /**
   * Elimina una categoría de la tabla `categories`
   */
  async deleteCategory(id: string): Promise<void> {
    logger.info('Eliminando categoría en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar categoría en Supabase:', error);
      throw new Error(`No fue posible eliminar la categoría: ${error.message}`);
    }
  }

  /**
   * Actualiza el orden de visualización (`display_order`) para una lista de categorías
   */
  async reorderCategories(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    logger.info('Actualizando orden de categorías en Supabase...', { organizationId, count: orderedItems.length });
    const client = this.getClient();

    const updatePromises = orderedItems.map((item) =>
      client
        .from('categories')
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
      logger.error('Error al reordenar categorías en Supabase:', firstError.error);
      throw new Error(`Error al actualizar el orden de las categorías: ${firstError.error.message}`);
    }
  }
}
