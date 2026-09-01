/// Negocio Flex - Organization Provider & State Manager (Flutter / Dart)

import 'package:flutter/foundation.dart';
import '../../domain/entities/organization_entity.dart';
import '../../domain/entities/organization_member_entity.dart';
import '../../domain/repositories/organization_repository.dart';

class OrganizationProvider extends ChangeNotifier {
  final OrganizationRepository _repository;

  List<OrganizationEntity> _organizations = [];
  OrganizationEntity? _activeOrganization;
  OrganizationMemberEntity? _activeMember;
  bool _isLoading = false;
  String? _errorMessage;

  OrganizationProvider(this._repository);

  List<OrganizationEntity> get organizations => _organizations;
  OrganizationEntity? get activeOrganization => _activeOrganization;
  OrganizationMemberEntity? get activeMember => _activeMember;
  OrganizationRole? get userRole => _activeMember?.role ?? _activeOrganization?.currentUserRole;
  bool get isOwner => userRole == OrganizationRole.owner;
  bool get isAdmin => userRole == OrganizationRole.admin;
  bool get isStaff => userRole == OrganizationRole.staff;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  bool can(OrganizationAction action) {
    return OrganizationEntity.hasPermission(userRole, action);
  }

  Future<void> loadUserOrganizations(String userId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _organizations = await _repository.getUserOrganizations(userId);
      if (_organizations.isNotEmpty && _activeOrganization == null) {
        _activeOrganization = _organizations.first;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> selectOrganization(String orgId) async {
    final found = _organizations.where((o) => o.id == orgId).toList();
    if (found.isEmpty) {
      _errorMessage = 'No perteneces a la organización seleccionada';
      notifyListeners();
      return false;
    }

    _activeOrganization = found.first;
    notifyListeners();
    return true;
  }

  Future<OrganizationEntity?> createNewOrganization({
    required String name,
    required BusinessType businessType,
    String? slug,
    String? description,
    String? phone,
    String? primaryColor,
    required String creatorUserId,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _repository.createOrganization(
        name: name,
        businessType: businessType,
        slug: slug,
        description: description,
        phone: phone,
        primaryColor: primaryColor,
        creatorUserId: creatorUserId,
      );

      _organizations.insert(0, created);
      _activeOrganization = created;
      return created;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
