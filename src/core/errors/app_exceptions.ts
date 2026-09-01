/**
 * Negocio Flex - Manejo Centralizado de Excepciones y Errores
 * Garantiza que nunca se muestren stacktraces técnicos al usuario final
 * y proporciona mensajes amigables y localizados.
 */

export abstract class BaseAppException extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly technicalDetails?: string;

  constructor(code: string, userMessage: string, technicalDetails?: string) {
    super(userMessage);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = userMessage;
    this.technicalDetails = technicalDetails;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AppException extends BaseAppException {
  constructor(message: string = 'Ha ocurrido un problema inesperado. Por favor, inténtalo nuevamente.', details?: string) {
    super('APP_GENERAL_ERROR', message, details);
  }
}

export class AuthException extends BaseAppException {
  constructor(message: string = 'No fue posible verificar tus credenciales. Comprueba tu correo y contraseña.', details?: string) {
    super('AUTH_ERROR', message, details);
  }
}

export class UnauthorizedException extends BaseAppException {
  constructor(message: string = 'Debes iniciar sesión para realizar esta acción.', details?: string) {
    super('UNAUTHORIZED_ERROR', message, details);
  }
}

export class ForbiddenException extends BaseAppException {
  constructor(message: string = 'No tienes permisos suficientes para realizar esta operación.', details?: string) {
    super('FORBIDDEN_ERROR', message, details);
  }
}

export class NetworkException extends BaseAppException {
  constructor(message: string = 'No hay conexión con el servidor. Revisa tu conexión a internet.', details?: string) {
    super('NETWORK_ERROR', message, details);
  }
}

export class ServerException extends BaseAppException {
  constructor(message: string = 'El servicio no está disponible temporalmente. Intenta más tarde.', details?: string) {
    super('SERVER_ERROR', message, details);
  }
}

export class ValidationException extends BaseAppException {
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string = 'Los datos ingresados no son válidos. Por favor, verifica los campos.',
    fieldErrorsOrField?: Record<string, string> | string
  ) {
    const errorMap =
      typeof fieldErrorsOrField === 'string'
        ? { [fieldErrorsOrField]: message }
        : fieldErrorsOrField;
    super('VALIDATION_ERROR', message, JSON.stringify(errorMap));
    this.fieldErrors = errorMap;
  }
}

export class NotFoundException extends BaseAppException {
  constructor(resource: string = 'El elemento solicitado no fue encontrado.') {
    super('NOT_FOUND_ERROR', resource);
  }
}

/**
 * Convierte cualquier error desconocido en una instancia de BaseAppException amigable.
 */
export function normalizeError(error: unknown): BaseAppException {
  if (error instanceof BaseAppException) {
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return new NetworkException('Problema de conexión con la base de datos.', error.message);
    }
    if (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('jwt') || error.message.toLowerCase().includes('unauthorized')) {
      return new AuthException('Sesión no autorizada o credenciales incorrectas.', error.message);
    }
    return new AppException('Ha ocurrido un problema en la operación.', error.message);
  }
  return new AppException('Ha ocurrido un problema desconocido.');
}
