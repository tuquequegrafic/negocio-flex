/**
 * Negocio Flex - Feature Access Service (Fase 10: Capa de Aplicación)
 * Autorización centralizada de funcionalidades según suscripción y plan.
 * Evita sentencias dispersas 'if (plan === "PRO")'.
 */

import { PlanEntity } from '../../domain/entities/plan_entity';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { SubscriptionStatusService } from './subscription_status_service';

export type SaaSFeatureKey =
  | 'custom_domain'
  | 'analytics'
  | 'crm_customers'
  | 'appointments'
  | 'promotions'
  | 'online_payments'
  | 'priority_support'
  | 'multi_user'
  | 'export_reports'
  | 'whatsapp_catalog'
  | 'gallery_unlimited'
  | string;

export interface FeatureAccessCheckResult {
  readonly allowed: boolean;
  readonly featureKey: string;
  readonly planName: string;
  readonly reason?: string;
  readonly upgradeRequired: boolean;
  readonly minimumPlanSuggested?: string;
}

export class FeatureAccessService {
  /**
   * Determina de manera centralizada si una organización puede usar una funcionalidad específica
   */
  static canUseFeature(
    subscription: SubscriptionEntity | null | undefined,
    plan: PlanEntity | null | undefined,
    featureKey: SaaSFeatureKey
  ): boolean {
    const assessment = this.evaluateFeatureAccess(subscription, plan, featureKey);
    return assessment.allowed;
  }

  /**
   * Evalúa detalladamente el acceso a una funcionalidad con mensaje explicativo para la UI
   */
  static evaluateFeatureAccess(
    subscription: SubscriptionEntity | null | undefined,
    plan: PlanEntity | null | undefined,
    featureKey: SaaSFeatureKey
  ): FeatureAccessCheckResult {
    const planName = plan?.name || 'Inicial';

    // 1. Validar estado de la suscripción
    if (!subscription || !SubscriptionStatusService.canAccess(subscription)) {
      return {
        allowed: false,
        featureKey,
        planName,
        reason: 'Tu suscripción no está activa o se encuentra vencida. Reactívala para acceder a esta función.',
        upgradeRequired: true,
        minimumPlanSuggested: 'Inicial',
      };
    }

    // 2. Comprobar si está explícitamente activada o sobreescrita en la suscripción del tenant
    if (subscription.active_modules && featureKey in subscription.active_modules) {
      const isExplicitlyEnabled = Boolean(subscription.active_modules[featureKey]);
      if (isExplicitlyEnabled) {
        return {
          allowed: true,
          featureKey,
          planName,
          upgradeRequired: false,
        };
      }
    }

    // 3. Funcionalidades universales base
    const baseFeatures = ['whatsapp_catalog', 'products', 'categories', 'orders', 'hours', 'location'];
    if (baseFeatures.includes(featureKey)) {
      return {
        allowed: true,
        featureKey,
        planName,
        upgradeRequired: false,
      };
    }

    // 4. Verificación de permisos específicos de plan
    const slug = (plan?.slug || '').toLowerCase();

    switch (featureKey) {
      case 'custom_domain':
        if (plan?.limits.custom_domain_allowed || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'El uso de dominio propio personalizado requiere el Plan Premium.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Premium',
        };

      case 'analytics':
      case 'export_reports':
        if (plan?.limits.analytics_allowed || slug === 'profesional' || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'Las métricas avanzadas y reportes requieren el Plan Profesional o superior.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      case 'crm_customers':
        if (slug === 'profesional' || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'El módulo CRM de clientes requiere el Plan Profesional o superior.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      case 'appointments':
        if (slug === 'profesional' || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'La gestión de citas y reservas requiere el Plan Profesional o superior.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      case 'promotions':
        if (slug === 'profesional' || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'El motor de promociones y descuentos requiere el Plan Profesional o superior.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      case 'priority_support':
        if (slug === 'profesional' || slug === 'premium') {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'El soporte prioritario 24/7 está disponible a partir del Plan Profesional.',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      case 'multi_user':
        if ((plan?.limits.max_staff ?? 1) > 1) {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: 'Invitar múltiples colaboradores y roles requiere el Plan Profesional (5 usuarios) o Premium (ilimitados).',
          upgradeRequired: true,
          minimumPlanSuggested: 'Plan Profesional',
        };

      default:
        // Si el plan lista explícitamente el módulo en sus active_modules
        if (plan?.active_modules && plan.active_modules.includes(featureKey)) {
          return { allowed: true, featureKey, planName, upgradeRequired: false };
        }
        return {
          allowed: false,
          featureKey,
          planName,
          reason: `La función "${featureKey}" no está incluida en tu plan actual (${planName}).`,
          upgradeRequired: true,
        };
    }
  }
}
