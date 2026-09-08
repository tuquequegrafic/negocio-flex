/**
 * Negocio Flex - Webhook Event Entity (Fase 10: Dominio Puro)
 * Evento de webhook con soporte para anti-replay, verificación criptográfica e idempotencia.
 */

export interface WebhookEventEntity {
  readonly id: string;
  readonly provider: string;
  readonly event_id: string;
  readonly event_type: string;
  readonly payload: Record<string, unknown>;
  readonly signature_valid: boolean;
  readonly processed: boolean;
  readonly processing_error?: string;
  readonly received_at: string;
  readonly processed_at?: string;
}

export interface WebhookVerificationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly eventId?: string;
  readonly eventType?: string;
}
