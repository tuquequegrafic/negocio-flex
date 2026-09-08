/**
 * Negocio Flex - Subscription & Billing Domain Errors (Fase 10: Dominio Puro)
 * Errores fuertemente tipados para el ciclo de vida de suscripciones y facturación.
 */

export class SubscriptionDomainError extends Error {
  readonly code: string;

  constructor(message: string, code = 'SUBSCRIPTION_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SubscriptionNotFoundError extends SubscriptionDomainError {
  constructor(organizationId: string) {
    super(
      `No se encontró una suscripción activa para la organización: ${organizationId}`,
      'SUBSCRIPTION_NOT_FOUND'
    );
  }
}

export class PlanNotFoundError extends SubscriptionDomainError {
  constructor(planId: string) {
    super(
      `El plan solicitado no existe o no se encuentra disponible: ${planId}`,
      'PLAN_NOT_FOUND'
    );
  }
}

export class PlanLimitExceededError extends SubscriptionDomainError {
  readonly resource: string;
  readonly currentCount: number;
  readonly maxAllowed: number;

  constructor(resource: string, currentCount: number, maxAllowed: number) {
    super(
      `Límite de recursos excedido para "${resource}": ${currentCount} en uso de un máximo de ${maxAllowed}`,
      'PLAN_LIMIT_EXCEEDED'
    );
    this.resource = resource;
    this.currentCount = currentCount;
    this.maxAllowed = maxAllowed;
  }
}

export class InvalidSubscriptionStateError extends SubscriptionDomainError {
  readonly currentStatus: string;
  readonly attemptedTransition: string;

  constructor(currentStatus: string, attemptedTransition: string) {
    super(
      `Transición de estado inválida para suscripción: no se permite cambiar de "${currentStatus}" a "${attemptedTransition}"`,
      'INVALID_SUBSCRIPTION_STATE'
    );
    this.currentStatus = currentStatus;
    this.attemptedTransition = attemptedTransition;
  }
}

export class BillingProviderError extends SubscriptionDomainError {
  readonly provider: string;
  readonly rawError?: unknown;

  constructor(provider: string, message: string, rawError?: unknown) {
    super(
      `Error en proveedor de facturación [${provider}]: ${message}`,
      'BILLING_PROVIDER_ERROR'
    );
    this.provider = provider;
    this.rawError = rawError;
  }
}

export class WebhookVerificationError extends SubscriptionDomainError {
  readonly provider: string;

  constructor(provider: string, details = 'Firma criptográfica inválida o ausente') {
    super(
      `Fallo de verificación de webhook [${provider}]: ${details}`,
      'WEBHOOK_VERIFICATION_FAILED'
    );
    this.provider = provider;
  }
}

export class DuplicateWebhookError extends SubscriptionDomainError {
  readonly eventId: string;
  readonly provider: string;

  constructor(provider: string, eventId: string) {
    super(
      `Webhook duplicado detectado: el evento ${eventId} ya fue registrado o procesado por ${provider}`,
      'DUPLICATE_WEBHOOK_EVENT'
    );
    this.eventId = eventId;
    this.provider = provider;
  }
}

export class UnauthorizedSubscriptionOperationError extends SubscriptionDomainError {
  readonly organizationId: string;
  readonly userId?: string;

  constructor(organizationId: string, userId?: string, reason = 'Permisos insuficientes') {
    super(
      `Operación de suscripción no autorizada en la organización ${organizationId}${userId ? ` por usuario ${userId}` : ''}: ${reason}`,
      'UNAUTHORIZED_SUBSCRIPTION_OPERATION'
    );
    this.organizationId = organizationId;
    this.userId = userId;
  }
}
