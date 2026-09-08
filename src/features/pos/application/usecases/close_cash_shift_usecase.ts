import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashShiftRepository, CloseShiftParams } from '../../domain/repositories/cash_shift_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class CloseCashShiftUseCase {
  constructor(private readonly repository: CashShiftRepository) {}

  async execute(params: CloseShiftParams): Promise<CashShiftEntity> {
    if (!params.organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    if (!params.shiftId) {
      throw new ValidationException('El ID de turno es obligatorio.', 'shiftId');
    }
    if (params.actualCash === undefined || params.actualCash < 0) {
      throw new ValidationException('El monto contado físicamente no puede ser negativo.', 'actualCash');
    }

    return await this.repository.closeShift(params);
  }
}
