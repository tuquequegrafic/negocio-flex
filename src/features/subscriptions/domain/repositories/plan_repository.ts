/**
 * Negocio Flex - Plan Repository Interface (Fase 10: Dominio)
 */

import { PlanEntity } from '../entities/plan_entity';

export interface PlanRepository {
  getActivePlans(): Promise<PlanEntity[]>;
  getPlanById(planId: string): Promise<PlanEntity | null>;
  getPlanBySlug(slug: string): Promise<PlanEntity | null>;
}
