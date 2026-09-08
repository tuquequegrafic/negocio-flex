import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashShiftRepository, OpenShiftParams } from '../../domain/repositories/cash_shift_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class OpenCashShiftUseCase {
  constructor(private readonly repository: CashShiftRepository) {}

  async execute(params: OpenShiftParams): Promise<CashShiftEntity> {
    if (!params.organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    if (!params.cashRegisterId) {
      throw new ValidationException('Debe seleccionar una caja registradora.', 'cashRegisterId');
    }
    if (params.initialCash === undefined || params.initialCash < 0) {
      throw new ValidationException('El monto inicial en caja no puede ser negativo.', 'initialCash');
    }

    return await this.repository.openShift(params);
  }
}
