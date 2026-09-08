# Negocio Flex — Estrategia de Testing y Cobertura (Fase 10)

## 1. Cobertura de Pruebas Automatizadas
La suite de pruebas de la Fase 10 cubre exhaustivamente los siguientes dominios:

1. **Dominio:**
   - Creación de suscripciones e inicialización de periodos.
   - Transiciones estrictas de la máquina de estados.
   - Restricción de transiciones inválidas (`cancelled -> active`, `expired -> active`).
   - Normalización de estados de suscripción.

2. **Aplicación:**
   - Evaluación de límites y cuotas con `PlanLimitService`.
   - Autorización de funcionalidades con `FeatureAccessService`.
   - Cálculo determinista de métricas SaaS con `SaaSMetricsService` (MRR, ARR, distribución).

3. **Seguridad y Webhooks:**
   - Verificación de firmas HMAC en `WebhookSignatureVerifier`.
   - Idempotencia y anti-replay ante reenvío de eventos idénticos.
   - Aislamiento multi-tenant (prevención de IDOR y acceso cruzado).

4. **Regresión:**
   - Validación de no-rotura de funcionalidades de Fases 1 a 9.
