/**
 * Negocio Flex - Billing Provider Interface (Fase 10: Dominio)
 * Abstracción de pasarela/proveedor de facturación SaaS agnóstica de proveedor concreto.
 */

import { BillingInterval } from '../entities/plan_entity';

export interface BillingCustomerParams {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface BillingCustomerResult {
  readonly customerId: string;
  readonly provider: string;
  readonly email: string;
}

export interface BillingSubscriptionParams {
  readonly customerId: string;
  readonly organizationId: string;
  readonly planId: string;
  readonly billingInterval: BillingInterval;
  readonly paymentMethodId?: string;
  readonly idempotencyKey: string;
  readonly metadata?: Record<string, unknown>;
}

export interface BillingSubscriptionResult {
  readonly subscriptionId: string;
  readonly provider: string;
  readonly status: string;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly amount: number;
  readonly currency: string;
  readonly rawData?: Record<string, unknown>;
}

export interface ChangePlanParams {
  readonly subscriptionId: string;
  readonly newPlanId: string;
  readonly billingInterval: BillingInterval;
  readonly prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  readonly idempotencyKey: string;
}

export interface CancelSubscriptionParams {
  readonly subscriptionId: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly reason?: string;
}

export interface WebhookVerificationParams {
  readonly rawBody: string;
  readonly headers: Record<string, string>;
  readonly secretKey: string;
}

export interface BillingProvider {
  readonly name: string;
  createCustomer(params: BillingCustomerParams): Promise<BillingCustomerResult>;
  createSubscription(params: BillingSubscriptionParams): Promise<BillingSubscriptionResult>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<BillingSubscriptionResult>;
  resumeSubscription(subscriptionId: string): Promise<BillingSubscriptionResult>;
  changePlan(params: ChangePlanParams): Promise<BillingSubscriptionResult>;
  getSubscription(subscriptionId: string): Promise<BillingSubscriptionResult>;
  verifyWebhook(params: WebhookVerificationParams): boolean;
}
