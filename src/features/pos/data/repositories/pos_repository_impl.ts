import { PosRepository } from '../../domain/repositories/pos_repository';
import { PosSaleRequest, PosSaleResult } from '../../domain/entities/pos_sale_entity';
import { SalesReceiptEntity } from '../../domain/entities/sales_receipt_entity';
import { PosDataSource } from '../datasources/pos_datasource';

export class PosRepositoryImpl implements PosRepository {
  constructor(private readonly dataSource: PosDataSource) {}

  async processSale(request: PosSaleRequest): Promise<PosSaleResult> {
    return await this.dataSource.processSale(request);
  }

  async getReceiptById(receiptId: string): Promise<SalesReceiptEntity | null> {
    return await this.dataSource.getReceiptById(receiptId);
  }

  async getReceiptsByShift(shiftId: string): Promise<SalesReceiptEntity[]> {
    return await this.dataSource.getReceiptsByShift(shiftId);
  }
}
