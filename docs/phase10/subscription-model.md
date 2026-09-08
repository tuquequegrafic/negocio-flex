# Negocio Flex — Modelo de Suscripciones y Máquina de Estados (Fase 10)

## 1. Entidad Subscription
Campos canónicos de la entidad `SubscriptionEntity`:
- `id`: Identificador único UUID.
- `organization_id`: Tenant asociado (Clave Foránea hacia `organizations.id`).
- `plan_id`: Clave del plan asignado (`plan_inicial`, `plan_profesional`, `plan_premium`).
- `status`: Estado tipado en PostgreSQL (`trial`, `active`, `past_due`, `cancelled`, `expired`).
- `billing_interval`: `MONTHLY` o `ANNUAL`.
- `current_period_start`: Fecha de inicio del ciclo actual.
- `current_period_end`: Fecha de renovación o fin de ciclo.
- `trial_start` / `trial_end`: Fechas delimitadoras del periodo de prueba gratuito de 14 días.
- `cancel_at_period_end`: Booleano que indica si la suscripción no se renovará automáticamente al término del ciclo.
- `canceled_at`: Fecha y hora de solicitud de cancelación.
- `provider`: Pasarela de pagos (`Culqi`, etc.).
- `provider_customer_id`: Identificador del cliente en la pasarela externa.
- `provider_subscription_id`: Identificador de la suscripción en la pasarela externa.

## 2. Máquina de Estados Estricta
Estados permitidos y matriz determinista de transiciones:

| Estado Origen | Estado Destino | Permitido | Condición de Negocio |
| :--- | :--- | :---: | :--- |
| `trial` | `active` | ✅ | Pago exitoso de suscripción |
| `trial` | `expired` | ✅ | Finalización de periodo de 14 días sin método de pago |
| `active` | `past_due` | ✅ | Fallo en cobro recurrente; entra a gracia |
| `active` | `cancelled`| ✅ | Solicitud de cancelación por el tenant |
| `active` | `expired` | ✅ | Expiración por impago prolongado |
| `past_due` | `active` | ✅ | Regularización y cobro exitoso |
| `past_due` | `cancelled`| ✅ | Cancelación solicitada durante gracia |
| `past_due` | `expired` | ✅ | Vencimiento definitivo del periodo de gracia |
| `cancelled` | `expired` | ✅ | Fin del periodo de ciclo pagado |
| `cancelled` | `active` | ❌ | **BLOQUEADO**: Requiere nueva suscripción / checkout |
| `expired` | `active` | ❌ | **BLOQUEADO**: Requiere nueva suscripción / checkout |

## 3. Fuente de Verdad Canónica
`SubscriptionStatusService` en TypeScript y `validate_subscription_status_transition` en PostgreSQL garantizan que ninguna pantalla o endpoint invente reglas de acceso divergentes.
