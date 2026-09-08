/**
 * Negocio Flex - Subscription Status Service (Fase 10: Capa de Aplicación)
 * Única fuente de verdad canónica para determinar el estado, acceso y restricciones de una suscripción.
 */

import { SubscriptionEntity, SubscriptionStatus, normalizeSubscriptionStatus } from '../../domain/entities/subscription_entity';

export interface SubscriptionAccessAssessment {
  readonly canAccess: boolean;
  readonly canWrite: boolean;
  readonly status: SubscriptionStatus;
  readonly isTrial: boolean;
  readonly isActive: boolean;
  readonly isPastDue: boolean;
  readonly isCanceled: boolean;
  readonly isExpired: boolean;
  readonly reason?: string;
  readonly daysRemaining?: number;
}

export class SubscriptionStatusService {
  /**
   * Determina si la suscripción está en estado activo pleno
   */
  static isActive(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    return normalizeSubscriptionStatus(subscription.status) === 'active';
  }

  /**
   * Determina si la suscripción está en periodo de prueba (trial)
   */
  static isTrial(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    return normalizeSubscriptionStatus(subscription.status) === 'trial';
  }

  /**
   * Determina si la suscripción está con pago pendiente o periodo de gracia (past_due)
   */
  static isPastDue(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    return normalizeSubscriptionStatus(subscription.status) === 'past_due';
  }

  /**
   * Determina si la suscripción fue cancelada por el usuario
   */
  static isCanceled(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    return normalizeSubscriptionStatus(subscription.status) === 'cancelled';
  }

  /**
   * Determina si la suscripción está vencida/expirada
   */
  static isExpired(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return true;
    return normalizeSubscriptionStatus(subscription.status) === 'expired';
  }

  /**
   * Evalúa si la organización tiene acceso operativo a la plataforma.
   * Regla de Negocio: 'active', 'trial' y 'past_due' (periodo de gracia) tienen acceso.
   * 'cancelled' y 'expired' quedan bloqueadas para edición comercial.
   */
  static canAccess(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    const status = normalizeSubscriptionStatus(subscription.status);
    return status === 'active' || status === 'trial' || status === 'past_due';
  }

  /**
   * Determina si se permiten escrituras o creación de nuevos recursos
   */
  static canWrite(subscription?: SubscriptionEntity | null): boolean {
    if (!subscription) return false;
    const status = normalizeSubscriptionStatus(subscription.status);
    return status === 'active' || status === 'trial';
  }

  /**
   * Realiza una evaluación exhaustiva del estado y accesos de una suscripción
   */
  static evaluateAccess(subscription?: SubscriptionEntity | null): SubscriptionAccessAssessment {
    if (!subscription) {
      return {
        canAccess: false,
        canWrite: false,
        status: 'expired',
        isTrial: false,
        isActive: false,
        isPastDue: false,
        isCanceled: false,
        isExpired: true,
        reason: 'Organización sin suscripción registrada o inactiva.',
      };
    }

    const norm = normalizeSubscriptionStatus(subscription.status);
    const isAct = norm === 'active';
    const isTr = norm === 'trial';
    const isPd = norm === 'past_due';
    const isCanc = norm === 'cancelled';
    const isExp = norm === 'expired';

    let daysRemaining: number | undefined;
    if (isTr && subscription.trial_end) {
      const end = new Date(subscription.trial_end).getTime();
      const now = Date.now();
      daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    } else if (subscription.current_period_end) {
      const end = new Date(subscription.current_period_end).getTime();
      const now = Date.now();
      daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    let reason: string | undefined;
    if (isCanc) {
      reason = 'La suscripción ha sido cancelada. Por favor reactiva tu plan para desbloquear todas las funciones.';
    } else if (isExp) {
      reason = 'La suscripción o periodo de prueba ha expirado. Selecciona un plan para continuar operando tu negocio.';
    } else if (isPd) {
      reason = 'Tienes un pago pendiente. Tu acceso comercial temporal se mantendrá durante el periodo de gracia.';
    }

    return {
      canAccess: isAct || isTr || isPd,
      canWrite: isAct || isTr,
      status: norm,
      isTrial: isTr,
      isActive: isAct,
      isPastDue: isPd,
      isCanceled: isCanc,
      isExpired: isExp,
      reason,
      daysRemaining,
    };
  }

  /**
   * Devuelve etiqueta legible en español para el estado de suscripción
   */
  static getStatusLabel(status: SubscriptionStatus | string): string {
    const norm = normalizeSubscriptionStatus(status);
    switch (norm) {
      case 'active':
        return 'Activa';
      case 'trial':
        return 'Periodo de Prueba';
      case 'past_due':
        return 'Pago Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Devuelve clases de Tailwind CSS coherentes según el estado
   */
  static getStatusBadgeClasses(status: SubscriptionStatus | string): {
    bg: string;
    text: string;
    border: string;
  } {
    const norm = normalizeSubscriptionStatus(status);
    switch (norm) {
      case 'active':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'trial':
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'past_due':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'cancelled':
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
      case 'expired':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    }
  }
}
