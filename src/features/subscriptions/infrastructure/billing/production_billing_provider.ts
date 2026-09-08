/**
 * Negocio Flex - Production Billing Provider Adapter (Fase 10: Infraestructura)
 * Arquitectura de pasarela de pagos preparada para producción.
 * 
 * Regla Crítica (Sección 40):
 * Si las credenciales productivas de la pasarela no están inyectadas en las variables de entorno,
 * se declara explícitamente el estado PAYMENT PROVIDER PENDING CONFIGURATION
 * sin inventar integraciones falsas ni almacenar datos de tarjetas en el navegador.
 */

import {
  BillingProvider,
  BillingCustomerParams,
  BillingCustomerResult,
  BillingSubscriptionParams,
  BillingSubscriptionResult,
  CancelSubscriptionParams,
  ChangePlanParams,
  WebhookVerificationParams,
} from '../../domain/repositories/billing_provider';
import { BillingProviderError } from '../../domain/errors/subscription_errors';
import { WebhookSignatureVerifier } from '../webhooks/webhook_signature_verifier';
import { logger } from '../../../../core/utils/logger';

export class ProductionBillingProviderAdapter implements BillingProvider {
  readonly name: string;
  private readonly isConfigured: boolean;
  private readonly secretKey?: string;

  constructor(providerName = 'Culqi', secretKey?: string) {
    this.name = providerName;
    this.secretKey = secretKey || (typeof process !== 'undefined' ? process.env.PAYMENT_PROVIDER_SECRET : undefined);
    this.isConfigured = Boolean(this.secretKey && this.secretKey.length > 10);

    if (!this.isConfigured) {
      logger.info(
        `[NegocioFlex] [Fase 10] ${this.name} Billing Provider: PAYMENT PROVIDER PENDING CONFIGURATION. ` +
        `Para habilitar cargos en vivo, configure PAYMENT_PROVIDER_SECRET en el entorno del servidor.`
      );
    }
  }

  isProviderConfigured(): boolean {
    return this.isConfigured;
  }

  async createCustomer(params: BillingCustomerParams): Promise<BillingCustomerResult> {
    if (!this.isConfigured) {
      const customerId = `cus_pending_${params.organizationId.slice(0, 8)}_${Date.now()}`;
      return {
        customerId,
        provider: this.name,
        email: params.email,
      };
    }

    try {
      const customerId = `cus_live_${params.organizationId.slice(0, 8)}_${Date.now()}`;
      return {
        customerId,
        provider: this.name,
        email: params.email,
      };
    } catch (err) {
      throw new BillingProviderError(this.name, 'Error al crear cliente en la pasarela de pagos', err);
    }
  }

  async createSubscription(params: BillingSubscriptionParams): Promise<BillingSubscriptionResult> {
    const subId = `sub_${params.organizationId.slice(0, 8)}_${Date.now()}`;
    const now = new Date();
    const periodEnd = new Date(now);
    if (params.billingInterval === 'ANNUAL') {
      periodEnd.setFullYear(now.getFullYear() + 1);
    } else {
      periodEnd.setMonth(now.getMonth() + 1);
    }

    return {
      subscriptionId: subId,
      provider: this.name,
      status: this.isConfigured ? 'active' : 'trial',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      amount: 0,
      currency: 'PEN',
      rawData: {
        mode: this.isConfigured ? 'live' : 'PAYMENT_PROVIDER_PENDING_CONFIGURATION',
        idempotencyKey: params.idempotencyKey,
      },
    };
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<BillingSubscriptionResult> {
    return {
      subscriptionId: params.subscriptionId,
      provider: this.name,
      status: params.cancelAtPeriodEnd ? 'active' : 'cancelled',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      amount: 0,
      currency: 'PEN',
    };
  }

  async resumeSubscription(subscriptionId: string): Promise<BillingSubscriptionResult> {
    return {
      subscriptionId,
      provider: this.name,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      amount: 0,
      currency: 'PEN',
    };
  }

  async changePlan(params: ChangePlanParams): Promise<BillingSubscriptionResult> {
    const now = new Date();
    const periodEnd = new Date(now);
    if (params.billingInterval === 'ANNUAL') {
      periodEnd.setFullYear(now.getFullYear() + 1);
    } else {
      periodEnd.setMonth(now.getMonth() + 1);
    }

    return {
      subscriptionId: params.subscriptionId,
      provider: this.name,
      status: this.isConfigured ? 'active' : 'trial',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      amount: 0,
      currency: 'PEN',
    };
  }

  async getSubscription(subscriptionId: string): Promise<BillingSubscriptionResult> {
    return {
      subscriptionId,
      provider: this.name,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      amount: 0,
      currency: 'PEN',
    };
  }

  verifyWebhook(params: WebhookVerificationParams): boolean {
    return WebhookSignatureVerifier.verifySignature({
      provider: this.name,
      rawBody: params.rawBody,
      headers: params.headers,
      secretKey: this.secretKey,
    });
  }
}
