/**
 * Negocio Flex - Order DataSource (Fase 5)
 * Integración Real con Supabase PostgreSQL para la tabla `orders` y artículos.
 * Fuente única de verdad: PostgreSQL (orders / JSONB items & order_items).
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { OrderModel } from '../models/order_model';
import {
  CreateOrderParams,
  UpdateOrderParams,
  CreateOrderItemParams,
  OrderItemEntity,
  OrderStatus,
} from '../../domain/entities/order_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class OrderDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado.');
    }
    return client;
  }

  /**
   * Obtiene todos los pedidos de una organización ordenados cronológicamente descendente.
   */
  async fetchOrdersByOrg(organizationId: string): Promise<OrderModel[]> {
    logger.info('Consultando pedidos de organización en Supabase...', { organizationId });
    const client = this.getClient();

    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error al consultar pedidos en Supabase:', error);
      throw new Error(`Error al consultar pedidos: ${error.message}`);
    }

    return (data || []).map((row: Database['public']['Tables']['orders']['Row']) =>
      OrderModel.fromRow(row)
    );
  }

  /**
   * Obtiene un pedido individual por su ID.
   */
  async fetchOrderById(id: string): Promise<OrderModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar pedido por ID:', error);
      throw new Error(`Error al consultar pedido: ${error.message}`);
    }

    return data ? OrderModel.fromRow(data as Database['public']['Tables']['orders']['Row']) : null;
  }

  /**
   * Inserta un nuevo pedido en Supabase PostgreSQL.
   * Maneja tanto pedidos desde el panel administrativo (autenticado)
   * como pedidos desde el portal público/carrito (anónimo), con soporte para RLS.
   */
  async insertOrder(params: CreateOrderParams): Promise<OrderModel> {
    logger.info('Creando nuevo pedido en Supabase PostgreSQL...', {
      orgId: params.organizationId,
      customer: params.customerName,
      itemsCount: params.items.length,
    });
    const client = this.getClient();

    const orderId = params.id || crypto.randomUUID();
    const orderNumber =
      params.orderNumber || `#000${Math.floor(100 + Math.random() * 900)}`;

    const itemsPayload = params.items.map((it, idx) => ({
      id: it.id || `item-${orderId}-${idx + 1}`,
      order_id: orderId,
      product_id: it.productId,
      product_name: it.productName,
      product_image: it.productImage || null,
      quantity: Math.max(1, Number(it.quantity || 1)),
      unit_price: Math.max(0, Number(it.unitPrice || 0)),
      subtotal: Number(it.subtotal ?? (it.unitPrice * it.quantity)),
    }));

    const status = OrderModel.normalizeStatus(params.status);
    const deliveryType = OrderModel.normalizeDeliveryType(params.deliveryType);
    const paymentMethod = OrderModel.normalizePaymentMethod(params.paymentMethod as string);

    const rowPayload: Database['public']['Tables']['orders']['Insert'] = {
      id: orderId,
      organization_id: params.organizationId,
      customer_id: params.customerId || null,
      customer_name: params.customerName.trim(),
      customer_phone: params.customerPhone.trim(),
      order_number: orderNumber,
      status,
      subtotal: Number(params.subtotal ?? 0),
      discount: Number(params.discount ?? 0),
      delivery_fee: Number(params.deliveryFee ?? 0),
      total: Number(params.total ?? 0),
      delivery_type: deliveryType,
      delivery_address: params.deliveryAddress ? params.deliveryAddress.trim() : null,
      customer_reference: params.customerReference ? params.customerReference.trim() : null,
      payment_method: paymentMethod,
      notes: params.notes ? params.notes.trim() : null,
      items: itemsPayload as any,
    };

    // Intentar inserción con .select().single()
    const { data, error } = await client
      .from('orders')
      .insert(rowPayload)
      .select()
      .maybeSingle();

    if (error) {
      // Si la inserción falló por RLS al hacer SELECT (común en clientes anónimos en Supabase sin política de lectura),
      // reintentamos la inserción simple sin SELECT para garantizar la persistencia
      logger.warning('Inserción con retorno falló, intentando inserción directa sin SELECT:', error.message);
      
      const { error: insertOnlyError } = await client
        .from('orders')
        .insert(rowPayload);

      if (insertOnlyError) {
        logger.error('Fallo definitivo insertando pedido en Supabase:', insertOnlyError);
        throw new Error(`Error al registrar pedido en base de datos: ${insertOnlyError.message}`);
      }

      logger.info('Pedido insertado exitosamente (modo directo)', { orderId });
    } else if (data) {
      logger.info('Pedido insertado exitosamente con confirmación de Supabase', { orderId: data.id });
      return OrderModel.fromRow(data as Database['public']['Tables']['orders']['Row']);
    }

    // Intentar replicar opcionalmente en tabla `order_items` si la tabla existe en la base de datos
    try {
      const itemsToMirror = itemsPayload.map(it => ({
        id: it.id,
        order_id: orderId,
        organization_id: params.organizationId,
        product_id: it.product_id || null,
        product_name: it.product_name,
        product_image: it.product_image,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.subtotal,
      }));

      // Inserción no bloqueante de order_items
      await (client as any)
        .from('order_items')
        .insert(itemsToMirror)
        .then(() => logger.info('Artículos replicados en tabla order_items'))
        .catch((mirrorErr: any) => {
          // Si la tabla no existe o no tiene permisos, no interrumpe el flujo ya que están en orders.items
          logger.info('Nota: order_items no disponible o tabla en proceso de migración:', mirrorErr?.message);
        });
    } catch {
      // Continuar con tranquilidad
    }

    // Retornar el modelo construido con los datos confirmados
    return new OrderModel(
      orderId,
      params.organizationId,
      params.customerName.trim(),
      params.customerPhone.trim(),
      orderNumber,
      status,
      Number(params.subtotal ?? 0),
      Number(params.discount ?? 0),
      Number(params.deliveryFee ?? 0),
      Number(params.total ?? 0),
      deliveryType,
      paymentMethod,
      itemsPayload.map(it => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        productImage: it.product_image || undefined,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        subtotal: it.subtotal,
      })),
      params.customerId,
      params.deliveryAddress,
      params.customerReference,
      params.notes,
      new Date().toISOString()
    );
  }

  /**
   * Actualiza los datos de un pedido existente.
   */
  async updateOrder(id: string, params: UpdateOrderParams): Promise<OrderModel> {
    logger.info('Actualizando pedido en Supabase PostgreSQL...', { id });
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['orders']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (params.customerName !== undefined) updatePayload.customer_name = params.customerName.trim();
    if (params.customerPhone !== undefined) updatePayload.customer_phone = params.customerPhone.trim();
    if (params.customerId !== undefined) updatePayload.customer_id = params.customerId || null;
    if (params.status !== undefined) updatePayload.status = OrderModel.normalizeStatus(params.status);
    if (params.subtotal !== undefined) updatePayload.subtotal = params.subtotal;
    if (params.discount !== undefined) updatePayload.discount = params.discount;
    if (params.deliveryFee !== undefined) updatePayload.delivery_fee = params.deliveryFee;
    if (params.total !== undefined) updatePayload.total = params.total;
    if (params.deliveryType !== undefined) updatePayload.delivery_type = OrderModel.normalizeDeliveryType(params.deliveryType);
    if (params.deliveryAddress !== undefined) updatePayload.delivery_address = params.deliveryAddress || null;
    if (params.customerReference !== undefined) updatePayload.customer_reference = params.customerReference || null;
    if (params.paymentMethod !== undefined) updatePayload.payment_method = OrderModel.normalizePaymentMethod(params.paymentMethod as string);
    if (params.notes !== undefined) updatePayload.notes = params.notes || null;

    if (params.items !== undefined) {
      const itemsPayload = params.items.map((it, idx) => ({
        id: it.id || `item-${id}-${idx + 1}`,
        order_id: id,
        product_id: it.productId,
        product_name: it.productName,
        product_image: it.productImage || null,
        quantity: Math.max(1, Number(it.quantity || 1)),
        unit_price: Math.max(0, Number(it.unitPrice || 0)),
        subtotal: Number(it.subtotal ?? (it.unitPrice * it.quantity)),
      }));
      updatePayload.items = itemsPayload as any;
    }

    const { data, error } = await client
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error actualizando pedido en Supabase:', error);
      throw new Error(`Error al actualizar pedido: ${error.message}`);
    }

    return OrderModel.fromRow(data as Database['public']['Tables']['orders']['Row']);
  }

  /**
   * Actualiza el estado operacional del pedido.
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderModel> {
    logger.info('Cambiando estado de pedido en Supabase...', { id, status });
    const client = this.getClient();

    const normalized = OrderModel.normalizeStatus(status);

    const { data, error } = await client
      .from('orders')
      .update({
        status: normalized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error actualizando estado de pedido:', error);
      throw new Error(`Error al cambiar estado del pedido: ${error.message}`);
    }

    return OrderModel.fromRow(data as Database['public']['Tables']['orders']['Row']);
  }

  /**
   * Elimina un pedido por su identificador.
   */
  async deleteOrder(id: string): Promise<void> {
    logger.info('Eliminando pedido en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar pedido en Supabase:', error);
      throw new Error(`Error al eliminar pedido: ${error.message}`);
    }
  }

  /**
   * Obtiene los artículos de un pedido específico.
   */
  async fetchOrderItems(orderId: string): Promise<OrderItemEntity[]> {
    const order = await this.fetchOrderById(orderId);
    return order ? order.items : [];
  }

  /**
   * Registra artículos asociados a un pedido.
   */
  async insertOrderItems(
    orderId: string,
    items: CreateOrderItemParams[],
    organizationId: string
  ): Promise<OrderItemEntity[]> {
    const existing = await this.fetchOrderById(orderId);
    if (!existing) {
      throw new Error(`El pedido #${orderId} no existe.`);
    }

    const newItems = items.map((it, idx) => ({
      id: it.id || `item-${orderId}-${Date.now()}-${idx + 1}`,
      order_id: orderId,
      product_id: it.productId,
      product_name: it.productName,
      product_image: it.productImage || null,
      quantity: Math.max(1, Number(it.quantity || 1)),
      unit_price: Math.max(0, Number(it.unitPrice || 0)),
      subtotal: Number(it.subtotal ?? (it.unitPrice * it.quantity)),
    }));

    const combinedItems = [...existing.items, ...newItems.map(it => ({
      id: it.id,
      orderId: it.order_id,
      productId: it.product_id,
      productName: it.product_name,
      productImage: it.product_image || undefined,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      subtotal: it.subtotal,
    }))];

    await this.updateOrder(orderId, {
      items: combinedItems,
    });

    return combinedItems;
  }
}
