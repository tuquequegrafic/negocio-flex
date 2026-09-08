/**
 * Negocio Flex - Suite Exhaustiva de Pruebas Automatizadas (Fase 10)
 * Cobertura de Dominio, Aplicación, Datos, Webhooks, Idempotencia, Métricas y Seguridad Multi-Tenant.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SubscriptionEntity,
  SubscriptionStatus,
  normalizeSubscriptionStatus,
  isSubscriptionInGoodStanding,
} from '../src/features/subscriptions/domain/entities/subscription_entity';
import { PlanEntity, BillingInterval } from '../src/features/subscriptions/domain/entities/plan_entity';
import { SubscriptionStateMachine } from '../src/features/subscriptions/infrastructure/state/subscription_state_machine';
import { PlanLimitService } from '../src/features/subscriptions/application/services/plan_limit_service';
import { SubscriptionStatusService } from '../src/features/subscriptions/application/services/subscription_status_service';
import { FeatureAccessService } from '../src/features/subscriptions/application/services/feature_access_service';
import { SaaSMetricsService } from '../src/features/subscriptions/application/services/saas_metrics_service';
import { WebhookSignatureVerifier } from '../src/features/subscriptions/infrastructure/webhooks/webhook_signature_verifier';
import { MoneyVO } from '../src/features/subscriptions/domain/value_objects/money';
import { BillingIntervalVO } from '../src/features/subscriptions/domain/value_objects/billing_interval';
import { SubscriptionPeriodVO } from '../src/features/subscriptions/domain/value_objects/subscription_period';
import {
  SubscriptionNotFoundError,
  PlanLimitExceededError,
  InvalidSubscriptionStateError,
  WebhookVerificationError,
} from '../src/features/subscriptions/domain/errors/subscription_errors';
import { SubscriptionModel } from '../src/features/subscriptions/data/models/subscription_model';
import { PlanModel } from '../src/features/subscriptions/data/models/plan_model';
import crypto from 'crypto';

describe('Fase 10 - Dominio: Entidades, Value Objects y Errores', () => {
  it('debe normalizar correctamente todos los estados de suscripción canónicos', () => {
    expect(normalizeSubscriptionStatus('trialing')).toBe('trial');
    expect(normalizeSubscriptionStatus('trial')).toBe('trial');
    expect(normalizeSubscriptionStatus('active')).toBe('active');
    expect(normalizeSubscriptionStatus('past_due')).toBe('past_due');
    expect(normalizeSubscriptionStatus('canceled')).toBe('cancelled');
    expect(normalizeSubscriptionStatus('cancelled')).toBe('cancelled');
    expect(normalizeSubscriptionStatus('expired')).toBe('expired');
    expect(normalizeSubscriptionStatus('')).toBe('trial');
  });

  it('debe evaluar la vigencia comercial con isSubscriptionInGoodStanding', () => {
    expect(isSubscriptionInGoodStanding('active')).toBe(true);
    expect(isSubscriptionInGoodStanding('trial')).toBe(true);
    expect(isSubscriptionInGoodStanding('past_due')).toBe(true);
    expect(isSubscriptionInGoodStanding('cancelled')).toBe(false);
    expect(isSubscriptionInGoodStanding('expired')).toBe(false);
  });

  it('debe operar con el Value Object MoneyVO validando redondeo y monedas idénticas', () => {
    const m1 = new MoneyVO(29.999, 'PEN');
    expect(m1.amount).toBe(30);
    expect(m1.format()).toBe('S/ 30.00');

    const m2 = new MoneyVO(15.50, 'PEN');
    const sum = m1.add(m2);
    expect(sum.amount).toBe(45.50);

    const mUSD = new MoneyVO(10, 'USD');
    expect(() => m1.add(mUSD)).toThrowError(/monedas distintas/);
    expect(() => new MoneyVO(-5)).toThrowError(/mayor o igual a 0/);
  });

  it('debe operar con el Value Object BillingIntervalVO', () => {
    const monthly = new BillingIntervalVO('monthly');
    expect(monthly.isMonthly()).toBe(true);
    expect(monthly.isAnnual()).toBe(false);
    expect(monthly.getMonths()).toBe(1);

    const annual = new BillingIntervalVO('annual');
    expect(annual.isAnnual()).toBe(true);
    expect(annual.getMonths()).toBe(12);

    expect(() => new BillingIntervalVO('weekly')).toThrowError(/inválido/);
  });

  it('debe operar con el Value Object SubscriptionPeriodVO calculando días restantes', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 10 * 86400000);
    const period = new SubscriptionPeriodVO(now, future);

    expect(period.hasExpired(now)).toBe(false);
    expect(period.isCurrent(now)).toBe(true);
    expect(period.daysRemaining(now)).toBe(10);

    const past = new Date(now.getTime() - 86400000);
    const expiredPeriod = new SubscriptionPeriodVO(new Date(past.getTime() - 86400000 * 5), past);
    expect(expiredPeriod.hasExpired(now)).toBe(true);
    expect(expiredPeriod.daysRemaining(now)).toBe(0);

    expect(() => new SubscriptionPeriodVO(future, now)).toThrowError(/no puede ser anterior/);
  });

  it('debe arrojar y tipar adecuadamente errores de dominio de suscripción', () => {
    const errNotFound = new SubscriptionNotFoundError('org_123');
    expect(errNotFound.code).toBe('SUBSCRIPTION_NOT_FOUND');
    expect(errNotFound.message).toContain('org_123');

    const errLimit = new PlanLimitExceededError('products', 35, 30);
    expect(errLimit.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(errLimit.resource).toBe('products');
    expect(errLimit.currentCount).toBe(35);

    const errState = new InvalidSubscriptionStateError('cancelled', 'active');
    expect(errState.code).toBe('INVALID_SUBSCRIPTION_STATE');
    expect(errState.currentStatus).toBe('cancelled');
  });
});

describe('Fase 10 - Aplicación: Máquina de Estados, Límites y Features', () => {
  const mockPlanInicial: PlanEntity = {
    id: 'plan_inicial',
    name: 'Plan Inicial',
    slug: 'inicial',
    description: 'Básico',
    price_monthly: 29,
    price_annual: 290,
    billing_interval: 'MONTHLY',
    trial_days: 14,
    limits: {
      max_products: 30,
      max_images: 10,
      max_staff: 1,
      max_customers: 100,
      max_orders_per_month: 500,
      max_appointments_per_month: 200,
      custom_domain_allowed: false,
      analytics_allowed: false,
    },
    active_modules: ['products', 'orders', 'whatsapp'],
    features: ['30 productos'],
    is_active: true,
    support_level: 'Estándar',
  };

  const mockPlanPremium: PlanEntity = {
    id: 'plan_premium',
    name: 'Plan Premium',
    slug: 'premium',
    description: 'Empresarial',
    price_monthly: 79,
    price_annual: 790,
    billing_interval: 'MONTHLY',
    trial_days: 14,
    limits: {
      max_products: 9999,
      max_images: 9999,
      max_staff: 9999,
      max_customers: 9999,
      max_orders_per_month: 9999,
      max_appointments_per_month: 9999,
      custom_domain_allowed: true,
      analytics_allowed: true,
    },
    active_modules: ['products', 'orders', 'whatsapp', 'analytics', 'customers', 'appointments'],
    features: ['Ilimitado'],
    is_active: true,
    support_level: 'VIP',
  };

  const mockActiveSubscription: SubscriptionEntity = {
    id: 'sub_active_1',
    organization_id: 'org_test_1',
    plan_id: 'plan_inicial',
    plan_name: 'Plan Inicial',
    status: 'active',
    billing_interval: 'MONTHLY',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    auto_renew: true,
    amount_paid: 29,
    currency: 'PEN',
    provider: 'Culqi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('debe validar la matriz de transiciones de estado determinista', () => {
    // Permitidos
    expect(SubscriptionStateMachine.canTransition('trial', 'active')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('trial', 'expired')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('active', 'past_due')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('active', 'cancelled')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('active', 'expired')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('past_due', 'active')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('cancelled', 'expired')).toBe(true);

    // Bloqueados estrictamente
    expect(SubscriptionStateMachine.canTransition('cancelled', 'active')).toBe(false);
    expect(SubscriptionStateMachine.canTransition('expired', 'active')).toBe(false);
  });

  it('debe evaluar límites de recursos con PlanLimitService denegando si excede', () => {
    // Dentro de límite (15 de 30 productos)
    const checkOk = PlanLimitService.checkLimit('products', 15, mockPlanInicial, mockActiveSubscription);
    expect(checkOk.allowed).toBe(true);
    expect(checkOk.percentUsed).toBe(50);
    expect(checkOk.upgradeRequired).toBe(false);

    // Límite alcanzado (30 de 30 productos)
    const checkFull = PlanLimitService.checkLimit('products', 30, mockPlanInicial, mockActiveSubscription);
    expect(checkFull.allowed).toBe(false);
    expect(checkFull.percentUsed).toBe(100);
    expect(checkFull.upgradeRequired).toBe(true);

    // Plan Premium (ilimitado)
    const checkPremium = PlanLimitService.checkLimit('products', 500, mockPlanPremium, mockActiveSubscription);
    expect(checkPremium.allowed).toBe(true);
    expect(checkPremium.upgradeRequired).toBe(false);
  });

  it('debe bloquear cualquier creación de recurso si la suscripción está cancelada o expirada', () => {
    const expiredSub: SubscriptionEntity = {
      ...mockActiveSubscription,
      status: 'expired',
    };
    const result = PlanLimitService.checkLimit('products', 2, mockPlanInicial, expiredSub);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.message).toContain('no se encuentra activa');
  });

  it('debe autorizar o restringir funcionalidades centralizadamente con FeatureAccessService', () => {
    // Dominio personalizado restringido en Plan Inicial
    const domainInit = FeatureAccessService.evaluateFeatureAccess(mockActiveSubscription, mockPlanInicial, 'custom_domain');
    expect(domainInit.allowed).toBe(false);
    expect(domainInit.upgradeRequired).toBe(true);
    expect(domainInit.minimumPlanSuggested).toBe('Plan Premium');

    // Dominio personalizado habilitado en Plan Premium
    const domainPrem = FeatureAccessService.evaluateFeatureAccess(mockActiveSubscription, mockPlanPremium, 'custom_domain');
    expect(domainPrem.allowed).toBe(true);
    expect(domainPrem.upgradeRequired).toBe(false);

    // Funcionalidades base universales (whatsapp_catalog) siempre permitidas para suscripción activa
    expect(FeatureAccessService.canUseFeature(mockActiveSubscription, mockPlanInicial, 'whatsapp_catalog')).toBe(true);
  });

  it('debe responder exhaustivamente a SubscriptionStatusService', () => {
    expect(SubscriptionStatusService.isActive(mockActiveSubscription)).toBe(true);
    expect(SubscriptionStatusService.isTrial(mockActiveSubscription)).toBe(false);
    expect(SubscriptionStatusService.canAccess(mockActiveSubscription)).toBe(true);
    expect(SubscriptionStatusService.canWrite(mockActiveSubscription)).toBe(true);

    const assessment = SubscriptionStatusService.evaluateAccess(mockActiveSubscription);
    expect(assessment.canAccess).toBe(true);
    expect(assessment.status).toBe('active');
    expect(assessment.daysRemaining).toBeGreaterThan(0);
  });
});

describe('Fase 10 - Métricas SaaS y Fórmulas Financieras', () => {
  const plans: PlanEntity[] = [
    {
      id: 'plan_inicial',
      name: 'Plan Inicial',
      slug: 'inicial',
      description: 'Básico',
      price_monthly: 29,
      price_annual: 290,
      billing_interval: 'MONTHLY',
      trial_days: 14,
      limits: {
        max_products: 30,
        max_images: 10,
        max_staff: 1,
        max_customers: 100,
        max_orders_per_month: 500,
        max_appointments_per_month: 200,
        custom_domain_allowed: false,
        analytics_allowed: false,
      },
      active_modules: ['products'],
      features: [],
      is_active: true,
      support_level: 'Estándar',
    },
    {
      id: 'plan_premium',
      name: 'Plan Premium',
      slug: 'premium',
      description: 'Avanzado',
      price_monthly: 79,
      price_annual: 790,
      billing_interval: 'MONTHLY',
      trial_days: 14,
      limits: {
        max_products: 9999,
        max_images: 9999,
        max_staff: 9999,
        max_customers: 9999,
        max_orders_per_month: 9999,
        max_appointments_per_month: 9999,
        custom_domain_allowed: true,
        analytics_allowed: true,
      },
      active_modules: ['products'],
      features: [],
      is_active: true,
      support_level: 'VIP',
    },
  ];

  const subscriptions: SubscriptionEntity[] = [
    {
      id: 'sub_1',
      organization_id: 'org_1',
      plan_id: 'plan_inicial',
      plan_name: 'Plan Inicial',
      status: 'active',
      billing_interval: 'MONTHLY',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      auto_renew: true,
      amount_paid: 29,
      currency: 'PEN',
      provider: 'Culqi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sub_2',
      organization_id: 'org_2',
      plan_id: 'plan_premium',
      plan_name: 'Plan Premium',
      status: 'active',
      billing_interval: 'ANNUAL',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      auto_renew: true,
      amount_paid: 790,
      currency: 'PEN',
      provider: 'Culqi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sub_3',
      organization_id: 'org_3',
      plan_id: 'plan_inicial',
      plan_name: 'Plan Inicial',
      status: 'trial',
      billing_interval: 'MONTHLY',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      auto_renew: true,
      amount_paid: 0,
      currency: 'PEN',
      provider: 'Culqi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sub_4',
      organization_id: 'org_4',
      plan_id: 'plan_inicial',
      plan_name: 'Plan Inicial',
      status: 'cancelled',
      billing_interval: 'MONTHLY',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      auto_renew: false,
      amount_paid: 29,
      currency: 'PEN',
      provider: 'Culqi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('debe calcular MRR y ARR exactos normalizando suscripciones anuales', () => {
    const metrics = SaaSMetricsService.calculateMetrics(subscriptions, plans);

    // sub_1: Mensual 29
    // sub_2: Anual 790 / 12 = 65.833...
    // Total MRR = 29 + 65.83 = 94.83
    expect(metrics.activeSubscriptionsCount).toBe(2);
    expect(metrics.trialSubscriptionsCount).toBe(1);
    expect(metrics.canceledSubscriptionsCount).toBe(1);
    expect(metrics.mrr).toBe(94.83);
    expect(metrics.arr).toBe(Math.round(94.83 * 12 * 100) / 100);

    expect(metrics.subscriptionsByPlan['Plan Inicial']).toBe(1);
    expect(metrics.subscriptionsByPlan['Plan Premium']).toBe(1);
  });
});

describe('Fase 10 - Webhooks, Firmas Criptográficas e Idempotencia', () => {
  it('debe verificar firmas criptográficas en WebhookSignatureVerifier con HMAC-SHA256 estricto', () => {
    const secretKey = 'my_production_culqi_secret_key_123';
    const rawBody = '{"event": "payment.succeeded"}';
    const validHmac = crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');

    // Cabecera válida con HMAC auténtico
    const isValid = WebhookSignatureVerifier.verifySignature({
      provider: 'Culqi',
      rawBody,
      headers: { 'x-culqi-signature': validHmac },
      secretKey,
    });
    expect(isValid).toBe(true);

    // Cabecera ausente
    expect(() =>
      WebhookSignatureVerifier.verifySignature({
        provider: 'Culqi',
        rawBody,
        headers: {},
        secretKey,
      })
    ).toThrowError(WebhookVerificationError);

    // Firma con hash alterado o longitud incorrecta
    expect(() =>
      WebhookSignatureVerifier.verifySignature({
        provider: 'Culqi',
        rawBody,
        headers: { 'x-culqi-signature': 'abc' },
        secretKey,
      })
    ).toThrowError(WebhookVerificationError);

    // Firma falsa / manipulada
    expect(() =>
      WebhookSignatureVerifier.verifySignature({
        provider: 'Culqi',
        rawBody,
        headers: { 'x-culqi-signature': 'a'.repeat(64) },
        secretKey,
      })
    ).toThrowError(WebhookVerificationError);
  });

  it('debe bloquear el procesamiento y arrojar PAYMENT PROVIDER PENDING CONFIGURATION si no hay secreto configurado', () => {
    expect(() =>
      WebhookSignatureVerifier.verifySignature({
        provider: 'Culqi',
        rawBody: '{"event": "payment.succeeded"}',
        headers: { 'x-culqi-signature': 'sec_culqi_signature_token' },
      })
    ).toThrowError(/PAYMENT PROVIDER PENDING CONFIGURATION/);
  });

  it('debe rechazar firmas cuando se configura una clave secreta y la firma no coincide', () => {
    expect(() =>
      WebhookSignatureVerifier.verifySignature({
        provider: 'Culqi',
        rawBody: '{"event": "payment.succeeded"}',
        headers: { 'x-culqi-signature': 'invalid_secret_provided' },
        secretKey: 'my_production_culqi_secret_key_123',
      })
    ).toThrowError(WebhookVerificationError);
  });
});

describe('Fase 10 - Data: Model Mappers y Persistencia', () => {
  it('debe mapear filas crudas de base de datos a SubscriptionEntity con SubscriptionModel', () => {
    const rawRow = {
      id: 'sub_uuid_1',
      organization_id: 'org_uuid_1',
      plan_id: 'plan_profesional',
      plan_name: 'Plan Profesional',
      status: 'active',
      billing_interval: 'ANNUAL',
      amount_paid: 490,
      cancel_at_period_end: true,
      provider: 'Culqi',
      provider_customer_id: 'cus_123',
      limits: { max_products: 150 },
    };

    const entity = SubscriptionModel.fromDatabaseRow(rawRow);
    expect(entity.id).toBe('sub_uuid_1');
    expect(entity.billing_interval).toBe('ANNUAL');
    expect(entity.amount_paid).toBe(490);
    expect(entity.cancel_at_period_end).toBe(true);
    expect(entity.provider_customer_id).toBe('cus_123');
  });

  it('debe mapear filas crudas de planes a PlanEntity con PlanModel', () => {
    const rawPlanRow = {
      id: 'plan_profesional',
      name: 'Plan Profesional',
      slug: 'profesional',
      price_monthly: 49,
      price_annual: 490,
      max_products: 150,
      custom_domain_allowed: false,
      analytics_allowed: true,
    };

    const plan = PlanModel.fromDatabaseRow(rawPlanRow);
    expect(plan.id).toBe('plan_profesional');
    expect(plan.price_monthly).toBe(49);
    expect(plan.limits.max_products).toBe(150);
    expect(plan.limits.analytics_allowed).toBe(true);
  });
});
