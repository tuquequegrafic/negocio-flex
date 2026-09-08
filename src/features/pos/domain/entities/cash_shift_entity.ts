export type CashShiftStatus = 'OPEN' | 'CLOSED';

export interface CashShiftEntity {
  id: string;
  organizationId: string;
  cashRegisterId: string;
  openedBy: string | null;
  openedByName: string;
  status: CashShiftStatus;
  initialCash: number;
  salesCashTotal: number;
  salesDigitalTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  closedByName: string | null;
  notes: string | null;
}
