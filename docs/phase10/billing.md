# Negocio Flex — Arquitectura de Facturación y Pasarela (Fase 10)

## 1. Abstracción `BillingProvider`
El sistema desacopla el dominio de cualquier pasarela concreta mediante la interfaz:
```typescript
export interface BillingProvider {
  readonly name: string;
  createCustomer(params: BillingCustomerParams): Promise<BillingCustomerResult>;
  createSubscription(params: BillingSubscriptionParams): Promise<BillingSubscriptionResult>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<BillingSubscriptionResult>;
  resumeSubscription(subscriptionId: string): Promise<BillingSubscriptionResult>;
  changePlan(params: ChangePlanParams): Promise<BillingSubscriptionResult>;
  getSubscription(subscriptionId: string): Promise<BillingSubscriptionResult>;
  verifyWebhook(params: WebhookVerificationParams): boolean;
}
```

## 2. Declaración de Estado de Integración (Regla de Oro Sección 40)
- **Estado de Producción:** `PAYMENT PROVIDER PENDING CONFIGURATION`
- **Justificación Técnica:** La arquitectura está 100% lista para procesar transacciones reales con Culqi / Stripe / Mercado Pago. Sin embargo, no se simulan cobros falsos ni se finge una pasarela activa sin credenciales en el entorno.
- **Seguridad PCI-DSS:** Negocio Flex **NUNCA** almacena números de tarjeta, CVV o fechas de expiración en bases de datos ni en local storage. Todos los cobros se delegan a tokenización segura de la pasarela.

## 3. Comprobantes de Pago
Las transacciones se registran en `payment_transactions` y el modelo de dominio `InvoiceEntity` administra el ciclo de facturación con trazabilidad completa.
