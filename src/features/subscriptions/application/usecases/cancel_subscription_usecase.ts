/**
 * Negocio Flex - Cancel & Reactivate Subscription UseCases (Fase 10)
 */

import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';
import { SubscriptionStateMachine } from '../../infrastructure/state/subscription_state_machine';

export class CancelSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(organizationId: string): Promise<SubscriptionEntity> {
    const current = await this.subscriptionRepository.getSubscriptionByOrgId(organizationId);
    if (!current) {
      throw new Error('No se encontró suscripción para esta organización.');
    }

    // Validar transición con la máquina de estados
    SubscriptionStateMachine.transition(current.status, 'cancelled');

    return this.subscriptionRepository.cancelSubscription(organizationId);
  }
}

export class ReactivateSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(organizationId: string): Promise<SubscriptionEntity> {
    const current = await this.subscriptionRepository.getSubscriptionByOrgId(organizationId);
    if (!current) {
      throw new Error('No se encontró suscripción para esta organización.');
    }

    SubscriptionStateMachine.transition(current.status, 'active');

    return this.subscriptionRepository.reactivateSubscription(organizationId);
  }
}
