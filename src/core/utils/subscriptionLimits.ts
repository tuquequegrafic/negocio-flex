import { Subscription, SubscriptionPlan, Product, GalleryItem } from '../../types';

export interface LimitCheckResult {
  allowed: boolean;
  max: number;
  current: number;
  planName: string;
  percentUsed: number;
  message: string;
  upgradeRequired: boolean;
}

/**
 * Checks if adding a new product is permitted under the tenant's current subscription plan.
 */
export function checkProductLimit(
  currentProductCount: number,
  plan?: SubscriptionPlan,
  subscription?: Subscription
): LimitCheckResult {
  const max = plan?.max_products ?? 30;
  const planName = plan?.name || 'Inicial';
  const allowed = currentProductCount < max;
  const percentUsed = Math.min(100, Math.round((currentProductCount / max) * 100));

  let message = `Tienes ${currentProductCount} de ${max >= 9999 ? 'ilimitados' : max} productos permitidos.`;
  if (!allowed) {
    message = `⚠️ Límite alcanzado: Tu plan ${planName} permite hasta ${max} productos. Actualiza tu plan para agregar más productos a tu catálogo.`;
  }

  return {
    allowed,
    max,
    current: currentProductCount,
    planName,
    percentUsed,
    message,
    upgradeRequired: !allowed
  };
}

/**
 * Checks if adding a new image to the gallery is permitted.
 */
export function checkGalleryLimit(
  currentImageCount: number,
  plan?: SubscriptionPlan
): LimitCheckResult {
  const max = plan?.max_images ?? 15;
  const planName = plan?.name || 'Inicial';
  const allowed = currentImageCount < max;
  const percentUsed = Math.min(100, Math.round((currentImageCount / max) * 100));

  let message = `Tienes ${currentImageCount} de ${max >= 9999 ? 'ilimitadas' : max} fotos permitidas en tu galería.`;
  if (!allowed) {
    message = `⚠️ Límite alcanzado: Tu plan ${planName} permite hasta ${max} fotos en la galería. Actualiza tu plan para publicar más imágenes.`;
  }

  return {
    allowed,
    max,
    current: currentImageCount,
    planName,
    percentUsed,
    message,
    upgradeRequired: !allowed
  };
}

/**
 * Checks if adding another staff/user is permitted.
 */
export function checkStaffLimit(
  currentUserCount: number,
  plan?: SubscriptionPlan
): LimitCheckResult {
  const max = plan?.max_staff ?? 1;
  const planName = plan?.name || 'Inicial';
  const allowed = currentUserCount < max;
  const percentUsed = Math.min(100, Math.round((currentUserCount / max) * 100));

  let message = `Tienes ${currentUserCount} de ${max >= 9999 ? 'ilimitados' : max} usuarios activos.`;
  if (!allowed) {
    message = `⚠️ Límite alcanzado: Tu plan ${planName} permite hasta ${max} usuario(s). Actualiza a Profesional o Premium para sumar a tu equipo.`;
  }

  return {
    allowed,
    max,
    current: currentUserCount,
    planName,
    percentUsed,
    message,
    upgradeRequired: !allowed
  };
}

/**
 * Calculate trial days remaining
 */
export function calculateTrialDaysRemaining(subscription?: Subscription): number {
  if (!subscription || subscription.status !== 'trial') return 0;
  
  const trialEnd = new Date(subscription.trial_end_date || subscription.end_date);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Returns if a subscription is considered in good standing for public store operation.
 * (Even if a limit is reached or in trial, public store and WhatsApp always operate!)
 */
export function isStoreActive(subscription?: Subscription): boolean {
  if (!subscription) return true; // default open
  return subscription.status === 'active' || subscription.status === 'trial';
}
