import { CashShiftRepository, OpenShiftParams, CloseShiftParams, RecordCashMovementParams } from '../../domain/repositories/cash_shift_repository';
import { CashRegisterEntity } from '../../domain/entities/cash_register_entity';
import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashMovementEntity } from '../../domain/entities/cash_movement_entity';
import { PosDataSource } from '../datasources/pos_datasource';

export class CashShiftRepositoryImpl implements CashShiftRepository {
  constructor(private readonly dataSource: PosDataSource) {}

  async getCashRegisters(organizationId: string): Promise<CashRegisterEntity[]> {
    return await this.dataSource.getCashRegisters(organizationId);
  }

  async createCashRegister(organizationId: string, name: string, code: string): Promise<CashRegisterEntity> {
    return await this.dataSource.createCashRegister(organizationId, name, code);
  }

  async getActiveShift(organizationId: string, cashRegisterId?: string): Promise<CashShiftEntity | null> {
    return await this.dataSource.getActiveShift(organizationId, cashRegisterId);
  }

  async getShifts(organizationId: string, limit?: number): Promise<CashShiftEntity[]> {
    return await this.dataSource.getShifts(organizationId, limit);
  }

  async getShiftMovements(shiftId: string): Promise<CashMovementEntity[]> {
    return await this.dataSource.getShiftMovements(shiftId);
  }

  async openShift(params: OpenShiftParams): Promise<CashShiftEntity> {
    return await this.dataSource.openShift(params);
  }

  async closeShift(params: CloseShiftParams): Promise<CashShiftEntity> {
    return await this.dataSource.closeShift(params);
  }

  async recordCashMovement(params: RecordCashMovementParams): Promise<CashMovementEntity> {
    return await this.dataSource.recordCashMovement(params);
  }
}
