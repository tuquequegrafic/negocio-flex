/**
 * Negocio Flex - Change Plan UseCase (Fase 10: Upgrade, Downgrade y Renovación)
 * Aplica validaciones de negocio, idempotencia y prevención de manipulación client-side.
 */

import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { BillingInterval } from '../../domain/entities/plan_entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';
import { PlanRepository } from '../../domain/repositories/plan_repository';

export interface ChangePlanParams {
  readonly organizationId: string;
  readonly newPlanId: string;
  readonly billingInterval: BillingInterval;
  readonly idempotencyKey?: string;
  readonly gateway?: string;
}

export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository
  ) {}

  async execute(params: ChangePlanParams): Promise<{ subscription: SubscriptionEntity; transactionId: string }> {
    if (!params.organizationId) {
      throw new Error('Identificador de organización requerido para cambiar de plan.');
    }

    // 1. Validar que el plan exista en el repositorio canónico
    const targetPlan = await this.planRepository.getPlanById(params.newPlanId);
    if (!targetPlan || !targetPlan.is_active) {
      throw new Error(`El plan "${params.newPlanId}" no está disponible.`);
    }

    // 2. Generar clave de idempotencia si no fue provista
    const key = params.idempotencyKey || `idem_${params.organizationId}_${params.newPlanId}_${Date.now()}`;

    // 3. Delegar al repositorio con verificación server-side
    return this.subscriptionRepository.changePlan(
      params.organizationId,
      params.newPlanId,
      params.billingInterval,
      key,
      params.gateway
    );
  }
}
