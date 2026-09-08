/**
 * Negocio Flex - Appointments Feature Module (Fase 11: Clean Architecture)
 * Barrel export para dominio, datos, casos de uso y presentación del módulo de Citas y Reservas.
 */

// Dominio: Entidades, Repositorios y Casos de Uso
export * from './domain/entities/appointment_entity';
export * from './domain/repositories/appointment_repository';
export * from './domain/usecases/appointment_usecases';
export * from './domain/state_machine/appointment_state_machine';
export * from './domain/permissions/appointment_permissions';

// Datos: Modelos, Datasources y Repositorios
export * from './data/models/appointment_model';
export * from './data/datasources/appointment_datasource';
export * from './data/repositories/appointment_repository_impl';

// Presentación: Componentes y Hooks
export * from './presentation/components/AppointmentStatusBadge';
export * from './presentation/components/AppointmentCard';
export * from './presentation/components/AppointmentFormModal';
export * from './presentation/hooks/useAppointments';
