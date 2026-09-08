/**
 * Negocio Flex - Check Feature Access Use Case (Fase 10: Aplicación)
 */

import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';
import { PlanRepository } from '../../domain/repositories/plan_repository';
import { FeatureAccessService, SaaSFeatureKey, FeatureAccessCheckResult } from '../services/feature_access_service';

export class CheckFeatureAccessUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly planRepo: PlanRepository
  ) {}

  async execute(organizationId: string, featureKey: SaaSFeatureKey): Promise<FeatureAccessCheckResult> {
    const subscription = await this.subscriptionRepo.getSubscriptionByOrgId(organizationId);
    const plan = subscription ? await this.planRepo.getPlanById(subscription.plan_id) : null;

    return FeatureAccessService.evaluateFeatureAccess(subscription, plan, featureKey);
  }
}
