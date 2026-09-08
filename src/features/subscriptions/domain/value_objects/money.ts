/**
 * Negocio Flex - Value Object: Money (Fase 10: Dominio)
 */

export class MoneyVO {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency = 'PEN') {
    if (isNaN(amount) || amount < 0) {
      throw new Error(`Monto inválido: ${amount}. El monto debe ser un número mayor o igual a 0.`);
    }
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase().trim();
  }

  format(): string {
    const symbol = this.currency === 'PEN' ? 'S/' : this.currency === 'USD' ? '$' : this.currency;
    return `${symbol} ${this.amount.toFixed(2)}`;
  }

  add(other: MoneyVO): MoneyVO {
    if (this.currency !== other.currency) {
      throw new Error(`No se pueden sumar montos de monedas distintas: ${this.currency} y ${other.currency}`);
    }
    return new MoneyVO(this.amount + other.amount, this.currency);
  }

  equals(other: MoneyVO): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
