/// Negocio Flex - Organization Member Entity (Flutter / Dart)

import 'organization_entity.dart';

enum MemberStatus {
  active,
  inactive,
  invited,
  suspended,
}

class OrganizationMemberEntity {
  final String id;
  final String organizationId;
  final String userId;
  final OrganizationRole role;
  final MemberStatus status;
  final String? userFullName;
  final String? userEmail;
  final String? userAvatarUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  const OrganizationMemberEntity({
    required this.id,
    required this.organizationId,
    required this.userId,
    required this.role,
    this.status = MemberStatus.active,
    this.userFullName,
    this.userEmail,
    this.userAvatarUrl,
    required this.createdAt,
    required this.updatedAt,
  });
}
