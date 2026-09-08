import { CashRegisterEntity } from '../../domain/entities/cash_register_entity';
import { CashShiftRepository } from '../../domain/repositories/cash_shift_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetCashRegistersUseCase {
  constructor(private readonly repository: CashShiftRepository) {}

  async execute(organizationId: string): Promise<CashRegisterEntity[]> {
    if (!organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    return await this.repository.getCashRegisters(organizationId);
  }

  async create(organizationId: string, name: string, code: string): Promise<CashRegisterEntity> {
    if (!organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    if (!name || name.trim() === '') {
      throw new ValidationException('El nombre de la caja es obligatorio.', 'name');
    }
    if (!code || code.trim() === '') {
      throw new ValidationException('El código de la caja es obligatorio.', 'code');
    }
    return await this.repository.createCashRegister(organizationId, name.trim(), code.trim().toUpperCase());
  }
}
