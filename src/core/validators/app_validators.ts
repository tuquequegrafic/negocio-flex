/**
 * Negocio Flex - Centralized Form & Field Validators
 * Validadores reutilizables para garantizar consistencia y mensajes amigables al usuario.
 */

export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  static validate(email: string): string | null {
    if (!email || email.trim() === '') {
      return 'El correo electrónico es obligatorio.';
    }
    if (!this.EMAIL_REGEX.test(email.trim())) {
      return 'El correo electrónico no es válido.';
    }
    return null;
  }
}

export class PasswordValidator {
  static validate(password: string, minLength: number = 6): string | null {
    if (!password || password === '') {
      return 'La contraseña es obligatoria.';
    }
    if (password.length < minLength) {
      return `La contraseña debe tener al menos ${minLength} caracteres.`;
    }
    return null;
  }

  static validateMatch(password: string, confirmPassword: string): string | null {
    if (!confirmPassword || confirmPassword === '') {
      return 'Debes confirmar la contraseña.';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }
}

export class RequiredValidator {
  static validate(value: string | undefined | null, fieldName: string = 'Este campo'): string | null {
    if (!value || value.trim() === '') {
      return `${fieldName} es obligatorio.`;
    }
    return null;
  }
}

export class PhoneValidator {
  private static readonly PHONE_REGEX = /^[+]?[\d\s-]{7,15}$/;

  static validate(phone: string | undefined | null): string | null {
    if (!phone || phone.trim() === '') {
      return null; // Phone is optional in profile
    }
    if (!this.PHONE_REGEX.test(phone.trim())) {
      return 'Ingresa un número telefónico válido (ej. +51 987 654 321).';
    }
    return null;
  }
}

export class AvatarValidator {
  static readonly MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
  static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  static validateFile(file: File): string | null {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return 'Formato no soportado. Usa imágenes JPG, PNG o WebP.';
    }
    if (file.size > this.MAX_SIZE_BYTES) {
      return 'La imagen es demasiado pesada. El tamaño máximo es 3 MB.';
    }
    return null;
  }
}
