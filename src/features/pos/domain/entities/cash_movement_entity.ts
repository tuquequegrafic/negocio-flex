export type CashMovementType = 'CASH_IN' | 'CASH_OUT' | 'SALE_CASH' | 'SALE_DIGITAL' | 'REFUND_CASH';

export interface CashMovementEntity {
  id: string;
  organizationId: string;
  shiftId: string;
  movementType: CashMovementType;
  amount: number;
  reason: string;
  referenceId: string | null;
  paymentMethod: string;
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
}
