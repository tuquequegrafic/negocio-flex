/**
 * Negocio Flex - Organization Use Cases (Fase 4)
 */

import { IOrganizationRepository, CreateOrganizationParams } from '../repositories/organization_repository';
import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  OrganizationRole,
} from '../entities/organization_entity';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import { ValidationException, UnauthorizedException } from '../../../../core/errors/app_exceptions';

export class GetUserOrganizationsUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(userId: string): Promise<OrganizationEntity[]> {
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return await this.repository.getUserOrganizations(userId);
  }
}

export class CreateOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(params: CreateOrganizationParams, creatorUserId: string): Promise<OrganizationEntity> {
    if (!creatorUserId) {
      throw new UnauthorizedException('Debes iniciar sesión para crear un negocio');
    }

    if (!params.name || params.name.trim().length < 2) {
      throw new ValidationException('El nombre del negocio debe tener al menos 2 caracteres', 'name');
    }

    const resolvedSlug = params.slug ? SlugValidator.normalize(params.slug) : SlugValidator.normalize(params.name);
    const slugError = SlugValidator.validate(resolvedSlug);
    if (slugError) {
      throw new ValidationException(slugError, 'slug');
    }

    return await this.repository.createOrganization(
      {
        ...params,
        name: params.name.trim(),
        slug: resolvedSlug,
      },
      creatorUserId
    );
  }
}

export class UpdateOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    id: string,
    updates: Partial<OrganizationEntity>,
    callerUserId: string
  ): Promise<OrganizationEntity> {
    if (!callerUserId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    if (updates.name && updates.name.trim().length < 2) {
      throw new ValidationException('El nombre del negocio debe tener al menos 2 caracteres', 'name');
    }
    if (updates.slug) {
      const normalized = SlugValidator.normalize(updates.slug);
      const slugErr = SlugValidator.validate(normalized);
      if (slugErr) throw new ValidationException(slugErr, 'slug');
      updates = { ...updates, slug: normalized };
    }

    return await this.repository.updateOrganization(id, updates, callerUserId);
  }
}

export class GetOrganizationMembersUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(organizationId: string): Promise<OrganizationMemberEntity[]> {
    if (!organizationId) {
      throw new ValidationException('ID de organización no especificado');
    }
    return await this.repository.getMembers(organizationId);
  }
}

export class ChangeMemberRoleUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    callerUserId: string
  ): Promise<void> {
    if (!callerUserId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    if (!organizationId || !targetUserId) {
      throw new ValidationException('Parámetros de organización o usuario inválidos');
    }
    await this.repository.changeMemberRole(organizationId, targetUserId, newRole, callerUserId);
  }
}

export class RemoveMemberUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(organizationId: string, targetUserId: string, callerUserId: string): Promise<void> {
    if (!callerUserId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    if (!organizationId || !targetUserId) {
      throw new ValidationException('Parámetros inválidos');
    }
    await this.repository.removeMember(organizationId, targetUserId, callerUserId);
  }
}

export class GetOrganizationSettingsUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    if (!organizationId) return null;
    return await this.repository.getSettings(organizationId);
  }
}
