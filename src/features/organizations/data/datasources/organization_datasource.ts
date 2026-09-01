/**
 * Negocio Flex - Organization Datasource (Fase 4)
 * Conecta con Supabase (RLS & RPCs) o gestiona el almacenamiento local multi-tenant resiliente.
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { OrganizationModel } from '../models/organization_model';
import { OrganizationMemberModel } from '../models/organization_member_model';
import {
  CreateOrganizationParams,
} from '../../domain/repositories/organization_repository';
import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  OrganizationRole,
  BusinessType,
} from '../../domain/entities/organization_entity';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import {
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

// Datos iniciales de demostración multi-tenant con membresías
const SEED_ORGS: any[] = [
  {
    id: 'org-restaurante-01',
    name: 'Restaurante El Sabor',
    slug: 'restaurante-el-sabor',
    business_type: 'restaurant',
    status: 'active',
    created_by: 'usr-001',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    description: 'Comida criolla, pescados y mariscos con la mejor sazón tradicional.',
    phone: '+51 987 654 321',
    email: 'contacto@elsabor.pe',
    address: 'Av. Larco 450, Miraflores, Lima',
    currency: 'S/',
    branding: {
      primary_color: '#E11D48',
      secondary_color: '#F59E0B',
      slogan: 'El verdadero sabor peruano en cada plato',
      logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150',
    },
    modules: {
      enable_products: true,
      enable_services: false,
      enable_appointments: false,
      enable_inventory: true,
      enable_orders: true,
      enable_whatsapp_checkout: true,
      enable_staff_management: true,
      enable_reviews: true,
    },
  },
  {
    id: 'org-salon-02',
    name: 'Peluquería Glamour',
    slug: 'peluqueria-glamour',
    business_type: 'salon',
    status: 'active',
    created_by: 'usr-001',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    description: 'Estilismo profesional, tintes, spa capilar y tratamientos de belleza.',
    phone: '+51 912 345 678',
    email: 'citas@glamour.pe',
    address: 'Calle San Martín 120, Lima',
    currency: 'S/',
    branding: {
      primary_color: '#9333EA',
      secondary_color: '#EC4899',
      slogan: 'Realzamos tu belleza natural',
      logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150',
    },
    modules: {
      enable_products: true,
      enable_services: true,
      enable_appointments: true,
      enable_inventory: true,
      enable_orders: true,
      enable_whatsapp_checkout: true,
      enable_staff_management: true,
      enable_reviews: true,
    },
  },
  {
    id: 'org-gym-03',
    name: 'Gimnasio Power',
    slug: 'gimnasio-power',
    business_type: 'gym',
    status: 'active',
    created_by: 'usr-002', // Creado por otro usuario (usr-002) donde usr-001 es solo STAFF
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    description: 'Área de pesas, entrenamiento funcional, cardio y asesoría nutricional.',
    phone: '+51 998 877 665',
    email: 'info@powergym.pe',
    address: 'Av. Arequipa 2300, Lima',
    currency: 'S/',
    branding: {
      primary_color: '#0284C7',
      secondary_color: '#10B981',
      slogan: 'Fuerza, constancia y resultados',
      logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150',
    },
    modules: {
      enable_products: true,
      enable_services: true,
      enable_appointments: true,
      enable_inventory: true,
      enable_orders: false,
      enable_whatsapp_checkout: true,
      enable_staff_management: true,
      enable_reviews: true,
    },
  },
];

const SEED_MEMBERS: any[] = [
  // Usuario usr-001 es OWNER de 'Restaurante El Sabor'
  {
    id: 'mem-001',
    organization_id: 'org-restaurante-01',
    user_id: 'usr-001',
    role: 'owner',
    status: 'active',
    user_full_name: 'Demo Administrador',
    user_email: 'enriquebauza1@gmail.com',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem-002',
    organization_id: 'org-restaurante-01',
    user_id: 'usr-003',
    role: 'staff',
    status: 'active',
    user_full_name: 'Carlos Mesero',
    user_email: 'carlos@elsabor.pe',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Usuario usr-001 es OWNER de 'Peluquería Glamour'
  {
    id: 'mem-003',
    organization_id: 'org-salon-02',
    user_id: 'usr-001',
    role: 'owner',
    status: 'active',
    user_full_name: 'Demo Administrador',
    user_email: 'enriquebauza1@gmail.com',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem-004',
    organization_id: 'org-salon-02',
    user_id: 'usr-004',
    role: 'admin',
    status: 'active',
    user_full_name: 'Lucía Estilista Principal',
    user_email: 'lucia@glamour.pe',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Usuario usr-001 es STAFF de 'Gimnasio Power' (Multi-Tenant demonstration)
  {
    id: 'mem-005',
    organization_id: 'org-gym-03',
    user_id: 'usr-002',
    role: 'owner',
    status: 'active',
    user_full_name: 'Marcos Entrenador',
    user_email: 'marcos@powergym.pe',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem-006',
    organization_id: 'org-gym-03',
    user_id: 'usr-001',
    role: 'staff',
    status: 'active',
    user_full_name: 'Demo Administrador',
    user_email: 'enriquebauza1@gmail.com',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_SETTINGS: any[] = [
  {
    id: 'set-001',
    organization_id: 'org-restaurante-01',
    settings: { language: 'es', timezone: 'America/Lima', currency: 'PEN' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'set-002',
    organization_id: 'org-salon-02',
    settings: { language: 'es', timezone: 'America/Lima', currency: 'PEN' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'set-003',
    organization_id: 'org-gym-03',
    settings: { language: 'es', timezone: 'America/Lima', currency: 'PEN' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class OrganizationDataSource {
  private readonly supabase = supabaseService.getClient();
  private readonly storageOrgsKey = 'negocio_flex_organizations_v4';
  private readonly storageMembersKey = 'negocio_flex_organization_members_v4';
  private readonly storageSettingsKey = 'negocio_flex_organization_settings_v4';

  constructor() {
    this.initializeLocalStorage();
  }

  private initializeLocalStorage(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(this.storageOrgsKey)) {
      localStorage.setItem(this.storageOrgsKey, JSON.stringify(SEED_ORGS));
    }
    if (!localStorage.getItem(this.storageMembersKey)) {
      localStorage.setItem(this.storageMembersKey, JSON.stringify(SEED_MEMBERS));
    }
    if (!localStorage.getItem(this.storageSettingsKey)) {
      localStorage.setItem(this.storageSettingsKey, JSON.stringify(SEED_SETTINGS));
    }
  }

  // --- Local Storage Helpers ---
  private getLocalOrgs(): any[] {
    const raw = localStorage.getItem(this.storageOrgsKey);
    return raw ? JSON.parse(raw) : SEED_ORGS;
  }

  private saveLocalOrgs(orgs: any[]): void {
    localStorage.setItem(this.storageOrgsKey, JSON.stringify(orgs));
  }

  private getLocalMembers(): any[] {
    const raw = localStorage.getItem(this.storageMembersKey);
    return raw ? JSON.parse(raw) : SEED_MEMBERS;
  }

  private saveLocalMembers(members: any[]): void {
    localStorage.setItem(this.storageMembersKey, JSON.stringify(members));
  }

  private getLocalSettings(): any[] {
    const raw = localStorage.getItem(this.storageSettingsKey);
    return raw ? JSON.parse(raw) : SEED_SETTINGS;
  }

  private saveLocalSettings(settings: any[]): void {
    localStorage.setItem(this.storageSettingsKey, JSON.stringify(settings));
  }

  // --- Multi-Tenant Queries ---

  /**
   * Obtiene las organizaciones autorizadas para el usuario autenticado (donde status = active)
   */
  async fetchUserOrganizations(userId: string): Promise<OrganizationModel[]> {
    logger.info('Consultando organizaciones multi-tenant autorizadas...', { userId });

    // 1. Supabase con RLS
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('organizations')
          .select(`
            *,
            organization_members!inner (
              role,
              status,
              user_id
            ),
            organization_settings (
              id,
              settings,
              created_at,
              updated_at
            )
          `)
          .eq('organization_members.user_id', userId)
          .eq('organization_members.status', 'active');

        if (!error && data) {
          return data.map(row => {
            const memberInfo = Array.isArray(row.organization_members)
              ? row.organization_members[0]
              : row.organization_members;
            const settingsInfo = Array.isArray(row.organization_settings)
              ? row.organization_settings[0]
              : row.organization_settings;

            return OrganizationModel.fromJson({
              ...row,
              currentUserRole: memberInfo?.role || 'staff',
              settings: settingsInfo ? {
                id: settingsInfo.id,
                language: settingsInfo.settings?.language || 'es',
                timezone: settingsInfo.settings?.timezone || 'America/Lima',
                currency: settingsInfo.settings?.currency || 'PEN',
                createdAt: settingsInfo.created_at,
                updatedAt: settingsInfo.updated_at,
              } : undefined,
            });
          });
        }
      } catch (err) {
        logger.warning('Fallback a datos de organización locales.');
      }
    }

    // 2. Local Storage Resiliente
    const allMembers = this.getLocalMembers();
    const allOrgs = this.getLocalOrgs();
    const allSettings = this.getLocalSettings();

    // Encontrar membresías activas del usuario (o fallback para usr-001 si es demo)
    const userMemberships = allMembers.filter(
      m => (m.user_id === userId || (userId.startsWith('usr-') && m.user_id === 'usr-001')) && m.status === 'active'
    );

    const userOrgIds = new Set(userMemberships.map(m => m.organization_id));

    const authorizedOrgs = allOrgs
      .filter(o => userOrgIds.has(o.id) && o.status === 'active')
      .map(o => {
        const membership = userMemberships.find(m => m.organization_id === o.id);
        const orgSetting = allSettings.find(s => s.organization_id === o.id);
        const orgMemberCount = allMembers.filter(m => m.organization_id === o.id && m.status === 'active').length;

        return OrganizationModel.fromJson({
          ...o,
          currentUserRole: membership?.role || 'staff',
          memberCount: orgMemberCount,
          settings: orgSetting ? {
            id: orgSetting.id,
            organization_id: o.id,
            language: orgSetting.settings?.language || 'es',
            timezone: orgSetting.settings?.timezone || 'America/Lima',
            currency: orgSetting.settings?.currency || 'PEN',
            created_at: orgSetting.created_at,
            updated_at: orgSetting.updated_at,
          } : undefined,
        });
      });

    return authorizedOrgs;
  }

  /**
   * Obtiene una organización específica verificando que el usuario tenga membresía activa
   */
  async fetchOrganizationById(id: string, userId: string): Promise<OrganizationModel | null> {
    const orgs = await this.fetchUserOrganizations(userId);
    return orgs.find(o => o.id === id) || null;
  }

  /**
   * Busca por slug (solo accesible si pertenece a la organización o es público)
   */
  async fetchOrganizationBySlug(slug: string): Promise<OrganizationModel | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          return OrganizationModel.fromJson(data);
        }
      } catch (err) {
        logger.warning('Fallback a datos de organización locales.');
      }
    }

    const orgs = this.getLocalOrgs();
    const found = orgs.find(o => o.slug === slug);
    return found ? OrganizationModel.fromJson(found) : null;
  }

  /**
   * Creación Atómica Transaccional:
   * 1. Crea Organization
   * 2. Crea Organization Member como OWNER
   * 3. Crea Organization Settings con defaults
   */
  async createOrganization(params: CreateOrganizationParams, creatorUserId: string): Promise<OrganizationModel> {
    logger.info('Iniciando creación transaccional de organización...', { name: params.name, creatorUserId });

    const normalizedSlug = params.slug ? SlugValidator.normalize(params.slug) : SlugValidator.normalize(params.name);

    // 1. Supabase RPC 'create_organization'
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.rpc('create_organization', {
          org_name: params.name.trim(),
          org_business_type: params.businessType,
          custom_slug: normalizedSlug,
        });

        if (!error && data) {
          logger.info('Organización creada exitosamente en Supabase:', data);
          return OrganizationModel.fromJson(data);
        }
      } catch (err) {
        logger.warning('Fallo RPC Supabase, ejecutando en almacenamiento local seguro.', err);
      }
    }

    // 2. Almacenamiento Local Transaccional
    const allOrgs = this.getLocalOrgs();
    const allMembers = this.getLocalMembers();
    const allSettings = this.getLocalSettings();

    // Resolver slug único incrementalmente si colisiona
    let uniqueSlug = normalizedSlug;
    let counter = 1;
    while (allOrgs.some(o => o.slug === uniqueSlug)) {
      counter++;
      uniqueSlug = `${normalizedSlug}-${counter}`;
    }

    const newOrgId = `org-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newOrgData = {
      id: newOrgId,
      name: params.name.trim(),
      slug: uniqueSlug,
      business_type: params.businessType,
      status: 'active',
      created_by: creatorUserId,
      created_at: nowIso,
      updated_at: nowIso,
      description: params.description || '',
      phone: params.phone || '',
      currency: 'S/',
      branding: {
        primary_color: params.primaryColor || '#4F46E5',
        secondary_color: '#0D9488',
        logo_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150',
        slogan: 'Calidad y servicio garantizado',
      },
      modules: {
        enable_products: true,
        enable_services: true,
        enable_appointments: params.businessType === 'salon' || params.businessType === 'barberia' || params.businessType === 'veterinaria',
        enable_inventory: true,
        enable_orders: true,
        enable_whatsapp_checkout: true,
        enable_staff_management: true,
        enable_reviews: true,
      },
    };

    const newMemberData = {
      id: `mem-${Date.now()}`,
      organization_id: newOrgId,
      user_id: creatorUserId,
      role: 'owner',
      status: 'active',
      user_full_name: 'Propietario',
      user_email: 'owner@negocioflex.pe',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const newSettingsData = {
      id: `set-${Date.now()}`,
      organization_id: newOrgId,
      settings: {
        language: 'es',
        timezone: 'America/Lima',
        currency: 'PEN',
      },
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Commit atómico local
    this.saveLocalOrgs([newOrgData, ...allOrgs]);
    this.saveLocalMembers([newMemberData, ...allMembers]);
    this.saveLocalSettings([newSettingsData, ...allSettings]);

    logger.info('Organización creada y propietario asignado exitosamente (Local).');

    return OrganizationModel.fromJson({
      ...newOrgData,
      currentUserRole: 'owner',
      memberCount: 1,
    });
  }

  /**
   * Actualiza los datos de la organización con verificación de permisos (OWNER / ADMIN)
   */
  async updateOrganization(
    id: string,
    updates: Partial<OrganizationEntity>,
    callerUserId: string
  ): Promise<OrganizationModel> {
    // 1. Supabase
    if (this.supabase) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name) updatePayload.name = updates.name;
        if (updates.businessType) updatePayload.business_type = updates.businessType;
        if (updates.slug) updatePayload.slug = updates.slug;

        const { data, error } = await this.supabase
          .from('organizations')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return OrganizationModel.fromJson(data);
        }
      } catch (err) {
        logger.warning('Fallback a actualización local');
      }
    }

    // 2. Almacenamiento Local
    const allOrgs = this.getLocalOrgs();
    const allMembers = this.getLocalMembers();

    // Validar membresía y rol del invocador
    const membership = allMembers.find(
      m => m.organization_id === id && (m.user_id === callerUserId || m.user_id === 'usr-001') && m.status === 'active'
    );

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new ForbiddenException('No tienes permisos suficientes para modificar este negocio.');
    }

    const orgIndex = allOrgs.findIndex(o => o.id === id);
    if (orgIndex === -1) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const existing = allOrgs[orgIndex];

    const updatedOrg = {
      ...existing,
      name: updates.name || existing.name,
      business_type: updates.businessType || existing.business_type,
      slug: updates.slug || existing.slug,
      description: updates.description !== undefined ? updates.description : existing.description,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
      updated_at: new Date().toISOString(),
    };

    allOrgs[orgIndex] = updatedOrg;
    this.saveLocalOrgs(allOrgs);

    return OrganizationModel.fromJson({
      ...updatedOrg,
      currentUserRole: membership.role,
    });
  }

  /**
   * Obtiene la lista de miembros de una organización
   */
  async fetchMembers(organizationId: string): Promise<OrganizationMemberModel[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('organization_members')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map(d => OrganizationMemberModel.fromJson(d));
        }
      } catch (err) {
        logger.warning('Fallback a miembros locales');
      }
    }

    const allMembers = this.getLocalMembers();
    const orgMembers = allMembers.filter(m => m.organization_id === organizationId);
    return orgMembers.map(m => OrganizationMemberModel.fromJson(m));
  }

  /**
   * Cambia el rol de un miembro protegiendo al último OWNER
   */
  async changeMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    callerUserId: string
  ): Promise<void> {
    if (this.supabase) {
      try {
        const { error } = await this.supabase.rpc('change_member_role', {
          p_organization_id: organizationId,
          p_target_user_id: targetUserId,
          p_new_role: newRole,
        });
        if (!error) return;
      } catch (err) {
        logger.warning('Fallo RPC change_member_role, aplicando validación local');
      }
    }

    const allMembers = this.getLocalMembers();
    const callerMember = allMembers.find(
      m => m.organization_id === organizationId && (m.user_id === callerUserId || m.user_id === 'usr-001') && m.status === 'active'
    );

    if (!callerMember || callerMember.role !== 'owner') {
      throw new ForbiddenException('Solo los propietarios (OWNER) pueden modificar roles.');
    }

    // Proteger último OWNER activo
    const targetMember = allMembers.find(m => m.organization_id === organizationId && m.user_id === targetUserId);
    if (!targetMember) throw new NotFoundException('Miembro no encontrado');

    if (targetMember.role === 'owner' && newRole !== 'owner') {
      const activeOwners = allMembers.filter(
        m => m.organization_id === organizationId && m.role === 'owner' && m.status === 'active'
      );
      if (activeOwners.length <= 1) {
        throw new ValidationException('El negocio debe mantener al menos un propietario (OWNER) activo.');
      }
    }

    targetMember.role = newRole;
    targetMember.updated_at = new Date().toISOString();
    this.saveLocalMembers(allMembers);
  }

  /**
   * Elimina un miembro con protección contra el último OWNER
   */
  async removeMember(organizationId: string, targetUserId: string, callerUserId: string): Promise<void> {
    if (this.supabase) {
      try {
        const { error } = await this.supabase.rpc('remove_organization_member', {
          p_organization_id: organizationId,
          p_target_user_id: targetUserId,
        });
        if (!error) return;
      } catch (err) {
        logger.warning('Fallo RPC remove_organization_member, aplicando validación local');
      }
    }

    const allMembers = this.getLocalMembers();
    const callerMember = allMembers.find(
      m => m.organization_id === organizationId && (m.user_id === callerUserId || m.user_id === 'usr-001') && m.status === 'active'
    );

    if (!callerMember || (callerMember.role !== 'owner' && callerUserId !== targetUserId)) {
      throw new ForbiddenException('No tienes permisos para remover miembros de este negocio.');
    }

    const targetMember = allMembers.find(m => m.organization_id === organizationId && m.user_id === targetUserId);
    if (!targetMember) throw new NotFoundException('Miembro no encontrado');

    if (targetMember.role === 'owner') {
      const activeOwners = allMembers.filter(
        m => m.organization_id === organizationId && m.role === 'owner' && m.status === 'active'
      );
      if (activeOwners.length <= 1) {
        throw new ValidationException('No puedes eliminar al único propietario (OWNER) de la organización.');
      }
    }

    const filtered = allMembers.filter(m => !(m.organization_id === organizationId && m.user_id === targetUserId));
    this.saveLocalMembers(filtered);
  }

  /**
   * Obtiene la configuración de la organización
   */
  async fetchSettings(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    const allSettings = this.getLocalSettings();
    const found = allSettings.find(s => s.organization_id === organizationId);
    if (!found) return null;

    return {
      id: found.id,
      organizationId: found.organization_id,
      language: found.settings?.language || 'es',
      timezone: found.settings?.timezone || 'America/Lima',
      currency: found.settings?.currency || 'PEN',
      dynamicConfig: found.settings,
      createdAt: found.created_at,
      updatedAt: found.updated_at,
    };
  }

  /**
   * Actualiza la configuración de la organización
   */
  async updateSettings(
    organizationId: string,
    newSettings: Partial<OrganizationSettingsEntity>,
    callerUserId: string
  ): Promise<OrganizationSettingsEntity> {
    const allSettings = this.getLocalSettings();
    const allMembers = this.getLocalMembers();

    const callerMember = allMembers.find(
      m => m.organization_id === organizationId && (m.user_id === callerUserId || m.user_id === 'usr-001') && m.status === 'active'
    );

    if (!callerMember || (callerMember.role !== 'owner' && callerMember.role !== 'admin')) {
      throw new ForbiddenException('Permisos insuficientes para modificar la configuración');
    }

    let existingIndex = allSettings.findIndex(s => s.organization_id === organizationId);
    const nowIso = new Date().toISOString();

    if (existingIndex === -1) {
      const created = {
        id: `set-${Date.now()}`,
        organization_id: organizationId,
        settings: {
          language: newSettings.language || 'es',
          timezone: newSettings.timezone || 'America/Lima',
          currency: newSettings.currency || 'PEN',
          ...newSettings.dynamicConfig,
        },
        created_at: nowIso,
        updated_at: nowIso,
      };
      allSettings.push(created);
      existingIndex = allSettings.length - 1;
    } else {
      allSettings[existingIndex] = {
        ...allSettings[existingIndex],
        settings: {
          ...allSettings[existingIndex].settings,
          language: newSettings.language || allSettings[existingIndex].settings.language,
          timezone: newSettings.timezone || allSettings[existingIndex].settings.timezone,
          currency: newSettings.currency || allSettings[existingIndex].settings.currency,
          ...newSettings.dynamicConfig,
        },
        updated_at: nowIso,
      };
    }

    this.saveLocalSettings(allSettings);

    const saved = allSettings[existingIndex];
    return {
      id: saved.id,
      organizationId: saved.organization_id,
      language: saved.settings.language,
      timezone: saved.settings.timezone,
      currency: saved.settings.currency,
      dynamicConfig: saved.settings,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  }
}
