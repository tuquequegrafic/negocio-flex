import { PosSaleRequest, PosSaleResult } from '../entities/pos_sale_entity';
import { SalesReceiptEntity } from '../entities/sales_receipt_entity';

export interface PosRepository {
  processSale(request: PosSaleRequest): Promise<PosSaleResult>;
  getReceiptById(receiptId: string): Promise<SalesReceiptEntity | null>;
  getReceiptsByShift(shiftId: string): Promise<SalesReceiptEntity[]>;
}
