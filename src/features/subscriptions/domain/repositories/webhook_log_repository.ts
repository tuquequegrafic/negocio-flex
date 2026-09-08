/**
 * Negocio Flex - Webhook Log Repository Interface (Fase 10: Dominio)
 */

import { WebhookEventEntity } from '../entities/webhook_event_entity';

export interface WebhookLogRepository {
  recordWebhookEvent(
    provider: string,
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>,
    signatureValid: boolean
  ): Promise<WebhookEventEntity>;
  getWebhookByEventId(provider: string, eventId: string): Promise<WebhookEventEntity | null>;
  markAsProcessed(provider: string, eventId: string): Promise<void>;
  markAsFailed(provider: string, eventId: string, error: string): Promise<void>;
}
