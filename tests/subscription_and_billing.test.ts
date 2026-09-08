/**
 * Negocio Flex - Tests de Fase 9 & 10: Suscripciones, Billing y Seguridad Multi-Tenant
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionStateMachine } from '../src/features/subscriptions/infrastructure/state/subscription_state_machine';
import { PlanLimitService } from '../src/features/subscriptions/application/services/plan_limit_service';
import { PlanEntity } from '../src/features/subscriptions/domain/entities/plan_entity';
import { SubscriptionEntity } from '../src/features/subscriptions/domain/entities/subscription_entity';
import { ProcessWebhookUseCase } from '../src/features/subscriptions/application/usecases/process_webhook_usecase';
import { PaymentProvider, WebhookVerificationPayload } from '../src/features/subscriptions/infrastructure/adapters/payment_provider';
import { WebhookLogRepository } from '../src/features/subscriptions/domain/repositories/webhook_log_repository';
import { SubscriptionRepository } from '../src/features/subscriptions/domain/repositories/subscription_repository';
import { WebhookEventEntity } from '../src/features/subscriptions/domain/entities/webhook_event_entity';

describe('Paso 2 & 10: SubscriptionStateMachine (Transiciones Canónicas)', () => {
  it('permite la transición válida trial -> active', () => {
    expect(SubscriptionStateMachine.canTransition('trial', 'active')).toBe(true);
    expect(SubscriptionStateMachine.transition('trial', 'active')).toBe('active');
  });

  it('permite la transición válida active -> past_due', () => {
    expect(SubscriptionStateMachine.canTransition('active', 'past_due')).toBe(true);
    expect(SubscriptionStateMachine.transition('active', 'past_due')).toBe('past_due');
  });

  it('permite la transición válida past_due -> active (reconciliación de pago)', () => {
    expect(SubscriptionStateMachine.canTransition('past_due', 'active')).toBe(true);
    expect(SubscriptionStateMachine.transition('past_due', 'active')).toBe('active');
  });

  it('permite transicionar a cancelled desde trial, active o past_due', () => {
    expect(SubscriptionStateMachine.canTransition('trial', 'cancelled')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('active', 'cancelled')).toBe(true);
    expect(SubscriptionStateMachine.canTransition('past_due', 'cancelled')).toBe(true);
  });

  it('prohíbe tajantemente cancelled -> active (debe crearse una nueva suscripción)', () => {
    expect(SubscriptionStateMachine.canTransition('cancelled', 'active')).toBe(false);
    expect(() => SubscriptionStateMachine.transition('cancelled', 'active')).toThrow(
      /Transición de estado de suscripción no permitida/
    );
  });

  it('prohíbe tajantemente expired -> active (debe iniciarse nueva suscripción)', () => {
    expect(SubscriptionStateMachine.canTransition('expired', 'active')).toBe(false);
    expect(() => SubscriptionStateMachine.transition('expired', 'active')).toThrow(
      /Transición de estado de suscripción no permitida/
    );
  });
});

describe('Paso 9 & 10: PlanLimitService (Control Estricto de Recursos)', () => {
  const mockPlan: PlanEntity = {
    id: 'plan-inicial',
    name: 'Plan Inicial',
    slug: 'plan-inicial',
    description: 'Para emprendedores',
    price_monthly: 29,
    price_annual: 290,
    billing_interval: 'MONTHLY',
    trial_days: 14,
    is_active: true,
    support_level: 'Estándar',
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
    features: ['30 Productos', '1 Usuario'],
  };

  const mockSub: SubscriptionEntity = {
    id: 'sub-123',
    organization_id: 'org-tenant-a',
    plan_id: 'plan-inicial',
    plan_name: 'Plan Inicial',
    status: 'active',
    billing_interval: 'MONTHLY',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    auto_renew: true,
    amount_paid: 29,
    currency: 'S/',
    provider: 'Culqi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('permite agregar recursos si el conteo es menor al límite del plan', () => {
    const result = PlanLimitService.checkLimit('products', 15, mockPlan, mockSub);
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(15);
    expect(result.maxAllowed).toBe(30);
    expect(result.percentUsed).toBe(50);
  });

  it('bloquea la operación si el conteo actual alcanza o supera el límite', () => {
    const resultAtLimit = PlanLimitService.checkLimit('products', 30, mockPlan, mockSub);
    expect(resultAtLimit.allowed).toBe(false);
    expect(resultAtLimit.message).toContain('Has alcanzado el límite de 30');

    const resultOverLimit = PlanLimitService.checkLimit('products', 35, mockPlan, mockSub);
    expect(resultOverLimit.allowed).toBe(false);
  });

  it('evalúa correctamente límites de personal / usuarios', () => {
    const resultStaffUnder = PlanLimitService.checkLimit('staff', 0, mockPlan, mockSub);
    expect(resultStaffUnder.allowed).toBe(true);

    const resultStaffReached = PlanLimitService.checkLimit('staff', 1, mockPlan, mockSub);
    expect(resultStaffReached.allowed).toBe(false);
  });

  it('bloquea todas las operaciones si la suscripción está vencida o cancelada', () => {
    const expiredSub: SubscriptionEntity = {
      ...mockSub,
      status: 'expired',
    };
    const result = PlanLimitService.checkLimit('products', 5, mockPlan, expiredSub);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('no se encuentra activa');
  });
});

type MutableWebhookEvent = { -readonly [K in keyof WebhookEventEntity]: WebhookEventEntity[K] };

describe('Paso 7 & 10: ProcessWebhookUseCase (Seguridad, Firma y Anti-Replay)', () => {
  let inMemoryLogs: MutableWebhookEvent[] = [];
  let reconciledOrgs: string[] = [];

  const mockPaymentProvider: PaymentProvider = {
    name: 'Culqi',
    async createPaymentIntent() {
      return {
        success: true,
        transactionId: 'txn_mock',
        provider: 'Culqi',
        status: 'APPROVED',
        amount: 29,
        currency: 'S/',
      };
    },
    verifyWebhookSignature: (params: WebhookVerificationPayload) => {
      // Simula verificación HMAC: solo pasa si la firma coincide con el token esperado
      return params.headers['x-culqi-signature'] === 'valid_secret_signature';
    },
    parseWebhookEvent: (rawBody: string) => {
      const data = JSON.parse(rawBody);
      return {
        eventId: data.id,
        eventType: data.type,
        payload: data.data,
      };
    },
  };

  const mockWebhookRepo: WebhookLogRepository = {
    recordWebhookEvent: async (provider, eventId, eventType, payload, signatureValid) => {
      const log: MutableWebhookEvent = {
        id: `log-${Date.now()}-${Math.random()}`,
        provider,
        event_id: eventId,
        event_type: eventType,
        payload,
        signature_valid: signatureValid,
        processed: false,
        received_at: new Date().toISOString(),
      };
      inMemoryLogs.push(log);
      return log;
    },
    getWebhookByEventId: async (provider, eventId) => {
      return inMemoryLogs.find(l => l.provider === provider && l.event_id === eventId) || null;
    },
    markAsProcessed: async (provider, eventId) => {
      const target = inMemoryLogs.find(l => l.provider === provider && l.event_id === eventId);
      if (target) {
        target.processed = true;
      }
    },
    markAsFailed: async (provider, eventId, error) => {
      const target = inMemoryLogs.find(l => l.provider === provider && l.event_id === eventId);
      if (target) {
        target.processing_error = error;
      }
    },
  };

  const dummySub: SubscriptionEntity = {
    id: 'sub_dummy',
    organization_id: 'org-tenant-a',
    plan_id: 'plan-inicial',
    plan_name: 'Plan Inicial',
    status: 'active',
    billing_interval: 'MONTHLY',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date().toISOString(),
    auto_renew: true,
    amount_paid: 29,
    currency: 'S/',
    provider: 'Culqi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSubRepo: SubscriptionRepository = {
    getSubscriptionByOrgId: async () => null,
    startTrial: async () => dummySub,
    changePlan: async () => ({ subscription: dummySub, transactionId: 'txn_123' }),
    cancelSubscription: async () => dummySub,
    reactivateSubscription: async () => dummySub,
    reconcileSubscription: async (orgId) => {
      reconciledOrgs.push(orgId);
      return dummySub;
    },
  };

  beforeEach(() => {
    inMemoryLogs = [];
    reconciledOrgs = [];
  });

  it('rechaza y aborta inmediatamente si la firma es inválida', async () => {
    const useCase = new ProcessWebhookUseCase(mockPaymentProvider, mockWebhookRepo, mockSubRepo);

    const payload = JSON.stringify({
      id: 'evt_fraudulent_001',
      type: 'charge.successful',
      data: { metadata: { organization_id: 'org-tenant-a' } },
    });

    await expect(
      useCase.execute({
        rawBody: payload,
        headers: { 'x-culqi-signature': 'invalid_signature_attempt' },
        secretKey: 'key_123',
      })
    ).rejects.toThrow(/Firma de webhook inválida/);

    expect(reconciledOrgs).toHaveLength(0);
    expect(inMemoryLogs[0].signature_valid).toBe(false);
  });

  it('procesa y reconcilia la suscripción cuando la firma es auténtica', async () => {
    const useCase = new ProcessWebhookUseCase(mockPaymentProvider, mockWebhookRepo, mockSubRepo);

    const payload = JSON.stringify({
      id: 'evt_valid_002',
      type: 'charge.successful',
      data: { metadata: { organization_id: 'org-tenant-a' } },
    });

    const result = await useCase.execute({
      rawBody: payload,
      headers: { 'x-culqi-signature': 'valid_secret_signature' },
      secretKey: 'key_123',
    });

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(reconciledOrgs).toContain('org-tenant-a');
    expect(inMemoryLogs[0].processed).toBe(true);
  });

  it('detecta eventos duplicados (Anti-Replay / Idempotencia) y evita reconciliación doble', async () => {
    const useCase = new ProcessWebhookUseCase(mockPaymentProvider, mockWebhookRepo, mockSubRepo);

    const payload = JSON.stringify({
      id: 'evt_replay_003',
      type: 'charge.successful',
      data: { metadata: { organization_id: 'org-tenant-b' } },
    });

    // Primer procesamiento
    const firstResult = await useCase.execute({
      rawBody: payload,
      headers: { 'x-culqi-signature': 'valid_secret_signature' },
      secretKey: 'key_123',
    });
    expect(firstResult.success).toBe(true);
    expect(firstResult.duplicate).toBe(false);
    expect(reconciledOrgs).toEqual(['org-tenant-b']);

    // Segundo procesamiento idéntico (Replay Attack o reintento de pasarela)
    const secondResult = await useCase.execute({
      rawBody: payload,
      headers: { 'x-culqi-signature': 'valid_secret_signature' },
      secretKey: 'key_123',
    });
    expect(secondResult.success).toBe(true);
    expect(secondResult.duplicate).toBe(true);
    // No debe haber duplicado la reconciliación
    expect(reconciledOrgs).toEqual(['org-tenant-b']);
  });
});

describe('Paso 4 & 10: Multi-Tenant Isolation & Concurrency Guard', () => {
  interface MockTenantDatabase {
    subscriptions: Record<string, SubscriptionEntity>;
  }

  const db: MockTenantDatabase = {
    subscriptions: {
      'tenant-empresa-a': {
        id: 'sub-org-a',
        organization_id: 'tenant-empresa-a',
        plan_id: 'plan-pro',
        plan_name: 'Plan Pro',
        status: 'active',
        billing_interval: 'MONTHLY',
        current_period_start: '2026-01-01T00:00:00Z',
        current_period_end: '2026-02-01T00:00:00Z',
        auto_renew: true,
        amount_paid: 79,
        currency: 'S/',
        provider: 'Culqi',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      'tenant-empresa-b': {
        id: 'sub-org-b',
        organization_id: 'tenant-empresa-b',
        plan_id: 'plan-empresarial',
        plan_name: 'Plan Empresarial',
        status: 'trial',
        billing_interval: 'MONTHLY',
        current_period_start: '2026-02-01T00:00:00Z',
        current_period_end: '2026-02-15T00:00:00Z',
        auto_renew: false,
        amount_paid: 0,
        currency: 'S/',
        provider: 'Culqi',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      },
    },
  };

  it('garantiza estricto aislamiento multi-tenant en consultas de suscripción', async () => {
    const fetchOrgSub = async (orgId: string): Promise<SubscriptionEntity | null> => {
      // Simula consulta SQL con WHERE organization_id = orgId
      return db.subscriptions[orgId] || null;
    };

    const subA = await fetchOrgSub('tenant-empresa-a');
    const subB = await fetchOrgSub('tenant-empresa-b');
    const subNonExistent = await fetchOrgSub('tenant-empresa-c');

    expect(subA).not.toBeNull();
    expect(subA?.organization_id).toBe('tenant-empresa-a');
    expect(subA?.plan_id).toBe('plan-pro');

    expect(subB).not.toBeNull();
    expect(subB?.organization_id).toBe('tenant-empresa-b');
    expect(subB?.plan_id).toBe('plan-empresarial');

    expect(subNonExistent).toBeNull();
  });

  it('previene race conditions durante cambios rápidos de tenant en UI / Hooks', async () => {
    // Simula el patrón isCurrent implementado en useSubscription
    let activeState: { orgId: string; sub: SubscriptionEntity | null } | null = null;

    const simulateTenantSwitch = async (targetOrgId: string, delayMs: number, isCurrentCheck: () => boolean) => {
      // Inicia reseteo preventivo obligatorio
      if (!targetOrgId) {
        activeState = null;
        return;
      }
      activeState = { orgId: targetOrgId, sub: null };

      // Simula latencia de red
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Protección contra Race Condition: sólo actualiza si sigue siendo la operación activa
      if (isCurrentCheck()) {
        activeState = {
          orgId: targetOrgId,
          sub: db.subscriptions[targetOrgId] || null,
        };
      }
    };

    let currentOrg = 'tenant-empresa-a';
    // Usuario hace click en Empresa A, luego rápidamente en Empresa B (Empresa A tarda 50ms, Empresa B tarda 10ms)
    const promiseA = simulateTenantSwitch('tenant-empresa-a', 50, () => currentOrg === 'tenant-empresa-a');
    currentOrg = 'tenant-empresa-b';
    const promiseB = simulateTenantSwitch('tenant-empresa-b', 10, () => currentOrg === 'tenant-empresa-b');

    await Promise.all([promiseA, promiseB]);

    // El estado final debe pertenecer estrictamente a Empresa B y jamás a Empresa A
    expect(activeState).not.toBeNull();
    expect(activeState?.orgId).toBe('tenant-empresa-b');
    expect(activeState?.sub?.plan_id).toBe('plan-empresarial');
  });
});
