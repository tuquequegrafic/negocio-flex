/**
 * Negocio Flex - Auth & Profile Use Cases (Domain Layer)
 * Implementa la lógica de negocio pura y validaciones de casos de uso.
 */

import {
  IAuthRepository,
  LoginParams,
  RegisterParams,
  ResetPasswordParams,
  UpdatePasswordParams,
} from '../repositories/auth_repository';
import { UserEntity, AuthSessionEntity } from '../entities/user_entity';
import { ProfileEntity, UpdateProfileParams } from '../entities/profile_entity';
import {
  EmailValidator,
  PasswordValidator,
  RequiredValidator,
  PhoneValidator,
  AvatarValidator,
} from '../../../../core/validators/app_validators';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export class SignInUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(params: LoginParams): Promise<AuthSessionEntity> {
    const errors: Record<string, string> = {};
    const emailErr = EmailValidator.validate(params.email);
    if (emailErr) errors.email = emailErr;

    const passErr = PasswordValidator.validate(params.password || '', 4);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('El correo o la contraseña son incorrectos o inválidos.', errors);
    }

    return this.authRepository.signIn(params);
  }
}

// Export alias for compatibility
export const LoginUseCase = SignInUseCase;

export class SignUpUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(params: RegisterParams): Promise<AuthSessionEntity> {
    const errors: Record<string, string> = {};
    const nameErr = RequiredValidator.validate(params.fullName, 'El nombre completo');
    if (nameErr) errors.fullName = nameErr;

    const emailErr = EmailValidator.validate(params.email);
    if (emailErr) errors.email = emailErr;

    const passErr = PasswordValidator.validate(params.password || '', 6);
    if (passErr) errors.password = passErr;

    if (params.phone) {
      const phoneErr = PhoneValidator.validate(params.phone);
      if (phoneErr) errors.phone = phoneErr;
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('No fue posible crear la cuenta con los datos proporcionados.', errors);
    }

    return this.authRepository.signUp(params);
  }
}

// Export alias for compatibility
export const RegisterUseCase = SignUpUseCase;

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}

// Export alias for compatibility
export const LogoutUseCase = SignOutUseCase;

export class GetCurrentSessionUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<AuthSessionEntity | null> {
    return this.authRepository.getCurrentSession();
  }
}

export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<UserEntity | null> {
    return this.authRepository.getCurrentUser();
  }
}

export class SendPasswordResetUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(params: ResetPasswordParams): Promise<void> {
    const emailErr = EmailValidator.validate(params.email);
    if (emailErr) {
      throw new ValidationException(emailErr, { email: emailErr });
    }
    return this.authRepository.sendPasswordResetEmail(params);
  }
}

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(params: UpdatePasswordParams): Promise<void> {
    const passErr = PasswordValidator.validate(params.newPassword, 6);
    if (passErr) {
      throw new ValidationException(passErr, { newPassword: passErr });
    }
    return this.authRepository.updatePassword(params);
  }
}

export class GetProfileUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(userId: string): Promise<ProfileEntity | null> {
    if (!userId) throw new ValidationException('ID de usuario no especificado');
    return this.authRepository.getProfile(userId);
  }
}

export class UpdateProfileUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(userId: string, updates: UpdateProfileParams): Promise<ProfileEntity> {
    if (!userId) throw new ValidationException('ID de usuario requerido para actualizar el perfil');

    const errors: Record<string, string> = {};
    if (updates.fullName !== undefined) {
      const nameErr = RequiredValidator.validate(updates.fullName, 'El nombre');
      if (nameErr) errors.fullName = nameErr;
    }
    if (updates.phone !== undefined && updates.phone !== '') {
      const phoneErr = PhoneValidator.validate(updates.phone);
      if (phoneErr) errors.phone = phoneErr;
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('No fue posible actualizar tu perfil. Corrige los campos marcados.', errors);
    }

    return this.authRepository.updateProfile(userId, updates);
  }
}

export class UploadAvatarUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(userId: string, file: File): Promise<string> {
    if (!userId) throw new ValidationException('ID de usuario requerido');
    const fileErr = AvatarValidator.validateFile(file);
    if (fileErr) {
      throw new ValidationException(fileErr);
    }
    return this.authRepository.uploadAvatar(userId, file);
  }
}
