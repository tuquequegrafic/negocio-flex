/**
 * Negocio Flex - Supabase Webhook Log Repository (Fase 10)
 */

import { supabase } from '../../../../core/network/supabase_client';
import { WebhookEventEntity } from '../../domain/entities/webhook_event_entity';
import { WebhookLogRepository } from '../../domain/repositories/webhook_log_repository';

export class SupabaseWebhookLogRepository implements WebhookLogRepository {
  async recordWebhookEvent(
    provider: string,
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>,
    signatureValid: boolean
  ): Promise<WebhookEventEntity> {
    const record = {
      gateway: provider,
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      signature_valid: signatureValid,
      status: signatureValid ? 'PROCESSED' : 'FAILED',
      processed: signatureValid,
      processing_error: signatureValid ? null : 'Firma de webhook inválida.',
      received_at: new Date().toISOString(),
      processed_at: signatureValid ? new Date().toISOString() : null,
    };

    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .insert(record)
        .select()
        .single();

      if (!error && data) {
        return this.mapRowToEntity(data);
      }
    } catch {
      // Ignorar error de red y retornar objeto local
    }

    return {
      id: `wh_${Date.now()}`,
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      signature_valid: signatureValid,
      processed: signatureValid,
      processing_error: record.processing_error || undefined,
      received_at: record.received_at,
      processed_at: record.processed_at || undefined,
    };
  }

  async getWebhookByEventId(provider: string, eventId: string): Promise<WebhookEventEntity | null> {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('provider', provider)
        .eq('event_id', eventId)
        .maybeSingle();

      if (!error && data) {
        return this.mapRowToEntity(data);
      }
    } catch {
      // Ignorar error de red
    }
    return null;
  }

  async markAsProcessed(provider: string, eventId: string): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'PROCESSED',
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('provider', provider)
        .eq('event_id', eventId);
    } catch {
      // Ignorar error
    }
  }

  async markAsFailed(provider: string, eventId: string, error: string): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'FAILED',
          processed: false,
          processing_error: error,
          processed_at: new Date().toISOString(),
        })
        .eq('provider', provider)
        .eq('event_id', eventId);
    } catch {
      // Ignorar error
    }
  }

  private mapRowToEntity(row: Record<string, any>): WebhookEventEntity {
    return {
      id: row.id,
      provider: row.provider || row.gateway,
      event_id: row.event_id || row.id,
      event_type: row.event_type,
      payload: row.payload || {},
      signature_valid: row.signature_valid !== false,
      processed: row.processed === true || row.status === 'PROCESSED',
      processing_error: row.processing_error,
      received_at: row.received_at || row.created_at,
      processed_at: row.processed_at,
    };
  }
}
