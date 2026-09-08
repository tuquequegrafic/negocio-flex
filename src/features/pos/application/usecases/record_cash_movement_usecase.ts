import { CashMovementEntity } from '../../domain/entities/cash_movement_entity';
import { CashShiftRepository, RecordCashMovementParams } from '../../domain/repositories/cash_shift_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class RecordCashMovementUseCase {
  constructor(private readonly repository: CashShiftRepository) {}

  async execute(params: RecordCashMovementParams): Promise<CashMovementEntity> {
    if (!params.organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    if (!params.shiftId) {
      throw new ValidationException('El ID de turno es obligatorio.', 'shiftId');
    }
    if (!['CASH_IN', 'CASH_OUT'].includes(params.movementType)) {
      throw new ValidationException('Tipo de movimiento inválido. Debe ser CASH_IN o CASH_OUT.', 'movementType');
    }
    if (!params.amount || params.amount <= 0) {
      throw new ValidationException('El monto debe ser estrictamente positivo.', 'amount');
    }
    if (!params.reason || params.reason.trim() === '') {
      throw new ValidationException('El motivo del movimiento es obligatorio.', 'reason');
    }

    return await this.repository.recordCashMovement(params);
  }
}
