/**
 * Negocio Flex - Customer Model (Fase 4.4)
 * Modelo de datos con mapeo bidireccional entre la tabla `customers` de Supabase PostgreSQL,
 * la entidad de Dominio `CustomerEntity` y la interfaz UI `Customer`.
 */

import { Database } from '../../../../types/database.types';
import { CustomerEntity } from '../../domain/entities/customer_entity';
import { Customer } from '../../../../types';

export class CustomerModel implements CustomerEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email?: string,
    public readonly address?: string,
    public readonly reference?: string,
    public readonly notes?: string,
    public readonly totalOrders: number = 0,
    public readonly totalSpent: number = 0,
    public readonly lastOrderDate?: string,
    public readonly lastOrderNumber?: string,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly updatedAt?: string
  ) {}

  /**
   * Mapea desde la fila devuelta por Supabase PostgreSQL
   */
  static fromRow(row: Database['public']['Tables']['customers']['Row']): CustomerModel {
    return new CustomerModel(
      row.id,
      row.organization_id,
      row.name,
      row.phone,
      row.email || undefined,
      row.address || undefined,
      row.reference || undefined,
      row.notes || undefined,
      Number(row.total_orders ?? 0),
      Number(row.total_spent ?? 0),
      row.last_order_date || undefined,
      row.last_order_number || undefined,
      row.created_at || new Date().toISOString(),
      row.updated_at || undefined
    );
  }

  /**
   * Convierte la entidad a la estructura de la interfaz UI `Customer`
   */
  toLegacy(): Customer {
    return {
      id: this.id,
      organization_id: this.organizationId,
      name: this.name,
      phone: this.phone,
      email: this.email,
      address: this.address,
      reference: this.reference,
      notes: this.notes,
      total_orders: this.totalOrders,
      total_spent: this.totalSpent,
      last_order_date: this.lastOrderDate,
      last_order_number: this.lastOrderNumber,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  /**
   * Construye el modelo desde un objeto de interfaz UI `Customer`
   */
  static fromItem(item: Customer): CustomerModel {
    return new CustomerModel(
      item.id,
      item.organization_id,
      item.name,
      item.phone,
      item.email,
      item.address,
      item.reference,
      item.notes,
      item.total_orders ?? 0,
      item.total_spent ?? 0,
      item.last_order_date,
      item.last_order_number,
      item.created_at,
      item.updated_at
    );
  }

  /**
   * Determina el segmento de fidelidad del cliente
   */
  getSegment(): 'VIP' | 'FREQUENT' | 'NEW' | 'INACTIVE' {
    if (this.totalOrders >= 5 || this.totalSpent >= 300) {
      return 'VIP';
    }
    if (this.totalOrders >= 2) {
      return 'FREQUENT';
    }
    if (this.totalOrders === 1) {
      return 'NEW';
    }
    return 'INACTIVE';
  }

  get segment(): 'VIP' | 'FREQUENT' | 'NEW' | 'INACTIVE' {
    return this.getSegment();
  }

  getAverageTicket(): number {
    return this.totalOrders > 0 ? Number((this.totalSpent / this.totalOrders).toFixed(2)) : 0;
  }

  get averageTicket(): number {
    return this.getAverageTicket();
  }

  /**
   * Serializa para inserción en Supabase PostgreSQL
   */
  toInsertRow(): Database['public']['Tables']['customers']['Insert'] {
    return {
      id: this.id.startsWith('cust-') && this.id.length < 32 ? undefined : this.id,
      organization_id: this.organizationId,
      name: this.name,
      phone: this.phone,
      email: this.email || null,
      address: this.address || null,
      reference: this.reference || null,
      notes: this.notes || null,
      total_orders: this.totalOrders,
      total_spent: this.totalSpent,
      last_order_date: this.lastOrderDate || null,
      last_order_number: this.lastOrderNumber || null,
      created_at: this.createdAt,
      updated_at: this.updatedAt || new Date().toISOString(),
    };
  }
}
