import { ReceiptDocumentType } from './sales_receipt_entity';

export interface PosSaleItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface PosSaleRequest {
  organizationId: string;
  cashRegisterId: string;
  shiftId: string;
  userId: string;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    document?: string;
  };
  items: PosSaleItemInput[];
  paymentMethod: 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER';
  cashReceived?: number;
  discount?: number;
  taxRate?: number;
  documentType?: ReceiptDocumentType;
  idempotencyKey?: string;
  notes?: string;
}

export interface PosSaleResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  receiptId: string;
  receiptNumber: string;
  documentType: ReceiptDocumentType;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  cashChange: number;
  customerName: string;
  shiftId: string;
  issuedAt: string;
}
