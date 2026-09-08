/**
 * Negocio Flex - Subscription DTOs (Fase 10: Capa de Aplicación)
 */

import { SubscriptionStatus } from '../../domain/entities/subscription_entity';
import { BillingInterval } from '../../domain/entities/plan_entity';

export interface SubscriptionDTO {
  id: string;
  organizationId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
  amountPaid: number;
  currency: string;
  provider: string;
  activeModules?: Record<string, boolean>;
  customDomain?: string;
  isGoodStanding: boolean;
}

export interface ChangePlanRequestDTO {
  organizationId: string;
  newPlanId: string;
  billingInterval: BillingInterval;
  idempotencyKey?: string;
  gateway?: string;
}

export interface ResourceUsageDTO {
  resource: string;
  currentCount: number;
  maxAllowed: number;
  percentUsed: number;
  allowed: boolean;
  upgradeRequired: boolean;
  message: string;
}

export interface SaaSMetricsDTO {
  mrr: number;
  arr: number;
  activeSubscriptionsCount: number;
  trialSubscriptionsCount: number;
  pastDueSubscriptionsCount: number;
  canceledSubscriptionsCount: number;
  expiredSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  revenueByPlan: Record<string, number>;
  subscriptionsByPlan: Record<string, number>;
  calculatedAt: string;
}
