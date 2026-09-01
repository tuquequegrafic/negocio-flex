/**
 * Negocio Flex - Organization State & Multi-Tenant Context (Fase 4)
 * Administra el aislamiento Multi-Tenant, organización activa, rol del usuario,
 * matriz de permisos, y operaciones atómicas de organizaciones y miembros.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  OrganizationRole,
  BusinessType,
  OrganizationAction,
  hasPermission,
} from '../../domain/entities/organization_entity';
import { OrganizationRepositoryImpl } from '../../data/repositories/organization_repository_impl';
import {
  GetUserOrganizationsUseCase,
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  GetOrganizationMembersUseCase,
  ChangeMemberRoleUseCase,
  RemoveMemberUseCase,
} from '../../domain/usecases/organization_usecases';
import { STORAGE_KEYS } from '../../../../core/constants/app_constants';
import { useAuth } from '../../../auth/presentation/providers/AuthContext';
import { logger } from '../../../../core/utils/logger';

interface OrganizationContextType {
  readonly organizations: OrganizationEntity[];
  readonly activeOrganization: OrganizationEntity | null;
  readonly activeMember: OrganizationMemberEntity | null;
  readonly userRole: OrganizationRole | null;
  readonly isOwner: boolean;
  readonly isAdmin: boolean;
  readonly isStaff: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  can: (action: OrganizationAction) => boolean;
  selectOrganization: (orgId: string) => Promise<boolean>;
  createNewOrganization: (
    name: string,
    businessType: BusinessType,
    slug?: string,
    description?: string,
    phone?: string,
    primaryColor?: string
  ) => Promise<OrganizationEntity>;
  updateOrganizationInfo: (
    id: string,
    updates: Partial<OrganizationEntity>
  ) => Promise<OrganizationEntity>;
  getOrganizationMembers: (orgId?: string) => Promise<OrganizationMemberEntity[]>;
  changeMemberRole: (targetUserId: string, newRole: OrganizationRole) => Promise<void>;
  removeMember: (targetUserId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationEntity[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationEntity | null>(null);
  const [activeMember, setActiveMember] = useState<OrganizationMemberEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Instanciar repositorio y casos de uso
  const repository = useMemo(() => new OrganizationRepositoryImpl(), []);
  const getUserOrgsUseCase = useMemo(() => new GetUserOrganizationsUseCase(repository), [repository]);
  const createOrgUseCase = useMemo(() => new CreateOrganizationUseCase(repository), [repository]);
  const updateOrgUseCase = useMemo(() => new UpdateOrganizationUseCase(repository), [repository]);
  const getMembersUseCase = useMemo(() => new GetOrganizationMembersUseCase(repository), [repository]);
  const changeRoleUseCase = useMemo(() => new ChangeMemberRoleUseCase(repository), [repository]);
  const removeMemberUseCase = useMemo(() => new RemoveMemberUseCase(repository), [repository]);

  const currentUserId = user?.id || 'usr-001';

  /**
   * Carga y sincroniza las organizaciones autorizadas para el usuario actual
   */
  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveMember(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await getUserOrgsUseCase.execute(currentUserId);
      setOrganizations(list);

      // Determinar la organización activa previa o la primera de la lista
      const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CURRENT_ORG_ID) : null;
      const found = (savedOrgId ? list.find(o => o.id === savedOrgId) : null) || list[0] || null;

      setActiveOrganization(found);
      if (found) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, found.id);
        }
        // Obtener la membresía del usuario en la org activa
        const members = await getMembersUseCase.execute(found.id);
        const myMember = members.find(m => m.userId === currentUserId) || null;
        setActiveMember(myMember);
      } else {
        setActiveMember(null);
      }
    } catch (err: any) {
      logger.error('Error al cargar organizaciones', err);
      setError(err?.message || 'Error al cargar organizaciones');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentUserId, getUserOrgsUseCase, getMembersUseCase]);

  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  /**
   * Cambia de organización activa validando membresía
   */
  const selectOrganization = async (orgId: string): Promise<boolean> => {
    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      logger.warning('Intento no autorizado de seleccionar organización ajena:', { orgId });
      setError('No perteneces a la organización seleccionada.');
      return false;
    }

    try {
      setActiveOrganization(targetOrg);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, targetOrg.id);
      }

      // Actualizar datos del miembro activo
      const members = await getMembersUseCase.execute(targetOrg.id);
      const myMember = members.find(m => m.userId === currentUserId) || null;
      setActiveMember(myMember);

      logger.info('Organización activa cambiada a:', { name: targetOrg.name, id: targetOrg.id, role: targetOrg.currentUserRole });
      return true;
    } catch (err: any) {
      logger.error('Error al cambiar organización activa', err);
      setError('No fue posible cambiar de negocio.');
      return false;
    }
  };

  /**
   * Creación atómica de negocio -> Asigna OWNER -> Establece como activo
   */
  const createNewOrganization = async (
    name: string,
    businessType: BusinessType,
    slug?: string,
    description?: string,
    phone?: string,
    primaryColor?: string
  ): Promise<OrganizationEntity> => {
    setError(null);
    try {
      const created = await createOrgUseCase.execute(
        {
          name,
          businessType,
          slug,
          description,
          phone,
          primaryColor,
        },
        currentUserId
      );

      await refreshOrganizations();
      await selectOrganization(created.id);
      return created;
    } catch (err: any) {
      logger.error('Error al crear organización', err);
      setError(err?.message || 'No fue posible crear el negocio.');
      throw err;
    }
  };

  /**
   * Actualización de información del negocio
   */
  const updateOrganizationInfo = async (
    id: string,
    updates: Partial<OrganizationEntity>
  ): Promise<OrganizationEntity> => {
    setError(null);
    try {
      const updated = await updateOrgUseCase.execute(id, updates, currentUserId);
      await refreshOrganizations();
      return updated;
    } catch (err: any) {
      logger.error('Error al actualizar negocio', err);
      setError(err?.message || 'No fue posible guardar los cambios del negocio.');
      throw err;
    }
  };

  /**
   * Obtiene la lista de miembros de la organización especificada o activa
   */
  const getOrganizationMembers = async (orgId?: string): Promise<OrganizationMemberEntity[]> => {
    const targetOrgId = orgId || activeOrganization?.id;
    if (!targetOrgId) return [];
    return await getMembersUseCase.execute(targetOrgId);
  };

  /**
   * Cambia el rol de un miembro
   */
  const changeMemberRole = async (targetUserId: string, newRole: OrganizationRole): Promise<void> => {
    if (!activeOrganization) throw new Error('No hay una organización activa');
    setError(null);
    try {
      await changeRoleUseCase.execute(activeOrganization.id, targetUserId, newRole, currentUserId);
      await refreshOrganizations();
    } catch (err: any) {
      logger.error('Error al cambiar rol de miembro', err);
      setError(err?.message || 'No fue posible modificar el rol del miembro.');
      throw err;
    }
  };

  /**
   * Elimina a un miembro de la organización
   */
  const removeMember = async (targetUserId: string): Promise<void> => {
    if (!activeOrganization) throw new Error('No hay una organización activa');
    setError(null);
    try {
      await removeMemberUseCase.execute(activeOrganization.id, targetUserId, currentUserId);
      await refreshOrganizations();
    } catch (err: any) {
      logger.error('Error al eliminar miembro', err);
      setError(err?.message || 'No fue posible eliminar al miembro.');
      throw err;
    }
  };

  // Roles y Permisos derivados
  const userRole: OrganizationRole | null =
    activeMember?.role || activeOrganization?.currentUserRole || null;

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';

  const can = useCallback(
    (action: OrganizationAction): boolean => {
      return hasPermission(userRole, action);
    },
    [userRole]
  );

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        activeMember,
        userRole,
        isOwner,
        isAdmin,
        isStaff,
        isLoading,
        error,
        can,
        selectOrganization,
        createNewOrganization,
        updateOrganizationInfo,
        getOrganizationMembers,
        changeMemberRole,
        removeMember,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization debe ser utilizado dentro de un OrganizationProvider');
  }
  return context;
};
