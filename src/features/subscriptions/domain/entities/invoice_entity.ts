/**
 * Negocio Flex - Invoice Entity (Fase 10: Dominio Puro)
 * Modela registros de facturación / comprobantes emitidos por pasarelas o el sistema SaaS.
 */

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';

export interface InvoiceEntity {
  readonly id: string;
  readonly provider_invoice_id?: string;
  readonly organization_id: string;
  readonly subscription_id?: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: InvoiceStatus;
  readonly invoice_date: string;
  readonly due_date?: string;
  readonly paid_at?: string;
  readonly hosted_invoice_url?: string;
  readonly pdf_url?: string;
  readonly line_items?: readonly {
    description: string;
    amount: number;
    quantity: number;
  }[];
  readonly created_at: string;
}
