# Negocio Flex — Fase 10: Arquitectura SaaS, Suscripciones y Facturación

## 1. Visión General
La Fase 10 transforma a **NEGOCIO FLEX** en una plataforma SaaS Multi-Tenant madura con capacidades completas de:
- Gestión de planes y catálogo de servicios.
- Suscripciones por organización (`tenant`) como unidad fundamental de facturación.
- Máquina de estados determinista (`trial`, `active`, `past_due`, `cancelled`, `expired`).
- Evaluación centralizada de cuotas y límites de recursos.
- Autorización centralizada de funcionalidades (`FeatureAccessService`).
- Abstracción de pasarela de facturación (`BillingProvider`).
- Procesamiento idempotente de webhooks con verificación criptográfica HMAC.
- Métricas ejecutivas SaaS (MRR, ARR, distribución por plan).

## 2. Diagrama de Capas (Clean Architecture)

```
src/features/subscriptions/
│
├── domain/                      [Reglas de negocio puras / Entidades / Value Objects]
│   ├── entities/               (SubscriptionEntity, PlanEntity, PaymentTransactionEntity, InvoiceEntity, etc.)
│   ├── repositories/           (SubscriptionRepository, PlanRepository, PaymentRepository, BillingProvider, etc.)
│   ├── value_objects/          (BillingIntervalVO, SubscriptionPeriodVO, MoneyVO)
│   └── errors/                 (SubscriptionNotFoundError, PlanLimitExceededError, InvalidSubscriptionStateError, etc.)
│
├── application/                 [Casos de Uso / Servicios de Aplicación / DTOs]
│   ├── usecases/               (GetCurrentSubscription, CancelSubscription, CheckPlanLimit, ChangePlan, FeatureAccess, SaaSMetrics)
│   ├── services/               (SubscriptionStatusService, FeatureAccessService, PlanLimitService, SaaSMetricsService)
│   └── dto/                    (SubscriptionDTO, ResourceUsageDTO, SaaSMetricsDTO)
│
├── data/                        [Mapeadores / Modelos de Persistencia]
│   └── models/                 (SubscriptionModel, PlanModel)
│
├── infrastructure/              [Adaptadores Externos / Supabase / Billing / Webhooks]
│   ├── repositories/           (SupabaseSubscriptionRepository, SupabasePlanRepository, SupabasePaymentRepository)
│   ├── billing/                (ProductionBillingProviderAdapter)
│   ├── webhooks/               (WebhookSignatureVerifier)
│   └── state/                  (SubscriptionStateMachine)
│
└── presentation/                [UI / Componentes / Hooks / Screens / Guards]
    ├── hooks/                  (useSubscription, usePlanLimits, useFeatureAccess)
    ├── components/             (SubscriptionStatus, UsageLimits, UpgradeDialog, CancelSubscriptionDialog)
    ├── screens/                (SubscriptionScreen, PlansScreen, BillingScreen)
    └── guards/                 (FeatureGuard)
```

## 3. Modelo Multi-Tenant
- La unidad de facturación es la **Organización** (`organization_id`).
- Un usuario individual no posee suscripciones; el usuario interactúa a través de su rol dentro de la organización activa (`Owner`, `Admin`, `Staff`, etc.).
- Aislamiento estricto garantizado mediante políticas PostgreSQL RLS y procedimientos `SECURITY DEFINER` con `search_path = public, pg_temp`.
