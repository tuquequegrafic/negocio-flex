/**
 * Negocio Flex - Order Model (Fase 5)
 * Modelo de datos con mapeo bidireccional entre la tabla `orders` de Supabase PostgreSQL,
 * la entidad de Dominio `OrderEntity` y la interfaz UI legacy `Order`.
 */

import { Database } from '../../../../types/database.types';
import {
  OrderEntity,
  OrderItemEntity,
  OrderStatus,
  DeliveryType,
  PaymentMethod,
} from '../../domain/entities/order_entity';
import { Order, OrderItem } from '../../../../types';

export class OrderModel implements OrderEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly customerName: string,
    public readonly customerPhone: string,
    public readonly orderNumber: string,
    public readonly status: OrderStatus,
    public readonly subtotal: number,
    public readonly discount: number,
    public readonly deliveryFee: number,
    public readonly total: number,
    public readonly deliveryType: DeliveryType,
    public readonly paymentMethod: PaymentMethod,
    public readonly items: OrderItemEntity[] = [],
    public readonly customerId?: string,
    public readonly deliveryAddress?: string,
    public readonly customerReference?: string,
    public readonly notes?: string,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt?: string
  ) {}

  /**
   * Normaliza el método de pago para respetar el CHECK constraint de la base de datos:
   * CHECK (payment_method IN ('CASH', 'YAPE_PLIN', 'CARD', 'TRANSFER'))
   */
  static normalizePaymentMethod(raw?: string | null): PaymentMethod {
    if (!raw) return 'YAPE_PLIN';
    const clean = raw.trim().toUpperCase().replace(/\s+/g, '_').replace(/[/\\-]/g, '_');
    if (clean.includes('CASH') || clean.includes('EFECTIVO')) return 'CASH';
    if (clean.includes('CARD') || clean.includes('TARJETA') || clean.includes('CULQI')) return 'CARD';
    if (clean.includes('TRANSFER') || clean.includes('TRANSFERENCIA') || clean.includes('BANCO')) return 'TRANSFER';
    if (clean.includes('YAPE') || clean.includes('PLIN')) return 'YAPE_PLIN';
    return 'YAPE_PLIN';
  }

  /**
   * Normaliza el tipo de despacho según CHECK (delivery_type IN ('DELIVERY', 'PICKUP'))
   */
  static normalizeDeliveryType(raw?: string | null): DeliveryType {
    if (!raw) return 'DELIVERY';
    const clean = raw.trim().toUpperCase();
    if (clean.includes('PICKUP') || clean.includes('RECOJO') || clean.includes('TIENDA') || clean.includes('LOCAL')) {
      return 'PICKUP';
    }
    return 'DELIVERY';
  }

  /**
   * Normaliza el estado según CHECK constraint
   */
  static normalizeStatus(raw?: string | null): OrderStatus {
    const validStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'SHIPPED',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ];
    if (!raw) return 'PENDING';
    const upper = raw.trim().toUpperCase() as OrderStatus;
    if (validStatuses.includes(upper)) {
      return upper;
    }
    return 'PENDING';
  }

  /**
   * Mapea un array o JSON arbitrario a una lista tipada de OrderItemEntity
   */
  static parseItemsJson(itemsRaw: unknown, orderId: string): OrderItemEntity[] {
    if (!itemsRaw || !Array.isArray(itemsRaw)) {
      return [];
    }

    return itemsRaw.map((item: any, idx: number) => {
      const quantity = Math.max(1, Number(item.quantity ?? 1));
      const unitPrice = Math.max(0, Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0));
      const subtotal = Number(item.subtotal ?? (unitPrice * quantity));

      return {
        id: String(item.id || `item-${orderId}-${idx + 1}`),
        orderId: String(item.order_id || item.orderId || orderId),
        productId: String(item.product_id || item.productId || ''),
        productName: String(item.product_name || item.productName || item.name || 'Producto'),
        productImage: item.product_image || item.productImage || item.image_url || undefined,
        quantity,
        unitPrice,
        subtotal,
      };
    });
  }

  /**
   * Mapea una fila devuelta por Supabase PostgreSQL (orders)
   */
  static fromRow(row: Database['public']['Tables']['orders']['Row']): OrderModel {
    const items = OrderModel.parseItemsJson(row.items, row.id);

    return new OrderModel(
      row.id,
      row.organization_id,
      row.customer_name,
      row.customer_phone,
      row.order_number,
      OrderModel.normalizeStatus(row.status),
      Number(row.subtotal ?? 0),
      Number(row.discount ?? 0),
      Number(row.delivery_fee ?? 0),
      Number(row.total ?? 0),
      OrderModel.normalizeDeliveryType(row.delivery_type),
      OrderModel.normalizePaymentMethod(row.payment_method),
      items,
      row.customer_id || undefined,
      row.delivery_address || undefined,
      row.customer_reference || undefined,
      row.notes || undefined,
      row.created_at || new Date().toISOString(),
      row.updated_at || undefined
    );
  }

  /**
   * Convierte la entidad de Dominio a la interfaz UI legacy `Order`
   */
  toLegacy(): Order {
    return {
      id: this.id,
      organization_id: this.organizationId,
      customer_id: this.customerId,
      customer_name: this.customerName,
      customer_phone: this.customerPhone,
      order_number: this.orderNumber,
      status: this.status,
      subtotal: this.subtotal,
      discount: this.discount,
      delivery_fee: this.deliveryFee,
      total: this.total,
      delivery_type: this.deliveryType,
      delivery_address: this.deliveryAddress,
      customer_reference: this.customerReference,
      payment_method: this.paymentMethod,
      notes: this.notes,
      items: this.items.map(it => ({
        id: it.id,
        order_id: it.orderId,
        product_id: it.productId,
        product_name: it.productName,
        product_image: it.productImage,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        subtotal: it.subtotal,
      })),
      created_at: this.createdAt,
    };
  }

  /**
   * Convierte desde la interfaz UI legacy `Order`
   */
  static fromLegacy(legacy: Order): OrderModel {
    return new OrderModel(
      legacy.id,
      legacy.organization_id,
      legacy.customer_name,
      legacy.customer_phone,
      legacy.order_number,
      OrderModel.normalizeStatus(legacy.status),
      Number(legacy.subtotal || 0),
      Number(legacy.discount || 0),
      Number(legacy.delivery_fee || 0),
      Number(legacy.total || 0),
      OrderModel.normalizeDeliveryType(legacy.delivery_type),
      OrderModel.normalizePaymentMethod(legacy.payment_method),
      (legacy.items || []).map(it => ({
        id: it.id,
        orderId: it.order_id || legacy.id,
        productId: it.product_id,
        productName: it.product_name,
        productImage: it.product_image,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        subtotal: it.subtotal,
      })),
      legacy.customer_id,
      legacy.delivery_address,
      legacy.customer_reference,
      legacy.notes,
      legacy.created_at || new Date().toISOString()
    );
  }
}
