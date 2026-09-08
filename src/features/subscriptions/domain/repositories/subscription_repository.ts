/**
 * Negocio Flex - Subscription Repository Interface (Fase 10: Dominio)
 */

import { SubscriptionEntity } from '../entities/subscription_entity';
import { BillingInterval } from '../entities/plan_entity';

export interface SubscriptionRepository {
  getSubscriptionByOrgId(organizationId: string): Promise<SubscriptionEntity | null>;
  startTrial(organizationId: string, planId: string, trialDays?: number): Promise<SubscriptionEntity>;
  changePlan(
    organizationId: string,
    newPlanId: string,
    billingInterval: BillingInterval,
    idempotencyKey?: string,
    gateway?: string
  ): Promise<{ subscription: SubscriptionEntity; transactionId: string }>;
  cancelSubscription(organizationId: string): Promise<SubscriptionEntity>;
  reactivateSubscription(organizationId: string): Promise<SubscriptionEntity>;
  reconcileSubscription(organizationId: string): Promise<SubscriptionEntity>;
}
