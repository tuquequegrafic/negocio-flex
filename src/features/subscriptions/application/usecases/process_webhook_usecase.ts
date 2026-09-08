/**
 * Negocio Flex - Process Webhook & Get Billing History UseCases (Fase 10)
 */

import { PaymentRepository } from '../../domain/repositories/payment_repository';
import { WebhookLogRepository } from '../../domain/repositories/webhook_log_repository';
import { PaymentProvider } from '../../infrastructure/adapters/payment_provider';
import { PaymentTransactionEntity } from '../../domain/entities/payment_transaction_entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';
import { supabaseService } from '../../../../core/network/supabase_client';

export interface ProcessWebhookParams {
  readonly rawBody: string;
  readonly headers: Record<string, string>;
  readonly secretKey: string;
}

export class ProcessWebhookUseCase {
  constructor(
    private readonly paymentProvider: PaymentProvider,
    private readonly webhookLogRepository: WebhookLogRepository,
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  async execute(params: ProcessWebhookParams): Promise<{ success: boolean; eventId: string; duplicate?: boolean }> {
    // 1. Validar firma criptográfica
    const signatureValid = this.paymentProvider.verifyWebhookSignature({
      rawBody: params.rawBody,
      headers: params.headers,
      secretKey: params.secretKey,
    });

    // 2. Parsear evento
    const { eventId, eventType, payload } = this.paymentProvider.parseWebhookEvent(params.rawBody);

    // 3. Procesamiento en backend autoritativo (RPC Security Definer)
    const client = supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client.rpc('process_payment_webhook', {
          p_provider: this.paymentProvider.name,
          p_event_id: eventId,
          p_event_type: eventType,
          p_payload: payload,
        } as any);

        if (!error && data) {
          const result = data as { success: boolean; duplicate_ignored?: boolean; error?: string };
          if (result.duplicate_ignored) {
            return { success: true, eventId, duplicate: true };
          }
          if (!result.success) {
            throw new Error(result.error || 'Fallo de procesamiento en webhook');
          }
          return { success: true, eventId, duplicate: false };
        }
      } catch (rpcErr) {
        if (rpcErr instanceof Error && rpcErr.message.includes('Firma')) {
          throw rpcErr;
        }
        // Fallback si la RPC tuviese error de red transitorio
      }
    }

    // 4. Registrar o chequear duplicado en webhook_logs (Anti-Replay / Idempotencia)
    const existing = await this.webhookLogRepository.getWebhookByEventId(this.paymentProvider.name, eventId);
    if (existing) {
      return { success: true, eventId, duplicate: true };
    }

    await this.webhookLogRepository.recordWebhookEvent(
      this.paymentProvider.name,
      eventId,
      eventType,
      payload,
      signatureValid
    );

    if (!signatureValid) {
      await this.webhookLogRepository.markAsFailed(this.paymentProvider.name, eventId, 'Firma inválida');
      throw new Error('Firma de webhook inválida');
    }

    // 5. Reconciliar suscripción si el pago fue aprobado
    const orgId = (payload.metadata as Record<string, any>)?.organization_id || (payload as Record<string, any>)?.organization_id;
    if (orgId && (eventType.includes('success') || eventType.includes('approved') || eventType.includes('charge.successful'))) {
      await this.subscriptionRepository.reconcileSubscription(orgId);
    }

    await this.webhookLogRepository.markAsProcessed(this.paymentProvider.name, eventId);
    return { success: true, eventId, duplicate: false };
  }
}

export class GetBillingHistoryUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(organizationId: string): Promise<PaymentTransactionEntity[]> {
    if (!organizationId) return [];
    return this.paymentRepository.getPaymentsByOrgId(organizationId);
  }
}
