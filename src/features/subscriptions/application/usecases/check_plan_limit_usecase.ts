/**
 * Negocio Flex - Check Plan Limit UseCase (Fase 10)
 */

import { PlanRepository } from '../../domain/repositories/plan_repository';
import { SubscriptionRepository } from '../../domain/repositories/subscription_repository';
import { PlanLimitService } from '../services/plan_limit_service';
import { LimitResourceType, PlanLimitCheckResult } from '../../domain/entities/subscription_limits_entity';
import { supabase } from '../../../../core/network/supabase_client';

export class CheckPlanLimitUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  async execute(
    organizationId: string,
    resource: LimitResourceType,
    currentCount: number
  ): Promise<PlanLimitCheckResult> {
    try {
      // 1. Barrera definitiva: Evaluación autoritativa en Backend / DB RPC
      const { data, error } = await supabase.rpc('check_organization_plan_limit', {
        p_org_id: organizationId,
        p_limit_type: resource,
        p_increment: 0,
      });

      if (!error && data) {
        const res = data as {
          allowed: boolean;
          current_count: number;
          max_allowed: number;
          percent_used: number;
          message: string;
          plan_name?: string;
        };
        return {
          allowed: res.allowed,
          currentCount: res.current_count,
          maxAllowed: res.max_allowed,
          percentUsed: res.percent_used,
          resource,
          message: res.message,
          planName: res.plan_name || 'Plan Oficial',
          upgradeRequired: !res.allowed,
        };
      }
    } catch {
      // Fallback a cálculo de dominio local si no hay conexión de red
    }

    const subscription = await this.subscriptionRepository.getSubscriptionByOrgId(organizationId);
    const planId = subscription?.plan_id || 'plan-inicial';
    const plan = await this.planRepository.getPlanById(planId);

    return PlanLimitService.checkLimit(resource, currentCount, plan, subscription);
  }
}
