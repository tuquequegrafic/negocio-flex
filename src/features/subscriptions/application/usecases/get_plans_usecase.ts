/**
 * Negocio Flex - Get Plans UseCase (Fase 10)
 */

import { PlanEntity } from '../../domain/entities/plan_entity';
import { PlanRepository } from '../../domain/repositories/plan_repository';

export class GetPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(): Promise<PlanEntity[]> {
    return this.planRepository.getActivePlans();
  }
}
