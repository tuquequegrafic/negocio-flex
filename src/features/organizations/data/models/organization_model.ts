/**
 * Negocio Flex - Organization Data Model (Fase 4)
 */

import {
  OrganizationEntity,
  BusinessType,
  OrganizationStatus,
  OrganizationRole,
  OrgBrandingEntity,
  OrgModulesConfigEntity,
  OrganizationSettingsEntity,
} from '../../domain/entities/organization_entity';

export class OrganizationModel implements OrganizationEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly businessType: BusinessType,
    public readonly status: OrganizationStatus,
    public readonly createdBy: string,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly currency: string,
    public readonly branding: OrgBrandingEntity,
    public readonly modules: OrgModulesConfigEntity,
    public readonly description?: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly address?: string,
    public readonly settings?: OrganizationSettingsEntity,
    public readonly currentUserRole?: OrganizationRole,
    public readonly memberCount?: number,
  ) {}

  static fromJson(json: any): OrganizationModel {
    const rawBranding = json.branding || {};
    const rawModules = json.modules || {};
    const rawSettings = Array.isArray(json.organization_settings)
      ? json.organization_settings[0] || {}
      : json.organization_settings || json.settings || {};

    const activeModules = rawSettings.active_modules || rawModules || {};

    return new OrganizationModel(
      json.id,
      json.name || 'Mi Negocio',
      json.slug || (json.name ? json.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'mi-negocio'),
      (json.business_type || json.businessType || 'restaurant') as BusinessType,
      (json.status || (json.is_active === false ? 'inactive' : 'active')) as OrganizationStatus,
      json.created_by || json.createdBy || json.owner_id || json.ownerId || '',
      json.created_at || json.createdAt || new Date().toISOString(),
      json.updated_at || json.updatedAt || json.created_at || new Date().toISOString(),
      json.currency || rawSettings.currency || 'S/',
      {
        primaryColor: rawSettings.primary_color || rawBranding.primaryColor || rawBranding.primary_color || '#4F46E5',
        secondaryColor: rawSettings.secondary_color || rawBranding.secondaryColor || rawBranding.secondary_color || '#064E3B',
        logoUrl: rawSettings.logo_url || rawBranding.logoUrl || rawBranding.logo_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150',
        bannerUrl: rawSettings.cover_url || rawBranding.bannerUrl || rawBranding.banner_url,
        fontName: rawBranding.fontName || 'Inter',
        slogan: rawSettings.slogan || rawBranding.slogan || 'Calidad y servicio garantizado',
      },
      {
        enableProducts: activeModules.products ?? rawModules.enableProducts ?? rawModules.enable_products ?? true,
        enableServices: activeModules.services ?? rawModules.enableServices ?? rawModules.enable_services ?? false,
        enableAppointments: activeModules.appointments ?? rawModules.enableAppointments ?? rawModules.enable_appointments ?? false,
        enableInventory: activeModules.inventory ?? rawModules.enableInventory ?? rawModules.enable_inventory ?? true,
        enableOrders: activeModules.orders ?? rawModules.enableOrders ?? rawModules.enable_orders ?? true,
        enableWhatsappCheckout: activeModules.whatsapp ?? rawModules.enableWhatsappCheckout ?? rawModules.enable_whatsapp_checkout ?? true,
        enableStaffManagement: activeModules.staff ?? rawModules.enableStaffManagement ?? rawModules.enable_staff_management ?? false,
        enableReviews: activeModules.reviews ?? rawModules.enableReviews ?? rawModules.enable_reviews ?? true,
      },
      json.description || '',
      rawSettings.phone || json.phone,
      rawSettings.email || json.email,
      rawSettings.address || json.address,
      rawSettings.id
        ? {
            id: rawSettings.id,
            organizationId: rawSettings.organization_id || json.id,
            logoUrl: rawSettings.logo_url,
            coverUrl: rawSettings.cover_url,
            primaryColor: rawSettings.primary_color || '#4F46E5',
            secondaryColor: rawSettings.secondary_color || '#064E3B',
            accentColor: rawSettings.accent_color || '#F59E0B',
            textColor: rawSettings.text_color || '#111827',
            address: rawSettings.address,
            phone: rawSettings.phone,
            whatsappNumber: rawSettings.whatsapp_number,
            whatsappMessage: rawSettings.whatsapp_message,
            email: rawSettings.email,
            instagramUrl: rawSettings.instagram_url,
            facebookUrl: rawSettings.facebook_url,
            tiktokUrl: rawSettings.tiktok_url,
            youtubeUrl: rawSettings.youtube_url,
            websiteUrl: rawSettings.website_url,
            currency: rawSettings.currency || 'S/',
            slogan: rawSettings.slogan,
            activeModules: typeof activeModules === 'object' ? activeModules : undefined,
            language: rawSettings.language || 'es',
            timezone: rawSettings.timezone || 'America/Lima',
            createdAt: rawSettings.created_at || new Date().toISOString(),
            updatedAt: rawSettings.updated_at || new Date().toISOString(),
          }
        : undefined,
      (json.currentUserRole || json.role || 'owner') as OrganizationRole,
      json.memberCount ?? json.member_count ?? 1,
    );
  }

  toJson(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      business_type: this.businessType,
      status: this.status,
      created_by: this.createdBy,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      description: this.description,
      phone: this.phone,
      email: this.email,
      address: this.address,
      currency: this.currency,
      branding: {
        primary_color: this.branding.primaryColor,
        secondary_color: this.branding.secondaryColor,
        logo_url: this.branding.logoUrl,
        banner_url: this.branding.bannerUrl,
        font_name: this.branding.fontName,
        slogan: this.branding.slogan,
      },
      modules: {
        enable_products: this.modules.enableProducts,
        enable_services: this.modules.enableServices,
        enable_appointments: this.modules.enableAppointments,
        enable_inventory: this.modules.enableInventory,
        enable_orders: this.modules.enableOrders,
        enable_whatsapp_checkout: this.modules.enableWhatsappCheckout,
        enable_staff_management: this.modules.enableStaffManagement,
        enable_reviews: this.modules.enableReviews,
      },
      currentUserRole: this.currentUserRole,
      member_count: this.memberCount,
    };
  }
}
