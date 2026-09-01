import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Layers, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Plus, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  UserCheck,
  Ban,
  Check,
  UserX,
  Phone,
  Mail,
  FileText,
  ToggleLeft,
  ToggleRight,
  Send,
  MessageCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { SubscriptionStatus, UserAccount } from '../types';

export const SuperAdminScreen: React.FC = () => {
  const { 
    organizations, 
    plans, 
    subscriptions, 
    payments, 
    users, 
    webhookLogs, 
    setCurrentOrgId, 
    setActiveView,
    changePlan,
    renewSubscription,
    updateUserAccountStatus,
    openAuthModal,
    requireSuperAdminApproval,
    setRequireSuperAdminApproval,
    pendingApprovalsCount,
    approveUserAccount,
    rejectUserAccount,
    approveAllPendingUsers
  } = useApp();

  const [activeTab, setActiveTab] = useState<'approvals' | 'tenants' | 'users' | 'webhooks' | 'plans'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  // Selected Webhook for Raw Payload Inspector
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null);

  // Quick Plan Change Dialog
  const [planChangeOrgId, setPlanChangeOrgId] = useState<string | null>(null);

  // Rejection Dialog State
  const [rejectingUser, setRejectingUser] = useState<UserAccount | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Información de negocio incompleta o pendiente de verificación.');

  // Account Detail Modal State
  const [inspectingUser, setInspectingUser] = useState<UserAccount | null>(null);

  // SaaS Metric Calculations
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const trialSubs = subscriptions.filter(s => s.status === 'trial');
  const pastDueSubs = subscriptions.filter(s => s.status === 'past_due');

  const mrr = activeSubs.reduce((acc, sub) => {
    const plan = plans.find(p => p.id === sub.plan_id);
    return acc + (plan?.price_monthly || 0);
  }, 0);

  const arr = mrr * 12;

  // Pending users
  const pendingUsers = users.filter(u => u.status === 'PENDING_APPROVAL');

  // Filtered Organizations
  const filteredTenants = organizations.filter(org => {
    const sub = subscriptions.find(s => s.organization_id === org.id || s.business_id === org.id);
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || sub?.plan_id === planFilter;
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'pending' ? org.approval_status === 'PENDING' : sub?.status === statusFilter);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.organization_name && u.organization_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    rejectUserAccount(rejectingUser.id, rejectingUser.organization_id, rejectionReason);
    setRejectingUser(null);
    setRejectionReason('Información de negocio incompleta o pendiente de verificación.');
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      
      {/* Super Admin Top Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="flex items-center gap-3">
            <BrandLogo variant="compact" size="sm" theme="dark" />
            <span className="text-slate-600">•</span>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant Core
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel Maestro Super Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Control de aprobaciones de nuevos registros, monetización, suscripciones activas, webhooks y aprovisionamiento multi-tenant.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={openAuthModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Aprovisionar Negocio</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* POLICY CONTROL BANNER: Super Admin Approval Requirement Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${requireSuperAdminApproval ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Política de Aprobación de Nuevos Registros
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                requireSuperAdminApproval 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {requireSuperAdminApproval ? 'MODO MANUAL ACTIVO' : 'AUTO-ACTIVACIÓN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              {requireSuperAdminApproval 
                ? 'Todos los nuevos usuarios y negocios registrados permanecen en estado "PENDIENTE" hasta que el Super Administrador revise y autorice manualmente su ingreso.'
                : 'Cualquier usuario que se registre obtiene acceso inmediato a su catálogo y prueba gratuita sin requerir autorización previa.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          {pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 animate-pulse"
            >
              <span>{pendingApprovalsCount} Pendientes</span>
            </button>
          )}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={requireSuperAdminApproval}
              onChange={(e) => setRequireSuperAdminApproval(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* SaaS Executive Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>MRR (Recurrente Mensual)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            S/ {mrr.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span>ARR estimado: S/ {arr.toFixed(2)} / año</span>
          </div>
        </div>

        {/* Total Tenants */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Negocios Totales</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {organizations.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {activeSubs.length} con plan activo oficial
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => setActiveTab('approvals')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
            pendingApprovalsCount > 0 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={pendingApprovalsCount > 0 ? 'text-amber-800' : 'text-slate-400'}>
              Por Aprobar
            </span>
            <Clock className={`w-4 h-4 ${pendingApprovalsCount > 0 ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${pendingApprovalsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] font-bold text-amber-700">
            {pendingApprovalsCount > 0 ? 'Requieren tu autorización' : 'Todo al día'}
          </div>
        </div>

        {/* 14-Day Free Trials */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Pruebas 14 Días</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">
            {trialSubs.length}
          </div>
          <div className="text-[11px] text-indigo-700 font-bold">
            En fase de onboarding activo
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'border-amber-500 text-amber-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Solicitudes de Aprobación</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'tenants'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Negocios & Suscripciones ({organizations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios & Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Transacciones & Webhooks ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'plans'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Planes & Monetización ({plans.length})</span>
        </button>
      </div>

      {/* TAB 0: Solicitudes de Aprobación */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> Solicitudes Pendientes de Aprobación
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisa los datos del propietario y activa el negocio para que pueda acceder a su catálogo y recibir pedidos.
                </p>
              </div>

              {pendingUsers.length > 0 && (
                <button
                  type="button"
                  onClick={approveAllPendingUsers}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprobar Todos ({pendingUsers.length})</span>
                </button>
              )}
            </div>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="text-base font-bold text-slate-900">¡Bandeja de Aprobaciones al Día!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No hay nuevas solicitudes de registro pendientes en este momento. Cuando un nuevo negocio se registre, aparecerá aquí para tu revisión y activación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => {
                  const org = organizations.find(o => o.id === user.organization_id);
                  const sub = subscriptions.find(s => s.organization_id === user.organization_id || s.business_id === user.organization_id);
                  const plan = plans.find(p => p.id === user.requested_plan_id || p.id === sub?.plan_id) || plans[0];

                  const cleanPhone = (user.phone || org?.settings?.whatsapp_number || '').replace(/[^0-9]/g, '');

                  return (
                    <div 
                      key={user.id}
                      className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50/50 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        
                        {/* Top info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={user.full_name}
                              className="w-11 h-11 rounded-2xl object-cover border border-amber-200 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{user.full_name}</h4>
                              <div className="text-xs font-semibold text-indigo-700">
                                🏢 {user.organization_name || org?.name || 'Nuevo Negocio'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                /{org?.slug || 'slug'} • {org?.business_type || 'store'}
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                            ⏳ Pendiente
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">{user.phone || org?.settings?.whatsapp_number || 'Sin teléfono'}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Plan Solicitado: <strong className="text-indigo-700">{plan.name} (S/ {plan.price_monthly}/mes)</strong></span>
                          </div>
                        </div>

                        {org?.description && (
                          <p className="text-[11px] text-slate-500 italic bg-white/60 p-2 rounded-lg border border-slate-100">
                            "{org.description}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                        
                        {/* Approve button */}
                        <button
                          type="button"
                          onClick={() => approveUserAccount(user.id, user.organization_id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 active:scale-98 transition-all"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Aprobar y Activar</span>
                        </button>

                        {/* WhatsApp Contact button */}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${user.full_name}, te saludamos de Negocio Flex. Recibimos tu solicitud para registrar tu negocio "${user.organization_name}". ¿Tienes alguna consulta antes de completar la activación?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1"
                            title="Contactar al postulante por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Reject button */}
                        <button
                          type="button"
                          onClick={() => setRejectingUser(user)}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>

                        {/* Inspect detail */}
                        <button
                          type="button"
                          onClick={() => setInspectingUser(user)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Inspeccionar configuración"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 1: Organizations & Subscriptions */}
      {activeTab === 'tenants' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por negocio o slug..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Todos los Planes</option>
                <option value="plan-inicial">Inicial (S/ 29)</option>
                <option value="plan-profesional">Profesional (S/ 49)</option>
                <option value="plan-premium">Premium (S/ 79)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="active">🟢 Activos</option>
                <option value="pending">⏳ Pendiente Aprobación</option>
                <option value="trial">🟡 Prueba 14 Días</option>
                <option value="past_due">🔴 Vencidos</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Negocio / Tenant</th>
                  <th className="pb-3">Plan Actual</th>
                  <th className="pb-3">Estado Aprobación</th>
                  <th className="pb-3">Estado Suscripción</th>
                  <th className="pb-3">Vencimiento / Próx. Cobro</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((org) => {
                  const sub = subscriptions.find(s => s.organization_id === org.id || s.business_id === org.id);
                  const plan = plans.find(p => p.id === sub?.plan_id) || plans[0];
                  const owner = users.find(u => u.organization_id === org.id);

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Org info */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={org.settings?.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                            alt={org.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{org.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              /{org.slug} • {org.business_type}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {plan.name}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          S/ {plan.price_monthly.toFixed(2)}/mes
                        </div>
                      </td>

                      {/* Approval status */}
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          org.approval_status === 'APPROVED' || (!org.approval_status && org.is_active)
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : org.approval_status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {org.approval_status === 'APPROVED' || (!org.approval_status && org.is_active)
                            ? '🟢 Aprobado'
                            : org.approval_status === 'REJECTED'
                            ? '🔴 Rechazado'
                            : '⏳ Pendiente'}
                        </span>
                      </td>

                      {/* Subscription status badge */}
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          sub?.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub?.status === 'trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : sub?.status === 'past_due'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sub?.status === 'active' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {sub?.status === 'trial' && <Clock className="w-3 h-3 text-amber-600" />}
                          {sub?.status === 'past_due' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          <span>{sub?.status || 'trial'}</span>
                        </span>
                      </td>

                      {/* Billing period */}
                      <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                        <div>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'En curso'}</div>
                        <div className="text-[10px] text-slate-400">Ciclo: {sub?.billing_period || 'MONTHLY'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* If pending, quick approve */}
                          {(org.approval_status === 'PENDING' || owner?.status === 'PENDING_APPROVAL') && (
                            <button
                              type="button"
                              onClick={() => owner && approveUserAccount(owner.id, org.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 px-2 shadow-xs"
                              title="Aprobar Negocio"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>
                          )}

                          {/* Quick plan change */}
                          <button
                            type="button"
                            onClick={() => setPlanChangeOrgId(org.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Cambiar Plan"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Switch & Impersonate tenant view */}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentOrgId(org.id);
                              setActiveView('dashboard');
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 px-2.5"
                            title="Entrar al panel de este negocio"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Entrar</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Directorio de Usuarios y Permisos (RBAC)</h3>
              <p className="text-xs text-slate-500">Gestión de roles, activación y estados de acceso de cada cuenta registrada.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING_APPROVAL">⏳ Pendientes de Aprobación</option>
                <option value="ACTIVE">🟢 Activos</option>
                <option value="TRIAL">🟡 En Prueba</option>
                <option value="SUSPENDED">🔴 Suspendidos</option>
                <option value="REJECTED">❌ Rechazados</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Usuario</th>
                  <th className="pb-3">Email & Teléfono</th>
                  <th className="pb-3">Rol del Sistema</th>
                  <th className="pb-3">Organización Asociada</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          {u.rejection_reason && (
                            <div className="text-[10px] text-rose-600 italic">
                              Motivo: {u.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || 'Sin teléfono'}</div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'OWNER'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === 'SUPER_ADMIN' ? '👑 Super Admin' : u.role === 'OWNER' ? '🏢 Dueño / Owner' : '👤 Empleado / Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-medium">
                      {u.organization_name}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : u.status === 'TRIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : u.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                          : u.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.status === 'PENDING_APPROVAL' ? '⏳ PENDIENTE' : u.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveUserAccount(u.id, u.organization_id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingUser(u)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold"
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {u.role !== 'SUPER_ADMIN' && u.status !== 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => updateUserAccountStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-600"
                          >
                            {u.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Webhooks & Gateway Transactions */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Registro de Transacciones & Webhooks de Pasarelas
            </h3>
            <p className="text-xs text-slate-500">
              Validación asíncrona de pagos en tiempo real (Culqi, Mercado Pago, Niubiz, Yape).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">ID Transacción</th>
                    <th className="pb-3">Organización</th>
                    <th className="pb-3">Pasarela</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Webhook Status</th>
                    <th className="pb-3 text-right">Detalle Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {payments.map((p) => {
                    const org = organizations.find(o => o.id === p.organization_id || o.id === p.business_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 text-slate-800 font-bold">{p.id}</td>
                        <td className="py-3 font-sans font-medium text-slate-700">{org?.name || p.organization_id}</td>
                        <td className="py-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase">
                            {p.gateway}
                          </span>
                        </td>
                        <td className="py-3 text-emerald-600 font-bold">
                          {p.currency} {p.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase ${
                            p.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => setSelectedWebhook(p.metadata || p)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Payload</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Plan Configuration */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    S/ {p.price_monthly.toFixed(2)}/mes
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-medium text-slate-700">
                  <div>• Máximo de productos: <strong>{p.max_products >= 9999 ? 'Ilimitados' : p.max_products}</strong></div>
                  <div>• Fotos en galería: <strong>{p.max_images >= 9999 ? 'Ilimitadas' : p.max_images}</strong></div>
                  <div>• Usuarios de equipo: <strong>{p.max_staff >= 9999 ? 'Ilimitados' : p.max_staff}</strong></div>
                  <div>• Dominio propio: <strong>{p.custom_domain_allowed ? 'Habilitado' : 'No'}</strong></div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Módulos:</span>
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Rejection Reason Dialog */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Rechazar Solicitud de Registro</h4>
                <p className="text-xs text-slate-500">{rejectingUser.full_name} • {rejectingUser.organization_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Motivo del Rechazo (Visible en el reporte y notificación):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                placeholder="Indica la razón por la que no se aprueba este negocio..."
              />
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectionReason('Información de negocio incompleta o pendiente de verificación.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Información incompleta
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionReason('Número de WhatsApp o correo electrónico no válido.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Contacto no válido
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionReason('Rubro de negocio no admitido en los términos de servicio.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Rubro no permitido
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspect Full Account Info */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-900">Expediente de Solicitud</h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Usuario:</span>
                  <span className="font-mono text-slate-700">{inspectingUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nombre:</span>
                  <span className="font-bold text-slate-900">{inspectingUser.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-indigo-600">{inspectingUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Teléfono / WhatsApp:</span>
                  <span className="font-bold text-emerald-700">{inspectingUser.phone || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha de Registro:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(inspectingUser.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-2xl space-y-2 border border-indigo-100">
                <div className="flex justify-between">
                  <span className="text-indigo-400">Negocio Tenant:</span>
                  <span className="font-bold text-indigo-950">{inspectingUser.organization_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-400">Plan Solicitado:</span>
                  <span className="font-bold text-indigo-700">{inspectingUser.plan_name || 'Profesional'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  approveUserAccount(inspectingUser.id, inspectingUser.organization_id);
                  setInspectingUser(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Aprobar y Activar Ahora
              </button>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Plan Change Dialog */}
      {planChangeOrgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h4 className="text-lg font-bold text-slate-900">Cambiar Plan para {organizations.find(o => o.id === planChangeOrgId)?.name}</h4>
            <div className="space-y-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    changePlan(planChangeOrgId, p.id, 'MONTHLY');
                    setPlanChangeOrgId(null);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 text-left flex justify-between items-center text-xs font-bold"
                >
                  <span>{p.name}</span>
                  <span className="font-mono text-indigo-600">S/ {p.price_monthly.toFixed(2)}/mes</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlanChangeOrgId(null)}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Webhook Payload Raw JSON Inspector */}
      {selectedWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-emerald-400">Webhook Payload Inspector</span>
              <button
                type="button"
                onClick={() => setSelectedWebhook(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] text-indigo-300">
              {JSON.stringify(selectedWebhook, null, 2)}
            </pre>

            <button
              type="button"
              onClick={() => setSelectedWebhook(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
