/**
 * Negocio Flex - Appointment State Machine (Fase 11: Dominio Puro)
 * 
 * Máquina de estados determinista para el ciclo de vida de citas y reservas.
 * Controla rigurosamente las transiciones válidas y previene reactivaciones o
 * cancelaciones ilegales desde estados terminales.
 */

import { AppointmentStatus } from '../entities/appointment_entity';
import { ValidationException } from '../../../../core/errors/app_exceptions';

export interface AppointmentTransitionResult {
  readonly valid: boolean;
  readonly reason?: string;
}

export class AppointmentStateMachine {
  /**
   * Transiciones operativas hacia adelante permitidas.
   */
  private static readonly FORWARD_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    PENDING: ['CONFIRMED'],
    CONFIRMED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  /**
   * Estados desde los cuales se puede cancelar la cita.
   */
  private static readonly CANCELLABLE_STATUSES: AppointmentStatus[] = [
    'PENDING',
    'CONFIRMED',
  ];

  /**
   * Determina si el estado es terminal (cerrado definitivamente).
   */
  static isTerminal(status: AppointmentStatus): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED';
  }

  /**
   * Evalúa si una transición es válida.
   */
  static canTransition(
    currentStatus: AppointmentStatus,
    nextStatus: AppointmentStatus
  ): AppointmentTransitionResult {
    // 1. Identidad: no hay transición efectiva
    if (currentStatus === nextStatus) {
      return { valid: true };
    }

    // 2. Estados terminales no admiten ningún cambio posterior
    if (this.isTerminal(currentStatus)) {
      return {
        valid: false,
        reason: `La reserva está en estado terminal '${currentStatus}' y no admite modificaciones operacionales.`,
      };
    }

    // 3. Validación de cancelación
    if (nextStatus === 'CANCELLED') {
      if (this.CANCELLABLE_STATUSES.includes(currentStatus)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `No se puede cancelar una cita en estado '${currentStatus}'.`,
      };
    }

    // 4. Validación de avance hacia adelante
    const allowed = this.FORWARD_TRANSITIONS[currentStatus] || [];
    if (allowed.includes(nextStatus)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Transición de cita inválida: no se permite cambiar de '${currentStatus}' a '${nextStatus}'.`,
    };
  }

  /**
   * Aserta la validez de la transición o lanza ValidationException tipada.
   */
  static assertCanTransition(
    currentStatus: AppointmentStatus,
    nextStatus: AppointmentStatus
  ): void {
    const result = this.canTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new ValidationException(result.reason || `Transición de cita inválida de ${currentStatus} a ${nextStatus}`);
    }
  }

  /**
   * Lista los próximos estados a los que se puede transicionar.
   */
  static getAllowedNextStatuses(currentStatus: AppointmentStatus): AppointmentStatus[] {
    if (this.isTerminal(currentStatus)) {
      return [];
    }

    const next: AppointmentStatus[] = [];
    const forwards = this.FORWARD_TRANSITIONS[currentStatus] || [];
    next.push(...forwards);

    if (this.CANCELLABLE_STATUSES.includes(currentStatus)) {
      next.push('CANCELLED');
    }

    return next;
  }
}
