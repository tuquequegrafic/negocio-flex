/**
 * Negocio Flex - Payment Transaction Entity (Fase 10: Dominio Puro)
 * Libro mayor de transacciones financieras SaaS con idempotencia y auditoría.
 */

export type PaymentStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'REFUNDED';
export type PaymentMethodType = 'CARD' | 'QR' | 'TRANSFER';
export type PaymentGatewayType = 'Culqi' | 'Mercado Pago' | 'Niubiz' | 'Izipay' | 'Yape / Plin' | 'Generic';

export interface PaymentTransactionEntity {
  readonly id: string;
  readonly organization_id: string;
  readonly organization_name: string;
  readonly subscription_id?: string;
  readonly plan_id: string;
  readonly plan_name: string;
  readonly amount: number;
  readonly currency: string;
  readonly payment_gateway: PaymentGatewayType | string;
  readonly payment_method_type: PaymentMethodType;
  readonly transaction_id: string;
  readonly idempotency_key?: string;
  readonly status: PaymentStatus;
  readonly customer_name: string;
  readonly customer_email: string;
  readonly card_last4?: string;
  readonly card_brand?: string;
  readonly webhook_verified: boolean;
  readonly receipt_url?: string;
  readonly metadata?: Record<string, unknown>;
  readonly created_at: string;
  readonly updated_at?: string;
}
