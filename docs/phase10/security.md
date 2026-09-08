# Negocio Flex — Seguridad, RLS y Aislamiento Multi-Tenant (Fase 10)

## 1. Zero Trust y Protección contra Manipulación en DevTools
- **Regla Fundamental:** El cliente (frontend) nunca decide el precio, ni el estado de la suscripción, ni sus cuotas de recursos.
- Todo cambio de plan se canaliza mediante el procedimiento PostgreSQL `process_subscription_upgrade_downgrade`:
  - Lee el precio directamente de la tabla autoritativa `plans` en PostgreSQL.
  - Verifica membresía activa en la organización (`is_member_of_org(p_org_id)`).
  - Emplea `SECURITY DEFINER` con `SET search_path = public, pg_temp` para impedir ataques de secuestro de ruta de búsqueda.

## 2. Políticas de Row Level Security (RLS)
- **`subscriptions`**:
  - `SELECT`: Solo miembros de la organización (`is_member_of_org(organization_id)`) o Super Administradores.
  - `INSERT / UPDATE / DELETE`: Denegado explícitamente a clientes regulares. Solo accesible mediante funciones RPC `SECURITY DEFINER` o `is_super_admin()`.
- **`payment_transactions`**:
  - `SELECT`: Restringido a miembros de la organización.
  - Modificaciones directas denegadas.
- **`webhook_logs`**:
  - Exclusivo para Super Administradores y llamadas de infraestructura del servidor.
