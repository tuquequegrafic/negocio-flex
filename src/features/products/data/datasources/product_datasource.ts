/**
 * Negocio Flex - Product DataSource (Fase 4.2)
 * Integración Real con Supabase PostgreSQL para la tabla `products`.
 * Fuente única de verdad: PostgreSQL (products).
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { ProductModel } from '../models/product_model';
import {
  CreateProductParams,
  UpdateProductParams,
} from '../../domain/entities/product_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class ProductDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado');
    }
    return client;
  }

  /**
   * Obtiene todos los productos de una organización ordenados por display_order.
   */
  async fetchProductsByOrg(organizationId: string): Promise<ProductModel[]> {
    logger.info('Consultando productos de organización en Supabase...', { organizationId });
    const client = this.getClient();

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error al consultar productos en Supabase:', error);
      throw new Error(`Error al consultar productos: ${error.message}`);
    }

    return (data || []).map((row: Database['public']['Tables']['products']['Row']) =>
      ProductModel.fromRow(row)
    );
  }

  /**
   * Obtiene un producto individual por su ID
   */
  async fetchProductById(id: string): Promise<ProductModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar producto por ID en Supabase:', error);
      throw new Error(`Error al obtener producto: ${error.message}`);
    }

    if (!data) return null;
    return ProductModel.fromRow(data);
  }

  /**
   * Obtiene un producto por su SKU dentro de una organización
   */
  async fetchProductBySku(organizationId: string, sku: string): Promise<ProductModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sku', sku.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar producto por SKU en Supabase:', error);
      throw new Error(`Error al obtener producto por SKU: ${error.message}`);
    }

    if (!data) return null;
    return ProductModel.fromRow(data);
  }

  /**
   * Inserta un nuevo producto en la tabla `products`
   */
  async createProduct(params: CreateProductParams): Promise<ProductModel> {
    logger.info('Insertando nuevo producto en Supabase...', {
      orgId: params.organizationId,
      name: params.name,
      price: params.price,
    });
    const client = this.getClient();

    const insertPayload: any = {
      organization_id: params.organizationId,
      category_id: params.categoryId ?? null,
      name: params.name,
      description: params.description ?? '',
      sku: params.sku ? params.sku.trim().toUpperCase() : null,
      barcode: params.barcode ? params.barcode.trim() : null,
      price: params.price,
      promo_price: params.promoPrice ?? null,
      cost_price: params.costPrice ?? 0,
      stock: params.stock ?? 999,
      track_inventory: params.trackInventory ?? true,
      min_stock_alert: params.minStockAlert ?? 5,
      allow_negative_stock: params.allowNegativeStock ?? false,
      is_active: params.isActive ?? true,
      is_featured: params.isFeatured ?? false,
      display_order: params.displayOrder ?? 0,
      images: params.images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('Error al crear producto en Supabase:', error);
      throw new Error(`No fue posible crear el producto: ${error.message}`);
    }

    return ProductModel.fromRow(data, params.categoryName);
  }

  /**
   * Actualiza un producto existente en la tabla `products`
   */
  async updateProduct(id: string, params: UpdateProductParams): Promise<ProductModel> {
    logger.info('Actualizando producto en Supabase...', { id });
    const client = this.getClient();

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.categoryId !== undefined) updatePayload.category_id = params.categoryId;
    if (params.sku !== undefined) updatePayload.sku = params.sku ? params.sku.trim().toUpperCase() : null;
    if (params.barcode !== undefined) updatePayload.barcode = params.barcode ? params.barcode.trim() : null;
    if (params.price !== undefined) updatePayload.price = params.price;
    if (params.promoPrice !== undefined) updatePayload.promo_price = params.promoPrice;
    if (params.costPrice !== undefined) updatePayload.cost_price = params.costPrice;
    // HIGH-01: El stock no se actualiza directamente vía UPDATE para evitar bypass del Kárdex.
    // Cualquier cambio de stock debe registrarse a través de adjust_inventory / deduct_order_inventory.
    if (params.trackInventory !== undefined) updatePayload.track_inventory = params.trackInventory;
    if (params.minStockAlert !== undefined) updatePayload.min_stock_alert = params.minStockAlert;
    if (params.allowNegativeStock !== undefined) updatePayload.allow_negative_stock = params.allowNegativeStock;
    if (params.isActive !== undefined) updatePayload.is_active = params.isActive;
    if (params.isFeatured !== undefined) updatePayload.is_featured = params.isFeatured;
    if (params.displayOrder !== undefined) updatePayload.display_order = params.displayOrder;
    if (params.images !== undefined) updatePayload.images = params.images;

    const { data, error } = await client
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar producto en Supabase:', error);
      throw new Error(`No fue posible actualizar el producto: ${error.message}`);
    }

    return ProductModel.fromRow(data, params.categoryName);
  }

  /**
   * Elimina un producto de la tabla `products`
   */
  async deleteProduct(id: string): Promise<void> {
    logger.info('Eliminando producto en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar producto en Supabase:', error);
      throw new Error(`No fue posible eliminar el producto: ${error.message}`);
    }
  }

  /**
   * Alterna el estado activo de un producto
   */
  async toggleProductActive(id: string, isActive: boolean): Promise<ProductModel> {
    logger.info('Alternando estado activo de producto en Supabase...', { id, isActive });
    const client = this.getClient();

    const { data, error } = await client
      .from('products')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al alternar estado activo de producto en Supabase:', error);
      throw new Error(`Error al cambiar estado del producto: ${error.message}`);
    }

    return ProductModel.fromRow(data);
  }

  /**
   * Alterna el estado destacado de un producto
   */
  async toggleProductFeatured(id: string, isFeatured: boolean): Promise<ProductModel> {
    logger.info('Alternando estado destacado de producto en Supabase...', { id, isFeatured });
    const client = this.getClient();

    const { data, error } = await client
      .from('products')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al alternar estado destacado de producto en Supabase:', error);
      throw new Error(`Error al cambiar estado destacado del producto: ${error.message}`);
    }

    return ProductModel.fromRow(data);
  }

  /**
   * Actualiza el orden de visualización (`display_order`) para una lista de productos
   */
  async reorderProducts(
    organizationId: string,
    orderedItems: { id: string; displayOrder: number }[]
  ): Promise<void> {
    logger.info('Actualizando orden de productos en Supabase...', { organizationId, count: orderedItems.length });
    const client = this.getClient();

    const updatePromises = orderedItems.map((item) =>
      client
        .from('products')
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
      logger.error('Error al reordenar productos en Supabase:', firstError.error);
      throw new Error(`Error al actualizar el orden de los productos: ${firstError.error.message}`);
    }
  }
}
