export type ReceiptDocumentType = 'TICKET' | 'BOLETA' | 'FACTURA';
export type ReceiptStatus = 'ISSUED' | 'ANNULLLED';

export interface SalesReceiptEntity {
  id: string;
  organizationId: string;
  orderId: string;
  cashShiftId: string | null;
  documentType: ReceiptDocumentType;
  series: string;
  number: number;
  fullNumber: string;
  customerName: string;
  customerDocument: string | null;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  cashChange: number;
  status: ReceiptStatus;
  issuedAt: string;
}

export interface ReceiptSeriesEntity {
  id: string;
  organizationId: string;
  documentType: ReceiptDocumentType;
  series: string;
  currentNumber: number;
  isActive: boolean;
  createdAt: string;
}
