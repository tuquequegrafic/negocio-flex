# Negocio Flex — Control Centralizado de Límites y Funcionalidades (Fase 10)

## 1. Límites por Plan
Cada plan establece límites estrictos en base de datos:
- `max_products`: Productos activos en el catálogo.
- `max_images`: Fotografías en la galería visual.
- `max_staff`: Usuarios colaboradores con acceso al panel administrativo.
- `max_customers`: Clientes registrados en el módulo CRM.
- `max_orders_per_month`: Límite mensual de pedidos.
- `max_appointments_per_month`: Límite mensual de citas reservadas.
- `custom_domain_allowed`: Posibilidad de vincular dominio personalizado (`.com`, `.pe`).
- `analytics_allowed`: Acceso a métricas de ventas avanzadas.

## 2. Servicios Centralizados
- **`PlanLimitService`**:
  - `checkLimit(resource, count, plan, subscription)`: Evalúa si un nuevo recurso puede ser creado o incrementado.
  - Deniega escrituras si la suscripción se encuentra en estado `cancelled` o `expired`.
- **`FeatureAccessService`**:
  - `canUseFeature(subscription, plan, featureKey)`: Provee autorización declarativa de módulos.
  - Elimina comparaciones dispersas en componentes (`if (plan === "PRO")`).
- **Hook `useFeatureAccess` y Guard `FeatureGuard`**:
  - Encapsulan visualmente los componentes restringidos informando con elegancia al usuario qué plan se requiere para desbloquear la funcionalidad.
