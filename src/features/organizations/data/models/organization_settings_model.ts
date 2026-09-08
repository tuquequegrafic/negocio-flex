/**
 * Negocio Flex - Organization Settings Model (Fase 3 & 4)
 * Mapeo tipado entre la tabla `organization_settings` de Supabase/PostgreSQL y la entidad de dominio.
 */

import { OrganizationSettingsEntity } from '../../domain/entities/organization_entity';
import { Database } from '../../../../types/database.types';

export type OrganizationSettingsRow = Database['public']['Tables']['organization_settings']['Row'];
export type OrganizationSettingsUpdate = Database['public']['Tables']['organization_settings']['Update'];
export type OrganizationSettingsInsert = Database['public']['Tables']['organization_settings']['Insert'];

export class OrganizationSettingsModel implements OrganizationSettingsEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly currency: string,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly logoUrl?: string,
    public readonly coverUrl?: string,
    public readonly primaryColor?: string,
    public readonly secondaryColor?: string,
    public readonly accentColor?: string,
    public readonly textColor?: string,
    public readonly address?: string,
    public readonly phone?: string,
    public readonly whatsappNumber?: string,
    public readonly whatsappMessage?: string,
    public readonly email?: string,
    public readonly instagramUrl?: string,
    public readonly facebookUrl?: string,
    public readonly tiktokUrl?: string,
    public readonly youtubeUrl?: string,
    public readonly websiteUrl?: string,
    public readonly slogan?: string,
    public readonly activeModules?: Record<string, boolean>,
    public readonly language?: string,
    public readonly timezone?: string,
    public readonly dynamicConfig?: Record<string, any>,
  ) {}

  static fromJson(json: any): OrganizationSettingsModel {
    const rawModules = json.active_modules || json.activeModules || {};
    return new OrganizationSettingsModel(
      json.id,
      json.organization_id || json.organizationId,
      json.currency || 'S/',
      json.created_at || json.createdAt || new Date().toISOString(),
      json.updated_at || json.updatedAt || new Date().toISOString(),
      json.logo_url || json.logoUrl,
      json.cover_url || json.coverUrl,
      json.primary_color || json.primaryColor || '#4F46E5',
      json.secondary_color || json.secondaryColor || '#064E3B',
      json.accent_color || json.accentColor || '#F59E0B',
      json.text_color || json.textColor || '#111827',
      json.address,
      json.phone,
      json.whatsapp_number || json.whatsappNumber || '',
      json.whatsapp_message || json.whatsappMessage,
      json.email,
      json.instagram_url || json.instagramUrl,
      json.facebook_url || json.facebookUrl,
      json.tiktok_url || json.tiktokUrl,
      json.youtube_url || json.youtubeUrl,
      json.website_url || json.websiteUrl,
      json.slogan,
      typeof rawModules === 'object' && rawModules !== null ? rawModules : undefined,
      json.language || 'es',
      json.timezone || 'America/Lima',
      json.dynamicConfig || (typeof rawModules === 'object' ? rawModules : undefined),
    );
  }

  toJson(): OrganizationSettingsRow {
    return {
      id: this.id,
      organization_id: this.organizationId,
      logo_url: this.logoUrl || null,
      cover_url: this.coverUrl || null,
      primary_color: this.primaryColor || '#4F46E5',
      secondary_color: this.secondaryColor || '#064E3B',
      accent_color: this.accentColor || '#F59E0B',
      text_color: this.textColor || '#111827',
      address: this.address || null,
      phone: this.phone || null,
      whatsapp_number: this.whatsappNumber || '',
      whatsapp_message: this.whatsappMessage || null,
      email: this.email || null,
      instagram_url: this.instagramUrl || null,
      facebook_url: this.facebookUrl || null,
      tiktok_url: this.tiktokUrl || null,
      youtube_url: this.youtubeUrl || null,
      website_url: this.websiteUrl || null,
      currency: this.currency || 'S/',
      slogan: this.slogan || null,
      active_modules: this.activeModules || {},
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
