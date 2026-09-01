// Centralized Validators for Flutter / Dart
class AppValidators {
  static final RegExp _emailRegExp = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  static final RegExp _phoneRegExp = RegExp(
    r'^[+]?[\d\s-]{7,15}$',
  );

  static String? validateEmail(String? email) {
    if (email == null || email.trim().isEmpty) {
      return 'El correo electrónico es obligatorio.';
    }
    if (!_emailRegExp.hasMatch(email.trim())) {
      return 'El correo electrónico no es válido.';
    }
    return null;
  }

  static String? validatePassword(String? password, {int minLength = 6}) {
    if (password == null || password.isEmpty) {
      return 'La contraseña es obligatoria.';
    }
    if (password.length < minLength) {
      return 'La contraseña debe tener al menos $minLength caracteres.';
    }
    return null;
  }

  static String? validatePasswordMatch(String? password, String? confirmPassword) {
    if (confirmPassword == null || confirmPassword.isEmpty) {
      return 'Debes confirmar la contraseña.';
    }
    if (password != confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  static String? validateRequired(String? value, [String fieldName = 'Este campo']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName es obligatorio.';
    }
    return null;
  }

  static String? validatePhone(String? phone) {
    if (phone == null || phone.trim().isEmpty) {
      return null; // Opcional
    }
    if (!_phoneRegExp.hasMatch(phone.trim())) {
      return 'Ingresa un número telefónico válido.';
    }
    return null;
  }
}
