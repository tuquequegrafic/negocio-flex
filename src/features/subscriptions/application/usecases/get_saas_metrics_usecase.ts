/**
 * Negocio Flex - Get SaaS Metrics Use Case (Fase 10: Aplicación)
 */

import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { PlanRepository } from '../../domain/repositories/plan_repository';
import { SaaSMetricsService } from '../services/saas_metrics_service';
import { SaaSMetricsDTO } from '../dto/subscription_dto';

export class GetSaaSMetricsUseCase {
  constructor(private readonly planRepo: PlanRepository) {}

  async execute(subscriptions: readonly SubscriptionEntity[]): Promise<SaaSMetricsDTO> {
    const plans = await this.planRepo.getActivePlans();
    return SaaSMetricsService.calculateMetrics(subscriptions, plans);
  }
}
