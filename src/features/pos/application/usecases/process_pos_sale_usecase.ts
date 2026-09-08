import { PosSaleRequest, PosSaleResult } from '../../domain/entities/pos_sale_entity';
import { PosRepository } from '../../domain/repositories/pos_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class ProcessPosSaleUseCase {
  constructor(private readonly repository: PosRepository) {}

  async execute(request: PosSaleRequest): Promise<PosSaleResult> {
    if (!request.organizationId) {
      throw new ValidationException('El ID de organización es obligatorio.', 'organizationId');
    }
    if (!request.cashRegisterId) {
      throw new ValidationException('El ID de caja registradora es obligatorio.', 'cashRegisterId');
    }
    if (!request.shiftId) {
      throw new ValidationException('El ID de turno de caja es obligatorio.', 'shiftId');
    }
    if (!request.items || request.items.length === 0) {
      throw new ValidationException('La venta debe contener al menos un producto.', 'items');
    }

    for (const item of request.items) {
      if (!item.productId) {
        throw new ValidationException('Producto no válido en los ítems de venta.', 'productId');
      }
      if (item.quantity <= 0) {
        throw new ValidationException(`La cantidad del producto "${item.productName}" debe ser mayor a cero.`, 'quantity');
      }
      if (item.unitPrice < 0) {
        throw new ValidationException(`El precio unitario de "${item.productName}" no puede ser negativo.`, 'unitPrice');
      }
    }

    if (!['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER'].includes(request.paymentMethod)) {
      throw new ValidationException('Método de pago no válido.', 'paymentMethod');
    }

    return await this.repository.processSale(request);
  }
}
