/**
 * Negocio Flex - Get Current Subscription UseCase (Fase 10)
 */

import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';

export class GetCurrentSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async execute(organizationId: string): Promise<SubscriptionEntity | null> {
    if (!organizationId) return null;
    return this.subscriptionRepository.getSubscriptionByOrgId(organizationId);
  }
}
