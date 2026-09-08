/**
 * Negocio Flex - Customer DataSource (Fase 4.4 & Fase 8)
 * Integración Real con Supabase PostgreSQL para la tabla `customers`.
 * Fuente única de verdad: PostgreSQL (customers).
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { CustomerModel } from '../models/customer_model';
import {
  CreateCustomerParams,
  UpdateCustomerParams,
  CustomerProfile360,
  CustomerFilterParams,
  CustomerOrderSummary,
  CustomerAppointmentSummary,
} from '../../domain/entities/customer_entity';
import { UnauthorizedException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';
import { normalizePhone } from '../../../../core/utils/phone_utils';

export class CustomerDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado');
    }
    return client;
  }

  /**
   * Obtiene todos los clientes de una organización ordenados por fecha de creación o última compra con filtros opcionales.
   */
  async fetchCustomersByOrg(organizationId: string, filter?: CustomerFilterParams): Promise<CustomerModel[]> {
    logger.info('Consultando clientes de organización en Supabase...', { organizationId, filter });
    const client = this.getClient();

    let query = client
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId);

    const sortBy = filter?.sortBy || 'created_at';
    const ascending = filter?.sortDirection === 'asc';
    query = query.order(sortBy, { ascending });

    const { data, error } = await query;

    if (error) {
      logger.error('Error al consultar clientes en Supabase:', error);
      throw new Error(`Error al consultar clientes: ${error.message}`);
    }

    let models = (data || []).map((row: Database['public']['Tables']['customers']['Row']) =>
      CustomerModel.fromRow(row)
    );

    if (filter?.segment) {
      models = models.filter(m => m.getSegment() === filter.segment);
    }

    if (filter?.query) {
      const q = filter.query.toLowerCase().trim();
      models = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.address && m.address.toLowerCase().includes(q))
      );
    }

    return models;
  }

  /**
   * Obtiene la ficha 360° del cliente con pedidos y citas históricas.
   * Utiliza la función RPC optimizada de PostgreSQL que excluye cancelados en métricas
   * y limita el timeline a 20 registros. Cuenta con fallback resiliente.
   */
  async fetchCustomerProfile360(organizationId: string, customerId: string): Promise<CustomerProfile360 | null> {
    logger.info('Consultando ficha 360° de cliente en Supabase...', { organizationId, customerId });
    const client = this.getClient();

    try {
      // 1. Intentar llamar a la función RPC si existe en la BD
      const { data: rpcData, error: rpcError } = await client.rpc('get_customer_360_profile' as any, {
        p_organization_id: organizationId,
        p_customer_id: customerId,
      });

      if (!rpcError && rpcData && rpcData.customer) {
        const custModel = CustomerModel.fromRow(rpcData.customer);
        return {
          customer: custModel,
          orders: (rpcData.orders || []).map((o: any): CustomerOrderSummary => ({
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            subtotal: Number(o.subtotal || 0),
            discount: Number(o.discount || 0),
            deliveryFee: Number(o.delivery_fee || 0),
            total: Number(o.total || 0),
            deliveryType: o.delivery_type,
            deliveryAddress: o.delivery_address,
            paymentMethod: o.payment_method,
            createdAt: o.created_at,
          })),
          appointments: (rpcData.appointments || []).map((a: any): CustomerAppointmentSummary => ({
            id: a.id,
            serviceName: a.service_name,
            staffName: a.staff_name,
            appointmentDate: a.appointment_date,
            startTime: a.start_time,
            endTime: a.end_time,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at,
          })),
          metrics: {
            totalOrders: Number(rpcData.metrics?.total_orders || 0),
            totalAppointments: Number(rpcData.metrics?.total_appointments || 0),
            totalSpent: Number(rpcData.metrics?.total_spent || 0),
            avgTicket: Number(rpcData.metrics?.avg_ticket || 0),
            segment: custModel.getSegment(),
          },
        };
      }
    } catch (rpcErr) {
      logger.warning('RPC get_customer_360_profile no disponible, realizando consulta fallback combinada:', rpcErr);
    }

    // 2. Fallback resiliente: consultar cliente, pedidos y citas por separado
    const customer = await this.fetchCustomerById(customerId, organizationId);
    if (!customer) return null;

    const [ordersRes, appointmentsRes] = await Promise.all([
      client
        .from('orders')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`customer_id.eq.${customerId},customer_phone.eq.${customer.phone}`)
        .order('created_at', { ascending: false })
        .limit(50),
      client
        .from('appointments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('customer_phone', customer.phone)
        .order('appointment_date', { ascending: false })
        .limit(50),
    ]);

    const allOrders: CustomerOrderSummary[] = (ordersRes.data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      subtotal: Number(o.subtotal || 0),
      discount: Number(o.discount || 0),
      deliveryFee: Number(o.delivery_fee || 0),
      total: Number(o.total || 0),
      deliveryType: o.delivery_type,
      deliveryAddress: o.delivery_address,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
    }));

    const appointments: CustomerAppointmentSummary[] = (appointmentsRes.data || []).map((a: any) => ({
      id: a.id,
      serviceName: a.service_name,
      staffName: a.staff_name,
      appointmentDate: a.appointment_date,
      startTime: a.start_time,
      endTime: a.end_time,
      status: a.status,
      notes: a.notes,
      createdAt: a.created_at,
    }));

    // Métricas exactas: excluir pedidos y citas cancelados
    const validOrders = allOrders.filter(o => o.status !== 'CANCELLED');
    const validAppointments = appointments.filter(a => a.status !== 'CANCELLED');
    const totalOrdersCount = validOrders.length;
    const totalSpentCalc = validOrders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = totalOrdersCount > 0 ? Math.round((totalSpentCalc / totalOrdersCount) * 100) / 100 : 0;

    return {
      customer,
      orders: allOrders.slice(0, 20),
      appointments: appointments.slice(0, 20),
      metrics: {
        totalOrders: totalOrdersCount,
        totalAppointments: validAppointments.length,
        totalSpent: totalSpentCalc,
        avgTicket,
        segment: customer.getSegment(),
      },
    };
  }

  /**
   * Busca o crea cliente de forma atómica e idempotente para pedidos y citas.
   * Prioriza la llamada a la RPC transaccional 'capture_public_customer' para evitar
   * condiciones de carrera (Race Condition 23505) y violaciones de clave foránea.
   */
  async findOrCreateCustomer(params: CreateCustomerParams): Promise<CustomerModel> {
    const client = this.getClient();
    const cleanPhone = normalizePhone(params.phone);

    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('capture_public_customer' as any, {
        p_organization_id: params.organizationId,
        p_name: params.name.trim(),
        p_phone: cleanPhone,
        p_email: params.email ? params.email.trim() : null,
        p_address: params.address ? params.address.trim() : null,
        p_reference: params.reference ? params.reference.trim() : null,
        p_order_total: params.totalSpent || 0,
        p_order_number: params.lastOrderNumber || null,
      });

      if (!rpcErr && rpcData) {
        return new CustomerModel(
          rpcData.id,
          rpcData.organization_id,
          rpcData.name,
          rpcData.phone,
          params.email ? params.email.trim() : undefined,
          params.address ? params.address.trim() : undefined,
          params.reference ? params.reference.trim() : undefined,
          undefined,
          params.totalOrders || 1,
          params.totalSpent || 0,
          new Date().toISOString(),
          params.lastOrderNumber || undefined,
          new Date().toISOString()
        );
      }
      if (rpcErr) {
        logger.warning('RPC capture_public_customer no disponible o devolvió error, ejecutando fallback local:', rpcErr);
      }
    } catch (err) {
      logger.warning('Excepción al invocar RPC capture_public_customer:', err);
    }

    // Fallback: consulta idempotente por teléfono normalizado
    const { data: existingList } = await client
      .from('customers')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('phone', cleanPhone)
      .limit(1);

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      const newTotalOrders = (existing.total_orders || 0) + (params.totalOrders || 0);
      const newTotalSpent = Number(existing.total_spent || 0) + Number(params.totalSpent || 0);

      const updatePayload: Database['public']['Tables']['customers']['Update'] = {
        name: params.name || existing.name,
        email: params.email || existing.email,
        address: params.address || existing.address,
        reference: params.reference || existing.reference,
        notes: params.notes ? (existing.notes ? `${existing.notes} | ${params.notes}` : params.notes) : existing.notes,
        total_orders: newTotalOrders,
        total_spent: newTotalSpent,
        last_order_date: params.lastOrderDate || existing.last_order_date,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: updateErr } = await client
        .from('customers')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) {
        logger.error('Error actualizando cliente en findOrCreateCustomer fallback:', updateErr);
        // Si no se puede actualizar (ej. permisos RLS en usuario anónimo), retornamos el cliente existente para no bloquear la compra
        return CustomerModel.fromRow(existing);
      }

      return CustomerModel.fromRow(updated);
    }

    // Si no existe, crear cliente con teléfono normalizado
    return this.createCustomer({
      ...params,
      phone: cleanPhone,
    });
  }

  /**
   * Obtiene un cliente individual por su ID, validando opcionalmente su organización.
   */
  async fetchCustomerById(id: string, organizationId?: string): Promise<CustomerModel | null> {
    const client = this.getClient();

    let query = client
      .from('customers')
      .select('*')
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error('Error al consultar cliente por ID en Supabase:', error);
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }

    if (!data) return null;
    return CustomerModel.fromRow(data);
  }

  /**
   * Inserta un nuevo cliente en la tabla `customers`.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CustomerModel> {
    const cleanPhone = normalizePhone(params.phone);
    logger.info('Insertando nuevo cliente en Supabase...', {
      orgId: params.organizationId,
      name: params.name,
      phone: cleanPhone,
    });
    const client = this.getClient();

    const insertPayload: Database['public']['Tables']['customers']['Insert'] = {
      organization_id: params.organizationId,
      name: params.name.trim(),
      phone: cleanPhone,
      email: params.email ? params.email.trim() : null,
      address: params.address ? params.address.trim() : null,
      reference: params.reference ? params.reference.trim() : null,
      notes: params.notes ? params.notes.trim() : null,
      total_orders: params.totalOrders ?? 0,
      total_spent: params.totalSpent ?? 0,
      last_order_date: params.lastOrderDate ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('customers')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('Error al crear cliente en Supabase:', error);
      if (error.code === '23505' || error.message.includes('unique constraint') || error.message.includes('customers_organization_id_phone_key')) {
        // En caso de carrera 23505, buscar el cliente ya existente y retornarlo de forma resiliente
        const { data: existing } = await client
          .from('customers')
          .select('*')
          .eq('organization_id', params.organizationId)
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existing) {
          return CustomerModel.fromRow(existing);
        }
        throw new Error(`Ya existe un cliente registrado con el teléfono ${params.phone} en este negocio.`);
      }
      throw new Error(`Error al registrar cliente: ${error.message}`);
    }

    return CustomerModel.fromRow(data);
  }

  /**
   * Actualiza datos de un cliente existente.
   */
  async updateCustomer(id: string, params: UpdateCustomerParams): Promise<CustomerModel> {
    logger.info('Actualizando cliente en Supabase...', { id, params });
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['customers']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (params.name !== undefined) updatePayload.name = params.name.trim();
    if (params.phone !== undefined) updatePayload.phone = normalizePhone(params.phone);
    if (params.email !== undefined) updatePayload.email = params.email ? params.email.trim() : null;
    if (params.address !== undefined) updatePayload.address = params.address ? params.address.trim() : null;
    if (params.reference !== undefined) updatePayload.reference = params.reference ? params.reference.trim() : null;
    if (params.notes !== undefined) updatePayload.notes = params.notes ? params.notes.trim() : null;
    if (params.totalOrders !== undefined) updatePayload.total_orders = params.totalOrders;
    if (params.totalSpent !== undefined) updatePayload.total_spent = params.totalSpent;
    if (params.lastOrderDate !== undefined) updatePayload.last_order_date = params.lastOrderDate || null;

    const { data, error } = await client
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar cliente en Supabase:', error);
      if (error.code === '23505' || error.message.includes('unique constraint') || error.message.includes('customers_organization_id_phone_key')) {
        throw new Error(`Ya existe otro cliente con el mismo número de teléfono en este negocio.`);
      }
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }

    return CustomerModel.fromRow(data);
  }

  /**
   * Elimina un cliente por ID.
   */
  async deleteCustomer(id: string): Promise<void> {
    logger.info('Eliminando cliente en Supabase...', { id });
    const client = this.getClient();

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error al eliminar cliente en Supabase:', error);
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }
  }

  /**
   * Busca clientes por texto en nombre, teléfono o email.
   */
  async searchCustomers(organizationId: string, query: string): Promise<CustomerModel[]> {
    const client = this.getClient();

    if (!query) {
      return this.fetchCustomersByOrg(organizationId);
    }

    const cleanDigits = query.replace(/\D/g, '');
    let orFilter = `name.ilike.%${query}%,email.ilike.%${query}%,address.ilike.%${query}%`;
    if (cleanDigits.length >= 3) {
      orFilter += `,phone.ilike.%${cleanDigits}%`;
    } else {
      orFilter += `,phone.ilike.%${query}%`;
    }

    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .or(orFilter)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error al buscar clientes en Supabase:', error);
      throw new Error(`Error al buscar clientes: ${error.message}`);
    }

    return (data || []).map((row: Database['public']['Tables']['customers']['Row']) =>
      CustomerModel.fromRow(row)
    );
  }
}
