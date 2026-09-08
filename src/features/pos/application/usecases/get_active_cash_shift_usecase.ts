import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashShiftRepository } from '../../domain/repositories/cash_shift_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetActiveCashShiftUseCase {
  constructor(private readonly repository: CashShiftRepository) {}

  async execute(organizationId: string, cashRegisterId?: string): Promise<CashShiftEntity | null> {
    if (!organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    return await this.repository.getActiveShift(organizationId, cashRegisterId);
  }
}
