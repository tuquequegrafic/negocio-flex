/**
 * Negocio Flex - Public Business Domain Entity (Fase 7)
 * Entidad que consolida los datos públicos de un negocio para el catálogo web y SEO.
 * Acceso público seguro sin exposición de datos privados (PII).
 */

import {
  Organization,
  OrganizationSettings,
  Category,
  Product,
  ServiceItem,
  GalleryItem,
  BusinessHour
} from '../../../../types';

export interface PublicBusinessData {
  organization: Organization;
  settings: OrganizationSettings;
  categories: Category[];
  products: Product[];
  services: ServiceItem[];
  gallery: GalleryItem[];
  businessHours: BusinessHour[];
}
