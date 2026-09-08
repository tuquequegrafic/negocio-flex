/**
 * Negocio Flex - Order Domain Entity & Parameters (Fase 5)
 * Entidades y tipos de dominio para el módulo de Pedidos / Ventas y Artículos.
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export type PaymentMethod = 'CASH' | 'YAPE_PLIN' | 'CARD' | 'TRANSFER';

export interface OrderItemEntity {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEntity {
  id: string;
  organizationId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  customerReference?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: OrderItemEntity[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderItemParams {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface CreateOrderParams {
  id?: string;
  organizationId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  status?: OrderStatus;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  deliveryType?: DeliveryType;
  deliveryAddress?: string;
  customerReference?: string;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  items: CreateOrderItemParams[];
}

export interface UpdateOrderParams {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  status?: OrderStatus;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  deliveryType?: DeliveryType;
  deliveryAddress?: string;
  customerReference?: string;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  items?: CreateOrderItemParams[];
}
