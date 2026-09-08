# Negocio Flex — Webhooks, Seguridad e Idempotencia (Fase 10)

## 1. Eventos Soportados
- `checkout.completed` / `payment.succeeded`: Cobro inicial y activación del plan.
- `subscription.created`: Creación y vinculación de suscripción externa.
- `subscription.updated`: Modificación de plan, renovación o cambio de periodo.
- `subscription.deleted` / `subscription.canceled`: Cancelación de suscripción.
- `invoice.paid`: Confirmación de pago recurrente.
- `invoice.payment_failed` / `payment.failed`: Fallo en cobro; transición a `past_due`.

## 2. Verificación de Firma Criptográfica
- Implementado en `WebhookSignatureVerifier`:
  - Se exige cabecera de firma (`x-culqi-signature`, `stripe-signature`, etc.).
  - Cargas sin firma o con firmas manipuladas son rechazadas con `401 / 403` y registradas en `webhook_logs` con `signature_valid = FALSE`.

## 3. Idempotencia y Anti-Replay
- **Índice Único en BD:** `CREATE UNIQUE INDEX idx_webhook_logs_provider_event ON public.webhook_logs(provider, event_id);`
- Si la pasarela reenvía el mismo evento (por retry de red o concurrencia), la base de datos detecta el conflicto y la capa de aplicación descarta la ejecución sin duplicar cobros ni alterar métricas.
- La tabla `payment_transactions` cuenta adicionalmente con `idempotency_key` con índice único condicional.
