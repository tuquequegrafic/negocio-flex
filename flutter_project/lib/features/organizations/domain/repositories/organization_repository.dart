/// Negocio Flex - Organization Repository Contract (Flutter / Dart)

import '../entities/organization_entity.dart';
import '../entities/organization_member_entity.dart';

abstract class OrganizationRepository {
  Future<List<OrganizationEntity>> getUserOrganizations(String userId);
  Future<OrganizationEntity?> getOrganizationById(String id);
  Future<OrganizationEntity?> getOrganizationBySlug(String slug);
  Future<OrganizationEntity> createOrganization({
    required String name,
    required BusinessType businessType,
    String? slug,
    String? description,
    String? phone,
    String? primaryColor,
    required String creatorUserId,
  });
  Future<OrganizationEntity> updateOrganization({
    required String id,
    required Map<String, dynamic> updates,
    required String callerUserId,
  });
  Future<List<OrganizationMemberEntity>> getMembers(String organizationId);
  Future<void> changeMemberRole({
    required String organizationId,
    required String targetUserId,
    required OrganizationRole newRole,
    required String callerUserId,
  });
  Future<void> removeMember({
    required String organizationId,
    required String targetUserId,
    required String callerUserId,
  });
}
