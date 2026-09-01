/**
 * Negocio Flex - Slug Normalizer & Validator
 * Garantiza slugs normalizados, únicos y válidos para URL.
 */

export class SlugValidator {
  /**
   * Normaliza un texto en un slug URL-safe:
   * "Restaurante El Sabor!" -> "restaurante-el-sabor"
   */
  static normalize(text: string): string {
    if (!text) return '';
    let slug = text.toLowerCase().trim();

    // Reemplazo de tildes y caracteres especiales comunes en español
    slug = slug
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c');

    // Reemplaza todo caracter que no sea alfanumérico por un guión
    slug = slug.replace(/[^a-z0-9]+/g, '-');

    // Elimina guiones consecutivos y guiones al inicio o final
    slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    return slug || 'negocio';
  }

  /**
   * Valida si un slug cumple con el formato estándar:
   * Min 3 caracteres, max 50, solo minúsculas, números y guiones.
   */
  static validate(slug?: string): string | null {
    if (!slug || slug.trim().length === 0) {
      return 'El identificador (slug) es obligatorio.';
    }

    const trimmed = slug.trim();
    if (trimmed.length < 3) {
      return 'El identificador debe tener al menos 3 caracteres.';
    }

    if (trimmed.length > 50) {
      return 'El identificador no puede superar los 50 caracteres.';
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmed)) {
      return 'El identificador solo puede contener letras minúsculas, números y guiones sencillos (sin espacios).';
    }

    return null;
  }
}
