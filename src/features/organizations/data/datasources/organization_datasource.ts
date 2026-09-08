/**
 * Negocio Flex - Organization Datasource (Fase 3 & 4)
 * Integración Real con Supabase / PostgreSQL con RLS y RPCs.
 * Fuente única de verdad: Base de datos Supabase / PostgreSQL.
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import { Database } from '../../../../types/database.types';
import { OrganizationModel } from '../models/organization_model';
import { OrganizationMemberModel } from '../models/organization_member_model';
import { OrganizationSettingsModel } from '../models/organization_settings_model';
import {
  CreateOrganizationParams,
} from '../../domain/repositories/organization_repository';
import {
  OrganizationEntity,
  OrganizationMemberEntity,
  OrganizationSettingsEntity,
  OrganizationRole,
} from '../../domain/entities/organization_entity';
import { PublicBusinessData } from '../../domain/entities/public_business_entity';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_BUSINESS_HOURS,
  INITIAL_GALLERY_ITEMS
} from '../../../../core/data/initialData';
import {
  Organization,
  OrganizationSettings,
  Category,
  Product,
  ServiceItem,
  GalleryItem,
  BusinessHour
} from '../../../../types';
import { SlugValidator } from '../../../../core/validators/slug_validator';
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class OrganizationDataSource {
  private getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Cliente de Supabase no inicializado');
    }
    return client;
  }

  // --- Multi-Tenant Queries ---

  /**
   * Obtiene las organizaciones autorizadas para el usuario autenticado (donde status = active)
   * Consulta directamente Supabase PostgreSQL con joins a organization_members y organization_settings.
   */
  async fetchUserOrganizations(userId: string): Promise<OrganizationModel[]> {
    logger.info('Consultando organizaciones multi-tenant autorizadas en Supabase...', { userId });

    const client = this.getClient();

    const { data, error } = await client
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
          organization_id,
          logo_url,
          cover_url,
          primary_color,
          secondary_color,
          accent_color,
          text_color,
          address,
          phone,
          whatsapp_number,
          whatsapp_message,
          email,
          instagram_url,
          facebook_url,
          tiktok_url,
          youtube_url,
          website_url,
          currency,
          slogan,
          active_modules,
          created_at,
          updated_at
        )
      `)
      .eq('organization_members.user_id', userId)
      .eq('organization_members.status', 'active');

    if (error) {
      logger.error('Error al consultar organizaciones en Supabase:', error);
      throw new Error(`Error al consultar organizaciones: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => {
      const memberInfo = Array.isArray(row.organization_members)
        ? row.organization_members.find((m: any) => m.user_id === userId) || row.organization_members[0]
        : row.organization_members;
      const settingsInfo = Array.isArray(row.organization_settings)
        ? row.organization_settings[0]
        : row.organization_settings;

      return OrganizationModel.fromJson({
        ...row,
        currentUserRole: memberInfo?.role || 'staff',
        organization_settings: settingsInfo,
      });
    });
  }

  /**
   * Obtiene una organización específica verificando que el usuario tenga membresía activa
   */
  async fetchOrganizationById(id: string, userId: string): Promise<OrganizationModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('organizations')
      .select(`
        *,
        organization_members (
          role,
          status,
          user_id
        ),
        organization_settings (
          id,
          organization_id,
          logo_url,
          cover_url,
          primary_color,
          secondary_color,
          accent_color,
          text_color,
          address,
          phone,
          whatsapp_number,
          whatsapp_message,
          email,
          instagram_url,
          facebook_url,
          tiktok_url,
          youtube_url,
          website_url,
          currency,
          slogan,
          active_modules,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar organización por ID en Supabase:', error);
      throw new Error(`Error al obtener negocio: ${error.message}`);
    }

    if (!data) return null;

    const rawMembers = Array.isArray(data.organization_members) ? data.organization_members : [];
    const memberInfo = rawMembers.find((m: any) => m.user_id === userId);
    const settingsInfo = Array.isArray(data.organization_settings)
      ? data.organization_settings[0]
      : data.organization_settings;

    return OrganizationModel.fromJson({
      ...data,
      currentUserRole: memberInfo?.role || 'staff',
      memberCount: rawMembers.filter((m: any) => m.status === 'active').length || 1,
      organization_settings: settingsInfo,
    });
  }

  /**
   * Busca por slug (accesible públicamente si is_active = true o si el usuario es miembro)
   */
  async fetchOrganizationBySlug(slug: string): Promise<OrganizationModel | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('organizations')
      .select(`
        *,
        organization_settings (
          id,
          organization_id,
          logo_url,
          cover_url,
          primary_color,
          secondary_color,
          accent_color,
          text_color,
          address,
          phone,
          whatsapp_number,
          whatsapp_message,
          email,
          instagram_url,
          facebook_url,
          tiktok_url,
          youtube_url,
          website_url,
          currency,
          slogan,
          active_modules,
          created_at,
          updated_at
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      logger.error('Error al consultar organización por slug en Supabase:', error);
      throw new Error(`Error al buscar negocio por catálogo: ${error.message}`);
    }

    if (!data) return null;

    const settingsInfo = Array.isArray(data.organization_settings)
      ? data.organization_settings[0]
      : data.organization_settings;

    return OrganizationModel.fromJson({
      ...data,
      organization_settings: settingsInfo,
    });
  }

  /**
   * Creación Atómica Transaccional:
   * Invoca el RPC `create_organization` de Supabase PostgreSQL con RLS y SECURITY DEFINER.
   */
  async createOrganization(params: CreateOrganizationParams, creatorUserId: string): Promise<OrganizationModel> {
    logger.info('Iniciando creación transaccional de organización en Supabase...', { name: params.name, creatorUserId });

    const client = this.getClient();
    const normalizedSlug = params.slug ? SlugValidator.normalize(params.slug) : SlugValidator.normalize(params.name);

    // 1. Invocar RPC atómico
    const { data, error } = await client.rpc('create_organization', {
      org_name: params.name.trim(),
      org_business_type: params.businessType,
      custom_slug: normalizedSlug,
    });

    if (error) {
      logger.error('Error al ejecutar RPC create_organization en Supabase:', error);
      throw new Error(`No fue posible crear la organización: ${error.message}`);
    }

    const createdPayload = (typeof data === 'string' ? JSON.parse(data) : data) as any;
    const orgId = createdPayload?.id;

    if (!orgId) {
      throw new Error('Respuesta inválida de creación de organización en Supabase');
    }

    // 2. Si se especificaron datos adicionales de configuración (teléfono, branding, descripción), actualizamos
    if (params.description || params.phone || params.primaryColor) {
      if (params.description) {
        await client
          .from('organizations')
          .update({ description: params.description, updated_at: new Date().toISOString() })
          .eq('id', orgId);
      }

      const settingsUpdate: Database['public']['Tables']['organization_settings']['Update'] = {
        updated_at: new Date().toISOString(),
      };
      if (params.phone) settingsUpdate.phone = params.phone;
      if (params.primaryColor) settingsUpdate.primary_color = params.primaryColor;

      await client
        .from('organization_settings')
        .update(settingsUpdate)
        .eq('organization_id', orgId);
    }

    // 3. Consultar y retornar la entidad completa recién creada
    const completeOrg = await this.fetchOrganizationById(orgId, creatorUserId);
    if (!completeOrg) {
      return OrganizationModel.fromJson({
        ...createdPayload,
        currentUserRole: 'owner',
        memberCount: 1,
      });
    }

    return completeOrg;
  }

  /**
   * Actualiza los datos de la organización con verificación de políticas RLS en Supabase (OWNER / ADMIN)
   */
  async updateOrganization(
    id: string,
    updates: Partial<OrganizationEntity>,
    callerUserId: string
  ): Promise<OrganizationModel> {
    const client = this.getClient();

    const updatePayload: Database['public']['Tables']['organizations']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.businessType !== undefined) updatePayload.business_type = updates.businessType;
    if (updates.slug !== undefined) updatePayload.slug = SlugValidator.normalize(updates.slug);
    if (updates.description !== undefined) updatePayload.description = updates.description;

    const { data, error } = await client
      .from('organizations')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        organization_settings (
          id,
          organization_id,
          logo_url,
          cover_url,
          primary_color,
          secondary_color,
          accent_color,
          text_color,
          address,
          phone,
          whatsapp_number,
          whatsapp_message,
          email,
          instagram_url,
          facebook_url,
          tiktok_url,
          youtube_url,
          website_url,
          currency,
          slogan,
          active_modules,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error) {
      logger.error('Error al actualizar organización en Supabase:', error);
      throw new Error(`Error al actualizar organización: ${error.message}`);
    }

    if (updates.phone !== undefined) {
      await client
        .from('organization_settings')
        .update({ phone: updates.phone, updated_at: new Date().toISOString() })
        .eq('organization_id', id);
    }

    return OrganizationModel.fromJson(data);
  }

  /**
   * Obtiene la lista de miembros de una organización desde Supabase con join a profiles
   */
  async fetchMembers(organizationId: string): Promise<OrganizationMemberModel[]> {
    const client = this.getClient();

    const { data, error } = await client
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role,
        status,
        permissions,
        created_at,
        updated_at,
        profiles:user_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error al consultar miembros en Supabase:', error);
      throw new Error(`Error al consultar miembros: ${error.message}`);
    }

    return (data || []).map((d: any) => OrganizationMemberModel.fromJson(d));
  }

  /**
   * Cambia el rol de un miembro protegiendo al último OWNER mediante el RPC seguro de Supabase
   */
  async changeMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    callerUserId: string
  ): Promise<void> {
    const client = this.getClient();

    const { error } = await client.rpc('change_member_role', {
      p_organization_id: organizationId,
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });

    if (error) {
      logger.error('Error al ejecutar RPC change_member_role en Supabase:', error);
      throw new Error(`Error al cambiar rol del miembro: ${error.message}`);
    }
  }

  /**
   * Elimina un miembro con protección contra el último OWNER mediante el RPC seguro de Supabase
   */
  async removeMember(organizationId: string, targetUserId: string, callerUserId: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.rpc('remove_organization_member', {
      p_organization_id: organizationId,
      p_target_user_id: targetUserId,
    });

    if (error) {
      logger.error('Error al ejecutar RPC remove_organization_member en Supabase:', error);
      throw new Error(`Error al eliminar miembro: ${error.message}`);
    }
  }

  /**
   * Obtiene la configuración de la organización desde la tabla `organization_settings` de Supabase
   */
  async fetchSettings(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      logger.error('Error al obtener configuración de organización desde Supabase:', error);
      throw new Error(`Error al obtener configuración: ${error.message}`);
    }

    if (!data) return null;
    return OrganizationSettingsModel.fromJson(data);
  }

  /**
   * Actualiza la configuración de la organización en la tabla `organization_settings` de Supabase
   */
  async updateSettings(
    organizationId: string,
    newSettings: Partial<OrganizationSettingsEntity>,
    callerUserId: string
  ): Promise<OrganizationSettingsEntity> {
    const client = this.getClient();

    const payload: Database['public']['Tables']['organization_settings']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (newSettings.logoUrl !== undefined) payload.logo_url = newSettings.logoUrl;
    if (newSettings.coverUrl !== undefined) payload.cover_url = newSettings.coverUrl;
    if (newSettings.primaryColor !== undefined) payload.primary_color = newSettings.primaryColor;
    if (newSettings.secondaryColor !== undefined) payload.secondary_color = newSettings.secondaryColor;
    if (newSettings.accentColor !== undefined) payload.accent_color = newSettings.accentColor;
    if (newSettings.textColor !== undefined) payload.text_color = newSettings.textColor;
    if (newSettings.address !== undefined) payload.address = newSettings.address;
    if (newSettings.phone !== undefined) payload.phone = newSettings.phone;
    if (newSettings.whatsappNumber !== undefined) payload.whatsapp_number = newSettings.whatsappNumber;
    if (newSettings.whatsappMessage !== undefined) payload.whatsapp_message = newSettings.whatsappMessage;
    if (newSettings.email !== undefined) payload.email = newSettings.email;
    if (newSettings.instagramUrl !== undefined) payload.instagram_url = newSettings.instagramUrl;
    if (newSettings.facebookUrl !== undefined) payload.facebook_url = newSettings.facebookUrl;
    if (newSettings.tiktokUrl !== undefined) payload.tiktok_url = newSettings.tiktokUrl;
    if (newSettings.youtubeUrl !== undefined) payload.youtube_url = newSettings.youtubeUrl;
    if (newSettings.websiteUrl !== undefined) payload.website_url = newSettings.websiteUrl;
    if (newSettings.currency !== undefined) payload.currency = newSettings.currency;
    if (newSettings.slogan !== undefined) payload.slogan = newSettings.slogan;
    if (newSettings.activeModules !== undefined) payload.active_modules = newSettings.activeModules;

    const { data, error } = await client
      .from('organization_settings')
      .update(payload)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      logger.error('Error al actualizar configuración en Supabase:', error);
      throw new Error(`Error al guardar configuración del negocio: ${error.message}`);
    }

    return OrganizationSettingsModel.fromJson(data);
  }

  /**
   * Obtiene de forma pública y atómica todos los datos de un negocio por su slug (Fase 7).
   * Consulta Supabase para traer la organización, branding, categorías activas,
   * productos activos, servicios activos, horarios y galería.
   * Cuenta con fallback resiliente para entornos offline o de prueba.
   */
  async fetchPublicBusinessData(slugOrId: string): Promise<PublicBusinessData | null> {
    logger.info('Consultando datos públicos del negocio en Supabase...', { slugOrId });

    try {
      const client = supabaseService.getClient();

      if (client) {
        // 1. Buscar la organización por slug o por ID (según formato para evitar error 22P02 en PostgreSQL)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        let orgQuery = client
          .from('organizations')
          .select(`
            *,
            organization_settings (
              id,
              organization_id,
              logo_url,
              cover_url,
              primary_color,
              secondary_color,
              accent_color,
              text_color,
              address,
              phone,
              whatsapp_number,
              whatsapp_message,
              email,
              instagram_url,
              facebook_url,
              tiktok_url,
              youtube_url,
              website_url,
              currency,
              slogan,
              active_modules
            )
          `);

        if (isUuid) {
          orgQuery = orgQuery.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
        } else {
          orgQuery = orgQuery.eq('slug', slugOrId);
        }

        const { data: orgData, error: orgError } = await orgQuery.maybeSingle();

        if (orgError) {
          logger.warning('Error consultando organización pública en Supabase:', orgError);
        } else if (!orgData) {
          // Si Supabase respondió sin error pero no encontró registro, es un 404 real
          logger.info('Negocio no encontrado en Supabase por slug o ID:', { slugOrId });
          return null;
        } else {
          const rawSettings = Array.isArray(orgData.organization_settings)
            ? orgData.organization_settings[0]
            : orgData.organization_settings;

          const activeModules = (typeof rawSettings?.active_modules === 'object' && rawSettings?.active_modules !== null)
            ? rawSettings.active_modules
            : {
                products: true,
                services: true,
                categories: true,
                orders: true,
                appointments: true,
                delivery: true,
                promotions: true,
                gallery: true,
                whatsapp: true,
                hours: true,
                location: true,
                testimonials: true,
                social: true,
                notifications: true,
                analytics: true,
              };

          const settings: OrganizationSettings = {
            organization_id: orgData.id,
            logo_url: rawSettings?.logo_url || '',
            cover_url: rawSettings?.cover_url || '',
            primary_color: rawSettings?.primary_color || '#4F46E5',
            secondary_color: rawSettings?.secondary_color || '#064E3B',
            accent_color: rawSettings?.accent_color || '#F59E0B',
            text_color: rawSettings?.text_color || '#111827',
            address: rawSettings?.address || '',
            phone: rawSettings?.phone || '',
            whatsapp_number: rawSettings?.whatsapp_number || '',
            whatsapp_message: rawSettings?.whatsapp_message || '',
            email: rawSettings?.email || '',
            instagram_url: rawSettings?.instagram_url || undefined,
            facebook_url: rawSettings?.facebook_url || undefined,
            tiktok_url: rawSettings?.tiktok_url || undefined,
            youtube_url: rawSettings?.youtube_url || undefined,
            website_url: rawSettings?.website_url || undefined,
            currency: rawSettings?.currency || 'S/',
            slogan: rawSettings?.slogan || orgData.description || '',
            active_modules: activeModules as any,
          };

          const organization: Organization = {
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            business_type: orgData.business_type as any,
            description: orgData.description || '',
            is_active: orgData.is_active,
            created_by: '', // Sanitizado: 0 fuga de UUID de usuario administrador
            created_at: orgData.created_at,
            settings,
          };

          // Si la organización está inactiva (is_active = false), retornamos solo datos básicos
          // para que la UI muestre la pantalla de mantenimiento según la regla de la Fase 7.
          if (!orgData.is_active) {
            return {
              organization,
              settings,
              categories: [],
              products: [],
              services: [],
              gallery: [],
              businessHours: [],
            };
          }

          // Consultar en paralelo categorías, productos, servicios, horarios y galería (solo activos)
          const [catRes, prodRes, servRes, hoursRes, galleryRes] = await Promise.all([
            client
              .from('categories')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('is_active', true)
              .order('display_order', { ascending: true }),
            client
              .from('products')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('is_active', true)
              .order('display_order', { ascending: true }),
            client
              .from('services')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('is_active', true)
              .order('display_order', { ascending: true }),
            client
              .from('business_hours')
              .select('*')
              .eq('organization_id', orgData.id)
              .order('day_of_week', { ascending: true }),
            client
              .from('business_gallery')
              .select('*')
              .eq('organization_id', orgData.id)
              .order('display_order', { ascending: true }),
          ]);

          const categories: Category[] = (catRes.data || []).map((c: any) => ({
            id: c.id,
            organization_id: c.organization_id,
            name: c.name,
            description: c.description || undefined,
            image_url: c.image_url || undefined,
            icon: c.icon || undefined,
            type: (c.type as 'PRODUCT' | 'SERVICE') || 'PRODUCT',
            display_order: c.display_order ?? 0,
            is_active: c.is_active,
            created_at: c.created_at,
          }));

          const products: Product[] = (prodRes.data || []).map((p: any) => {
            let parsedImages: string[] = [];
            if (Array.isArray(p.images)) {
              parsedImages = p.images;
            } else if (typeof p.images === 'string' && p.images.trim()) {
              try {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed)) parsedImages = parsed;
              } catch {
                parsedImages = [p.images];
              }
            } else if (p.image_url) {
              parsedImages = [p.image_url];
            }

            return {
              id: p.id,
              organization_id: p.organization_id,
              category_id: p.category_id || undefined,
              name: p.name,
              description: p.description || '',
              price: Number(p.price) || 0,
              promo_price: p.promo_price !== null && p.promo_price !== undefined
                ? Number(p.promo_price)
                : (p.promotional_price ? Number(p.promotional_price) : undefined),
              stock: Number(p.stock) || 0,
              is_active: p.is_active,
              is_featured: p.is_featured || false,
              display_order: p.display_order ?? 0,
              images: parsedImages,
              created_at: p.created_at,
              updated_at: p.updated_at,
            };
          });

          const services: ServiceItem[] = (servRes.data || []).map((s: any) => ({
            id: s.id,
            organization_id: s.organization_id,
            category_id: s.category_id || undefined,
            name: s.name,
            description: s.description || '',
            image_url: s.image_url || undefined,
            price: Number(s.price) || 0,
            promo_price: s.promo_price !== null && s.promo_price !== undefined
              ? Number(s.promo_price)
              : (s.promotional_price ? Number(s.promotional_price) : undefined),
            duration_minutes: Number(s.duration_minutes) || 30,
            is_active: s.is_active,
            is_featured: s.is_featured || false,
            display_order: s.display_order ?? 0,
            created_at: s.created_at,
            updated_at: s.updated_at,
          }));

          const businessHours: BusinessHour[] = (hoursRes.data || []).map((h: any) => ({
            id: h.id,
            organization_id: h.organization_id,
            day_of_week: Number(h.day_of_week),
            day_name: h.day_name,
            open_time: h.open_time || '09:00',
            close_time: h.close_time || '21:00',
            is_closed: Boolean(h.is_closed),
          }));

          const gallery: GalleryItem[] = (galleryRes.data || []).map((g: any) => ({
            id: g.id,
            organization_id: g.organization_id,
            title: g.title || undefined,
            caption: g.caption || undefined,
            category: g.category || undefined,
            image_url: g.image_url,
            display_order: Number(g.display_order) || 0,
            created_at: g.created_at,
          }));

          return {
            organization,
            settings,
            categories,
            products,
            services,
            gallery,
            businessHours,
          };
        }
      }
    } catch (err) {
      logger.warning('Fallo al consultar datos de Supabase, activando fallback local:', err);
    }

    // --- Fallback Resiliente (para demostraciones o base de datos en standby) ---
    const localOrg = INITIAL_ORGANIZATIONS.find(
      (o) => o.slug === slugOrId || o.id === slugOrId
    );

    if (!localOrg) {
      return null;
    }

    const orgId = localOrg.id;
    const categories = INITIAL_CATEGORIES.filter((c) => c.organization_id === orgId && c.is_active);
    const products = INITIAL_PRODUCTS.filter((p) => p.organization_id === orgId && p.is_active);
    const services = INITIAL_SERVICES.filter((s) => s.organization_id === orgId && s.is_active);
    const businessHours = INITIAL_BUSINESS_HOURS.filter((h) => h.organization_id === orgId);
    const gallery = INITIAL_GALLERY_ITEMS.filter((g) => g.organization_id === orgId);

    return {
      organization: localOrg,
      settings: localOrg.settings || ({} as OrganizationSettings),
      categories,
      products,
      services,
      gallery,
      businessHours,
    };
  }
}
