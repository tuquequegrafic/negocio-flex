/// Negocio Flex - Organization Data Model (Flutter / Dart)

import '../../domain/entities/organization_entity.dart';

class OrganizationModel extends OrganizationEntity {
  const OrganizationModel({
    required super.id,
    required super.name,
    required super.slug,
    required super.businessType,
    super.status,
    required super.createdBy,
    required super.createdAt,
    required super.updatedAt,
    super.description,
    super.phone,
    super.email,
    super.address,
    super.currency,
    super.branding,
    super.modules,
    super.currentUserRole,
    super.memberCount,
  });

  factory OrganizationModel.fromJson(Map<String, dynamic> json) {
    final rawBranding = json['branding'] as Map<String, dynamic>? ?? {};
    final rawModules = json['modules'] as Map<String, dynamic>? ?? {};

    BusinessType parseBusinessType(String? type) {
      switch (type) {
        case 'restaurant': return BusinessType.restaurant;
        case 'salon': return BusinessType.salon;
        case 'gym': return BusinessType.gym;
        case 'store': return BusinessType.store;
        case 'professional': return BusinessType.professional;
        default: return BusinessType.other;
      }
    }

    OrganizationRole? parseRole(String? role) {
      switch (role) {
        case 'owner': return OrganizationRole.owner;
        case 'admin': return OrganizationRole.admin;
        case 'staff': return OrganizationRole.staff;
        default: return null;
      }
    }

    return OrganizationModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Mi Negocio',
      slug: json['slug'] ?? 'mi-negocio',
      businessType: parseBusinessType(json['business_type'] ?? json['businessType']),
      status: json['status'] == 'inactive' ? OrganizationStatus.inactive : OrganizationStatus.active,
      createdBy: json['created_by'] ?? json['createdBy'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : DateTime.now(),
      description: json['description'],
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      currency: json['currency'] ?? 'S/',
      branding: OrgBrandingEntity(
        primaryColor: rawBranding['primary_color'] ?? rawBranding['primaryColor'] ?? '#4F46E5',
        secondaryColor: rawBranding['secondary_color'] ?? rawBranding['secondaryColor'] ?? '#0D9488',
        logoUrl: rawBranding['logo_url'] ?? rawBranding['logoUrl'],
        bannerUrl: rawBranding['banner_url'] ?? rawBranding['bannerUrl'],
        slogan: rawBranding['slogan'],
      ),
      modules: OrgModulesConfigEntity(
        enableProducts: rawModules['enable_products'] ?? rawModules['enableProducts'] ?? true,
        enableServices: rawModules['enable_services'] ?? rawModules['enableServices'] ?? true,
        enableAppointments: rawModules['enable_appointments'] ?? rawModules['enableAppointments'] ?? false,
        enableInventory: rawModules['enable_inventory'] ?? rawModules['enableInventory'] ?? true,
        enableOrders: rawModules['enable_orders'] ?? rawModules['enableOrders'] ?? true,
        enableWhatsappCheckout: rawModules['enable_whatsapp_checkout'] ?? rawModules['enableWhatsappCheckout'] ?? true,
        enableStaffManagement: rawModules['enable_staff_management'] ?? rawModules['enableStaffManagement'] ?? true,
        enableReviews: rawModules['enable_reviews'] ?? rawModules['enableReviews'] ?? true,
      ),
      currentUserRole: parseRole(json['currentUserRole'] ?? json['role']),
      memberCount: json['member_count'] ?? json['memberCount'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'business_type': businessType.name,
      'status': status.name,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'description': description,
      'phone': phone,
      'email': email,
      'address': address,
      'currency': currency,
      'member_count': memberCount,
    };
  }
}
