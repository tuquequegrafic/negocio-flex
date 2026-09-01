/// Negocio Flex - Slug Normalizer & Validator (Flutter / Dart)
class SlugValidator {
  static String normalize(String text) {
    if (text.isEmpty) return '';
    String slug = text.toLowerCase().trim();

    // Reemplazo de tildes y caracteres comunes
    slug = slug
        .replaceAll(RegExp(r'[áàäâ]'), 'a')
        .replaceAll(RegExp(r'[éèëê]'), 'e')
        .replaceAll(RegExp(r'[íìïî]'), 'i')
        .replaceAll(RegExp(r'[óòöô]'), 'o')
        .replaceAll(RegExp(r'[úùüû]'), 'u')
        .replaceAll(RegExp(r'[ñ]'), 'n')
        .replaceAll(RegExp(r'[ç]'), 'c');

    slug = slug.replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    slug = slug.replaceAll(RegExp(r'-+'), '-').replaceAll(RegExp(r'^-+|-+$'), '');

    return slug.isEmpty ? 'negocio' : slug;
  }

  static String? validate(String? slug) {
    if (slug == null || slug.trim().isEmpty) {
      return 'El identificador (slug) es obligatorio.';
    }

    final trimmed = slug.trim();
    if (trimmed.length < 3) {
      return 'El identificador debe tener al menos 3 caracteres.';
    }

    if (trimmed.length > 50) {
      return 'El identificador no puede superar los 50 caracteres.';
    }

    final slugRegex = RegExp(r'^[a-z0-9]+(?:-[a-z0-9]+)*$');
    if (!slugRegex.hasMatch(trimmed)) {
      return 'El identificador solo puede contener letras minúsculas, números y guiones sencillos.';
    }

    return null;
  }
}
