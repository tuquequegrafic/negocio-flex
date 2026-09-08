/**
 * Negocio Flex - Payment Repository Interface (Fase 10: Dominio)
 */

import { PaymentTransactionEntity } from '../entities/payment_transaction_entity';

export interface ProcessPaymentParams {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly planId: string;
  readonly planName: string;
  readonly amount: number;
  readonly currency?: string;
  readonly gateway: string;
  readonly paymentMethodType: 'CARD' | 'QR' | 'TRANSFER';
  readonly idempotencyKey: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly cardLast4?: string;
  readonly cardBrand?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface PaymentRepository {
  getPaymentsByOrgId(organizationId: string): Promise<PaymentTransactionEntity[]>;
  getTransactionById(transactionId: string): Promise<PaymentTransactionEntity | null>;
  getTransactionByIdempotencyKey(idempotencyKey: string): Promise<PaymentTransactionEntity | null>;
  recordTransaction(params: ProcessPaymentParams): Promise<PaymentTransactionEntity>;
}
