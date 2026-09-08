/**
 * Negocio Flex - Value Object: BillingInterval (Fase 10: Dominio)
 */

export type BillingIntervalType = 'MONTHLY' | 'ANNUAL';

export class BillingIntervalVO {
  private readonly value: BillingIntervalType;

  constructor(interval: string) {
    const normalized = interval.toUpperCase().trim();
    if (normalized !== 'MONTHLY' && normalized !== 'ANNUAL') {
      throw new Error(`Intervalo de facturación inválido: "${interval}". Debe ser MONTHLY o ANNUAL.`);
    }
    this.value = normalized as BillingIntervalType;
  }

  getValue(): BillingIntervalType {
    return this.value;
  }

  isAnnual(): boolean {
    return this.value === 'ANNUAL';
  }

  isMonthly(): boolean {
    return this.value === 'MONTHLY';
  }

  getMonths(): number {
    return this.value === 'ANNUAL' ? 12 : 1;
  }

  equals(other: BillingIntervalVO): boolean {
    return this.value === other.value;
  }
}
