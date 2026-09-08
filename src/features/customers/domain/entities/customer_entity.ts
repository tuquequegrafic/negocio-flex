/**
 * Negocio Flex - Customer Domain Entity & Parameters (Fase 4.4)
 * Entidad central y tipos de parámetros para el módulo de Clientes / CRM.
 */

export interface CustomerEntity {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  reference?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastOrderNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CustomerSegment = 'VIP' | 'FREQUENT' | 'NEW' | 'INACTIVE';

export interface CustomerMetricsDto {
  totalOrders: number;
  totalAppointments: number;
  totalSpent: number;
  avgTicket: number;
  segment: CustomerSegment;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryType: string;
  deliveryAddress?: string;
  paymentMethod: string;
  createdAt: string;
}

export interface CustomerAppointmentSummary {
  id: string;
  serviceName: string;
  staffName?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerProfile360 {
  customer: CustomerEntity;
  orders: CustomerOrderSummary[];
  appointments: CustomerAppointmentSummary[];
  metrics: CustomerMetricsDto;
}

export interface CustomerFilterParams {
  query?: string;
  segment?: CustomerSegment;
  sortBy?: 'created_at' | 'total_spent' | 'total_orders' | 'name';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateCustomerParams {
  id?: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  reference?: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  lastOrderNumber?: string;
}

export interface UpdateCustomerParams {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  reference?: string;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  lastOrderNumber?: string;
}
