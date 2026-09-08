/**
 * Negocio Flex - Value Object: SubscriptionPeriod (Fase 10: Dominio)
 */

export class SubscriptionPeriodVO {
  readonly startDate: Date;
  readonly endDate: Date;

  constructor(startDate: string | Date, endDate: string | Date) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Fechas de periodo inválidas');
    }

    if (end < start) {
      throw new Error('La fecha final del periodo no puede ser anterior a la fecha inicial');
    }

    this.startDate = start;
    this.endDate = end;
  }

  isCurrent(referenceDate = new Date()): boolean {
    return referenceDate >= this.startDate && referenceDate <= this.endDate;
  }

  hasExpired(referenceDate = new Date()): boolean {
    return referenceDate > this.endDate;
  }

  daysRemaining(referenceDate = new Date()): number {
    if (this.hasExpired(referenceDate)) return 0;
    const diffMs = this.endDate.getTime() - referenceDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  getStartISO(): string {
    return this.startDate.toISOString();
  }

  getEndISO(): string {
    return this.endDate.toISOString();
  }
}
