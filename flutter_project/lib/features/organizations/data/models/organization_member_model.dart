/// Negocio Flex - Organization Member Model (Flutter / Dart)

import '../../domain/entities/organization_entity.dart';
import '../../domain/entities/organization_member_entity.dart';

class OrganizationMemberModel extends OrganizationMemberEntity {
  const OrganizationMemberModel({
    required super.id,
    required super.organizationId,
    required super.userId,
    required super.role,
    super.status,
    super.userFullName,
    super.userEmail,
    super.userAvatarUrl,
    required super.createdAt,
    required super.updatedAt,
  });

  factory OrganizationMemberModel.fromJson(Map<String, dynamic> json) {
    OrganizationRole parseRole(String? role) {
      switch (role) {
        case 'owner': return OrganizationRole.owner;
        case 'admin': return OrganizationRole.admin;
        default: return OrganizationRole.staff;
      }
    }

    MemberStatus parseStatus(String? status) {
      switch (status) {
        case 'inactive': return MemberStatus.inactive;
        case 'invited': return MemberStatus.invited;
        case 'suspended': return MemberStatus.suspended;
        default: return MemberStatus.active;
      }
    }

    final rawProfiles = json['profiles'] as Map<String, dynamic>? ?? {};

    return OrganizationMemberModel(
      id: json['id'] ?? '',
      organizationId: json['organization_id'] ?? json['organizationId'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
      role: parseRole(json['role']),
      status: parseStatus(json['status']),
      userFullName: rawProfiles['full_name'] ?? json['user_full_name'],
      userEmail: rawProfiles['email'] ?? json['user_email'],
      userAvatarUrl: rawProfiles['avatar_url'] ?? json['user_avatar_url'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'organization_id': organizationId,
      'user_id': userId,
      'role': role.name,
      'status': status.name,
      'user_full_name': userFullName,
      'user_email': userEmail,
      'user_avatar_url': userAvatarUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
