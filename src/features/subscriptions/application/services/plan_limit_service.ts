/**
 * Negocio Flex - Plan Limit Service (Fase 10: Capa de Aplicación)
 * Servicio centralizado para evaluación de cuotas, límites y módulos autorizados.
 */

import { PlanEntity } from '../../domain/entities/plan_entity';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import {
  LimitResourceType,
  PlanLimitCheckResult,
  SubscriptionUsageMetrics,
} from '../../domain/entities/subscription_limits_entity';

export class PlanLimitService {
  /**
   * Verifica si la organización puede crear o incrementar un recurso según su plan
   */
  static checkLimit(
    resource: LimitResourceType,
    currentCount: number,
    plan?: PlanEntity | null,
    subscription?: SubscriptionEntity | null
  ): PlanLimitCheckResult {
    const planName = plan?.name || 'Inicial';
    let maxAllowed = 30;

    switch (resource) {
      case 'products':
        maxAllowed = plan?.limits.max_products ?? 30;
        break;
      case 'services':
        maxAllowed = plan?.limits.max_products ?? 30;
        break;
      case 'images':
        maxAllowed = plan?.limits.max_images ?? 10;
        break;
      case 'staff':
        maxAllowed = plan?.limits.max_staff ?? 1;
        break;
      case 'customers':
        maxAllowed = plan?.limits.max_customers ?? 100;
        break;
      case 'orders':
        maxAllowed = plan?.limits.max_orders_per_month ?? 500;
        break;
      case 'appointments':
        maxAllowed = plan?.limits.max_appointments_per_month ?? 200;
        break;
    }

    if (subscription && (subscription.status === 'expired' || subscription.status === 'cancelled')) {
      return {
        allowed: false,
        resource,
        currentCount,
        maxAllowed,
        planName,
        percentUsed: 100,
        message: `⚠️ Tu suscripción (${subscription.status}) no se encuentra activa. Reactiva tu plan para continuar gestionando recursos.`,
        upgradeRequired: true,
      };
    }

    const isUnlimited = maxAllowed >= 9999;
    const allowed = isUnlimited || currentCount < maxAllowed;
    const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((currentCount / Math.max(maxAllowed, 1)) * 100));

    let message = `Tienes ${currentCount} de ${isUnlimited ? 'ilimitados' : maxAllowed} ${this.getResourceLabel(resource)} en uso.`;
    if (!allowed) {
      message = `⚠️ Límite alcanzado: Tu plan ${planName} permite hasta ${maxAllowed} ${this.getResourceLabel(resource)}. Has alcanzado el límite de ${maxAllowed}. Actualiza tu plan para ampliar tu capacidad.`;
    }

    return {
      allowed,
      resource,
      currentCount,
      maxAllowed,
      planName,
      percentUsed,
      message,
      upgradeRequired: !allowed,
    };
  }

  /**
   * Verifica si un módulo específico está habilitado en el plan
   */
  static isModuleActive(
    moduleKey: string,
    plan?: PlanEntity | null,
    subscription?: SubscriptionEntity | null
  ): boolean {
    if (subscription?.active_modules && moduleKey in subscription.active_modules) {
      return Boolean(subscription.active_modules[moduleKey]);
    }
    if (plan?.active_modules) {
      return plan.active_modules.includes(moduleKey);
    }
    return ['products', 'orders', 'whatsapp'].includes(moduleKey);
  }

  /**
   * Evalúa si una métrica general tiene cuotas críticas (>85% o alcanzado)
   */
  static getUsageSummary(
    metrics: SubscriptionUsageMetrics,
    plan?: PlanEntity | null
  ): Array<PlanLimitCheckResult & { isNearLimit: boolean }> {
    const resources: LimitResourceType[] = ['products', 'images', 'staff', 'customers', 'appointments'];
    return resources.map(res => {
      let count = 0;
      if (res === 'products') count = metrics.products_count;
      else if (res === 'images') count = metrics.images_count;
      else if (res === 'staff') count = metrics.staff_count;
      else if (res === 'customers') count = metrics.customers_count;
      else if (res === 'appointments') count = metrics.appointments_count;

      const result = this.checkLimit(res, count, plan);
      return {
        ...result,
        isNearLimit: result.percentUsed >= 85 && !result.upgradeRequired,
      };
    });
  }

  private static getResourceLabel(resource: LimitResourceType): string {
    const labels: Record<LimitResourceType, string> = {
      products: 'productos en catálogo',
      services: 'servicios ofrecidos',
      images: 'fotos en la galería',
      staff: 'usuarios administradores',
      customers: 'clientes en tu base de datos',
      orders: 'pedidos mensuales',
      appointments: 'citas reservadas',
    };
    return labels[resource] || resource;
  }
}
