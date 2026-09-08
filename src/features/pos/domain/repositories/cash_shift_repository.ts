import { CashRegisterEntity } from '../entities/cash_register_entity';
import { CashShiftEntity } from '../entities/cash_shift_entity';
import { CashMovementEntity, CashMovementType } from '../entities/cash_movement_entity';

export interface OpenShiftParams {
  organizationId: string;
  cashRegisterId: string;
  userId: string;
  initialCash: number;
  notes?: string;
}

export interface CloseShiftParams {
  organizationId: string;
  shiftId: string;
  userId: string;
  actualCash: number;
  notes?: string;
}

export interface RecordCashMovementParams {
  organizationId: string;
  shiftId: string;
  userId: string;
  movementType: CashMovementType;
  amount: number;
  reason: string;
  paymentMethod?: string;
}

export interface CashShiftRepository {
  getCashRegisters(organizationId: string): Promise<CashRegisterEntity[]>;
  createCashRegister(organizationId: string, name: string, code: string): Promise<CashRegisterEntity>;
  getActiveShift(organizationId: string, cashRegisterId?: string): Promise<CashShiftEntity | null>;
  getShifts(organizationId: string, limit?: number): Promise<CashShiftEntity[]>;
  getShiftMovements(shiftId: string): Promise<CashMovementEntity[]>;
  openShift(params: OpenShiftParams): Promise<CashShiftEntity>;
  closeShift(params: CloseShiftParams): Promise<CashShiftEntity>;
  recordCashMovement(params: RecordCashMovementParams): Promise<CashMovementEntity>;
}
