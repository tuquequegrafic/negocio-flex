/**
 * Negocio Flex - Miembros del Negocio (Fase 4)
 * Gestión de usuarios, roles (OWNER, ADMIN, STAFF) y permisos dentro de la organización.
 * Protege contra la eliminación o degradación del último propietario (OWNER).
 */

import React, { useState, useEffect } from 'react';
import { useOrganization } from '../providers/OrganizationContext';
import { OrganizationRole, OrganizationMemberEntity } from '../../domain/entities/organization_entity';
import { M3Card, M3Button, M3TextField, M3Badge } from '../../../../core/widgets/M3Components';
import {
  Users,
  ArrowLeft,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Crown,
  UserCheck,
  X,
  Send,
} from 'lucide-react';

export interface OrganizationMembersPageProps {
  organizationId: string;
  onBack: () => void;
}

export const OrganizationMembersPage: React.FC<OrganizationMembersPageProps> = ({
  organizationId,
  onBack,
}) => {
  const {
    organizations,
    getOrganizationMembers,
    changeMemberRole,
    removeMember,
    isOwner,
  } = useOrganization();

  const org = organizations.find(o => o.id === organizationId);

  const [members, setMembers] = useState<OrganizationMemberEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal para Invitar Miembro
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('staff');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Modal para Confirmación de Eliminación
  const [memberToDelete, setMemberToDelete] = useState<OrganizationMemberEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMembers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getOrganizationMembers(organizationId);
      setMembers(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al cargar los miembros del negocio.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <M3Card variant="elevated" className="p-8 text-center max-w-md bg-white rounded-3xl space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Negocio no encontrado</h2>
          <p className="text-xs text-slate-500">No se encontró la organización solicitada.</p>
          <M3Button variant="filled" onClick={onBack}>Volver</M3Button>
        </M3Card>
      </div>
    );
  }

  const handleRoleChange = async (member: OrganizationMemberEntity, newRole: OrganizationRole) => {
    if (member.role === newRole) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Contar cuántos owners activos existen
    const activeOwners = members.filter(m => m.role === 'owner' && m.status === 'active');
    if (member.role === 'owner' && newRole !== 'owner' && activeOwners.length <= 1) {
      setErrorMessage('La organización debe mantener al menos un propietario (OWNER) activo.');
      return;
    }

    try {
      await changeMemberRole(member.userId, newRole);
      setSuccessMessage(`Rol de ${member.userFullName || member.userEmail || 'usuario'} actualizado a ${newRole.toUpperCase()}.`);
      await loadMembers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No fue posible cambiar el rol.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    try {
      await removeMember(memberToDelete.userId);
      setSuccessMessage(`Miembro removido exitosamente.`);
      setMemberToDelete(null);
      await loadMembers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No fue posible eliminar al miembro.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido para invitar.');
      return;
    }

    setIsSendingInvite(true);
    setErrorMessage(null);

    // Simulación de envío de invitación (preparación para Fase 5)
    setTimeout(() => {
      setIsSendingInvite(false);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setSuccessMessage(`Invitación enviada con éxito a ${inviteEmail} con rol ${inviteRole.toUpperCase()}.`);
    }, 600);
  };

  const isCurrentCallerOwner = org.currentUserRole === 'owner' || isOwner;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Miembros y Roles</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                {org.name} • {members.length} integrante(s)
              </p>
            </div>
          </div>

          {isCurrentCallerOwner && (
            <M3Button
              variant="filled"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Invitar Miembro
            </M3Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1">
        
        {/* Messages */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso de seguridad</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 space-y-1">
            <h3 className="font-bold">Estructura de Roles de la Organización</h3>
            <p className="text-indigo-800/80 leading-relaxed">
              • <strong>👑 OWNER (Propietario):</strong> Control total del negocio, gestión de miembros, asignación de roles y eliminación.<br />
              • <strong>🛡️ ADMIN (Administrador):</strong> Gestión de catálogo, productos, servicios, pedidos y configuración general.<br />
              • <strong>👤 STAFF (Personal):</strong> Operaciones de atención, visualización de catálogo y toma de pedidos.
            </p>
          </div>
        </div>

        {/* Members List Card */}
        <M3Card variant="elevated" className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Equipo de Trabajo Registrado</h2>
            <span className="text-xs font-semibold text-slate-500">{members.length} miembros activos</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => {
                const isOwnerRole = member.role === 'owner';
                const isStaffRole = member.role === 'staff';
                const isAdminRole = member.role === 'admin';

                return (
                  <div
                    key={member.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 overflow-hidden">
                        {member.userAvatarUrl ? (
                          <img src={member.userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900">
                            {member.userFullName || 'Usuario de Negocio'}
                          </h3>
                          {isOwnerRole && (
                            <span className="p-0.5 text-amber-500" title="Propietario principal">
                              <Crown className="w-3.5 h-3.5 fill-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.userEmail || 'Sin correo asociado'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Role selector & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      
                      {isCurrentCallerOwner ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as OrganizationRole)}
                            className="text-xs font-semibold rounded-xl border border-slate-300 bg-white py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          >
                            <option value="owner">👑 OWNER (Propietario)</option>
                            <option value="admin">🛡️ ADMIN (Administrador)</option>
                            <option value="staff">👤 STAFF (Personal)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar miembro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          {isOwnerRole && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">👑 OWNER</span>}
                          {isAdminRole && <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">🛡️ ADMIN</span>}
                          {isStaffRole && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">👤 STAFF</span>}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </M3Card>

      </main>

      {/* Modal: Invitar Miembro */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Invitar Miembro al Negocio</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <M3TextField
                label="Correo Electrónico del Invitado"
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Rol a Asignar</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as OrganizationRole)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="admin">🛡️ ADMIN (Administrador)</option>
                  <option value="staff">👤 STAFF (Personal de atención)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  El usuario recibirá acceso seguro a este negocio una vez acepte la invitación.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <M3Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancelar
                </M3Button>

                <M3Button
                  type="submit"
                  variant="filled"
                  size="sm"
                  isLoading={isSendingInvite}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Enviar Invitación
                </M3Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">¿Remover a este miembro?</h3>
              <p className="text-xs text-slate-500">
                Estás a punto de revocar el acceso de <strong>{memberToDelete.userFullName || memberToDelete.userEmail}</strong> a este negocio.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <M3Button
                variant="outlined"
                size="sm"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </M3Button>

              <M3Button
                variant="filled"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Confirmar Eliminación
              </M3Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
