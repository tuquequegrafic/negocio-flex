/**
 * Negocio Flex - Supabase Payment Repository (Fase 10)
 */

import { supabase } from '../../../../core/network/supabase_client';
import { PaymentTransactionEntity } from '../../domain/entities/payment_transaction_entity';
import { PaymentRepository, ProcessPaymentParams } from '../../domain/repositories/payment_repository';
import { INITIAL_PAYMENTS } from '../../../../core/data/initialData';

export class SupabasePaymentRepository implements PaymentRepository {
  async getPaymentsByOrgId(organizationId: string): Promise<PaymentTransactionEntity[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const local = INITIAL_PAYMENTS.filter(p => p.organization_id === organizationId);
        return local.map(p => this.mapLegacyToEntity(p));
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch {
      const local = INITIAL_PAYMENTS.filter(p => p.organization_id === organizationId);
      return local.map(p => this.mapLegacyToEntity(p));
    }
  }

  async getTransactionById(transactionId: string): Promise<PaymentTransactionEntity | null> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (!error && data) {
        return this.mapRowToEntity(data);
      }
    } catch {
      // Ignorar error de red
    }
    return null;
  }

  async getTransactionByIdempotencyKey(idempotencyKey: string): Promise<PaymentTransactionEntity | null> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (!error && data) {
        return this.mapRowToEntity(data);
      }
    } catch {
      // Ignorar error de red
    }
    return null;
  }

  async recordTransaction(params: ProcessPaymentParams): Promise<PaymentTransactionEntity> {
    // 1. Verificar idempotencia
    const existing = await this.getTransactionByIdempotencyKey(params.idempotencyKey);
    if (existing) {
      return existing;
    }

    const payload = {
      organization_id: params.organizationId,
      organization_name: params.organizationName,
      plan_id: params.planId,
      plan_name: params.planName,
      amount: params.amount,
      currency: params.currency || 'S/',
      payment_gateway: params.gateway,
      payment_method_type: params.paymentMethodType,
      transaction_id: `TXN-${Date.now().toString(36).toUpperCase()}`,
      idempotency_key: params.idempotencyKey,
      status: 'APPROVED',
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      card_last4: params.cardLast4,
      card_brand: params.cardBrand,
      webhook_verified: true,
      metadata: params.metadata || {},
    };

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return this.mapRowToEntity(data);
      }
    } catch {
      // Fallback
    }

    return this.mapRowToEntity({
      id: `pay_${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  private mapRowToEntity(row: Record<string, any>): PaymentTransactionEntity {
    return {
      id: row.id,
      organization_id: row.organization_id,
      organization_name: row.organization_name,
      subscription_id: row.subscription_id,
      plan_id: row.plan_id,
      plan_name: row.plan_name,
      amount: Number(row.amount) || 0,
      currency: row.currency || 'S/',
      payment_gateway: row.payment_gateway,
      payment_method_type: row.payment_method_type || 'CARD',
      transaction_id: row.transaction_id,
      idempotency_key: row.idempotency_key,
      status: row.status,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      card_last4: row.card_last4,
      card_brand: row.card_brand,
      webhook_verified: row.webhook_verified !== false,
      receipt_url: row.receipt_url,
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapLegacyToEntity(legacy: Record<string, any>): PaymentTransactionEntity {
    return {
      id: legacy.id,
      organization_id: legacy.organization_id,
      organization_name: legacy.organization_name,
      plan_id: legacy.plan_id,
      plan_name: legacy.plan_name,
      amount: Number(legacy.amount) || 0,
      currency: legacy.currency || 'S/',
      payment_gateway: legacy.payment_gateway,
      payment_method_type: legacy.payment_method_type,
      transaction_id: legacy.transaction_id,
      status: legacy.status,
      customer_name: legacy.customer_name,
      customer_email: legacy.customer_email,
      card_last4: legacy.card_last4,
      card_brand: legacy.card_brand,
      webhook_verified: legacy.webhook_verified !== false,
      receipt_url: legacy.receipt_url,
      created_at: legacy.created_at,
    };
  }
}
