/**
 * Negocio Flex - Get Public Business Data Use Case (Fase 7)
 * Permite obtener de forma atómica y segura los datos del catálogo público
 * de un negocio mediante su slug, respetando Clean Architecture.
 */

import { IOrganizationRepository } from '../repositories/organization_repository';
import { PublicBusinessData } from '../entities/public_business_entity';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class GetPublicBusinessDataUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(slugOrId: string): Promise<PublicBusinessData | null> {
    if (!slugOrId || !slugOrId.trim()) {
      throw new ValidationException('El identificador o slug del negocio es requerido', 'slug');
    }

    const trimmed = slugOrId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    const identifier = isUuid ? trimmed : SlugValidator.normalize(trimmed);

    if (!identifier) {
      return null;
    }

    return await this.repository.getPublicBusinessData(identifier);
  }
}
