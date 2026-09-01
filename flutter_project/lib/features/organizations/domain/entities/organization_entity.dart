/// Negocio Flex - Organization Domain Entity (Flutter / Dart)

enum BusinessType {
  restaurant,
  salon,
  gym,
  store,
  professional,
  other,
  pasteleria,
  barberia,
  ferreteria,
  veterinaria,
  boutique,
  serviciosGenerales,
  personalizado,
}

enum OrganizationStatus {
  active,
  inactive,
  suspended,
}

enum OrganizationRole {
  owner,
  admin,
  staff,
}

enum OrganizationAction {
  editBusinessInfo,
  manageMembers,
  changeMemberRoles,
  removeMembers,
  inviteMembers,
  configureSettings,
  viewMetrics,
  viewCatalog,
  manageCatalog,
  viewOrders,
  manageOrders,
}

class OrgBrandingEntity {
  final String primaryColor;
  final String secondaryColor;
  final String? logoUrl;
  final String? bannerUrl;
  final String? fontName;
  final String? slogan;

  const OrgBrandingEntity({
    this.primaryColor = '#4F46E5',
    this.secondaryColor = '#0D9488',
    this.logoUrl,
    this.bannerUrl,
    this.fontName,
    this.slogan,
  });
}

class OrgModulesConfigEntity {
  final bool enableProducts;
  final bool enableServices;
  final bool enableAppointments;
  final bool enableInventory;
  final bool enableOrders;
  final bool enableWhatsappCheckout;
  final bool enableStaffManagement;
  final bool enableReviews;

  const OrgModulesConfigEntity({
    this.enableProducts = true,
    this.enableServices = true,
    this.enableAppointments = false,
    this.enableInventory = true,
    this.enableOrders = true,
    this.enableWhatsappCheckout = true,
    this.enableStaffManagement = true,
    this.enableReviews = true,
  });
}

class OrganizationEntity {
  final String id;
  final String name;
  final String slug;
  final BusinessType businessType;
  final OrganizationStatus status;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? description;
  final String? phone;
  final String? email;
  final String? address;
  final String currency;
  final OrgBrandingEntity branding;
  final OrgModulesConfigEntity modules;
  final OrganizationRole? currentUserRole;
  final int memberCount;

  const OrganizationEntity({
    required this.id,
    required this.name,
    required this.slug,
    required this.businessType,
    this.status = OrganizationStatus.active,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.phone,
    this.email,
    this.address,
    this.currency = 'S/',
    this.branding = const OrgBrandingEntity(),
    this.modules = const OrgModulesConfigEntity(),
    this.currentUserRole,
    this.memberCount = 1,
  });

  static bool hasPermission(OrganizationRole? role, OrganizationAction action) {
    if (role == null) return false;
    switch (role) {
      case OrganizationRole.owner:
        return true;
      case OrganizationRole.admin:
        switch (action) {
          case OrganizationAction.editBusinessInfo:
          case OrganizationAction.configureSettings:
          case OrganizationAction.viewMetrics:
          case OrganizationAction.viewCatalog:
          case OrganizationAction.manageCatalog:
          case OrganizationAction.viewOrders:
          case OrganizationAction.manageOrders:
          case OrganizationAction.inviteMembers:
            return true;
          case OrganizationAction.manageMembers:
          case OrganizationAction.changeMemberRoles:
          case OrganizationAction.removeMembers:
            return false;
        }
      case OrganizationRole.staff:
        switch (action) {
          case OrganizationAction.viewCatalog:
          case OrganizationAction.viewOrders:
          case OrganizationAction.manageOrders:
            return true;
          default:
            return false;
        }
    }
  }
}
