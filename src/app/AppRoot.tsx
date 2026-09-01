/**
 * Negocio Flex - App Root & Multi-Tenant Navigation Controller (Fase 4)
 * Orquesta AuthProvider, OrganizationProvider, AppContext,
 * y controla el ciclo de vida completo de autenticación, multi-tenant y navegación:
 * Splash -> Login / Register / Forgot Password / Update Password
 * -> Home / Hub Multi-Tenant -> Mis Negocios -> Crear Negocio -> Editar Negocio -> Miembros & Roles -> Workspace.
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../features/auth/presentation/providers/AuthContext';
import { OrganizationProvider, useOrganization } from '../features/organizations/presentation/providers/OrganizationContext';
import { AppProvider, useApp } from '../context/AppContext';
import { SplashPage } from '../features/auth/presentation/pages/SplashPage';
import { LoginPage } from '../features/auth/presentation/pages/LoginPage';
import { RegisterPage } from '../features/auth/presentation/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/presentation/pages/ForgotPasswordPage';
import { UpdatePasswordPage } from '../features/auth/presentation/pages/UpdatePasswordPage';
import { TemporaryHomePage } from '../features/auth/presentation/pages/TemporaryHomePage';
import { ProfilePage } from '../features/auth/presentation/pages/ProfilePage';
import { MyBusinessesPage } from '../features/organizations/presentation/pages/MyBusinessesPage';
import { CreateOrganizationPage } from '../features/organizations/presentation/pages/CreateOrganizationPage';
import { OrganizationEditPage } from '../features/organizations/presentation/pages/OrganizationEditPage';
import { OrganizationMembersPage } from '../features/organizations/presentation/pages/OrganizationMembersPage';

// Modules from presentation layer
import { DashboardScreen } from '../components/DashboardScreen';
import { CustomizerScreen } from '../components/CustomizerScreen';
import { ProductsScreen } from '../components/ProductsScreen';
import { ServicesScreen } from '../components/ServicesScreen';
import { OrdersScreen } from '../components/OrdersScreen';
import { AppointmentsScreen } from '../components/AppointmentsScreen';
import { ClientPortalScreen } from '../components/ClientPortalScreen';
import { SuperAdminScreen } from '../components/SuperAdminScreen';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { supabaseService } from '../core/network/supabase_client';
import { APP_CONFIG } from '../core/config/app_config';
import { M3Badge, M3Button } from '../core/widgets/M3Components';

import {
  LayoutDashboard,
  Palette,
  ShoppingBag,
  Sparkles,
  Calendar,
  Truck,
  ShieldCheck,
  Building2,
  Eye,
  Menu,
  X,
  LogOut,
  Layers,
  Radio,
  User,
  Home,
  Users,
  Settings,
} from 'lucide-react';

type ScreenState =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'update_password'
  | 'temporary_home'
  | 'profile'
  | 'my_businesses'
  | 'create_business'
  | 'edit_business'
  | 'business_members'
  | 'main_app';

function AppNavigation() {
  const { status, user, profile, logout } = useAuth();
  const { currentOrg, organizations, setCurrentOrgId, activeView, setActiveView } = useApp();
  const {
    activeOrganization,
    userRole,
    isOwner,
    isAdmin,
    selectOrganization,
  } = useOrganization();

  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [selectedOrgIdForDetail, setSelectedOrgIdForDetail] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ isConfigured: boolean; message: string }>({
    isConfigured: APP_CONFIG.supabase.isConfigured,
    message: APP_CONFIG.supabase.isConfigured ? 'Supabase Conectado' : 'Modo Standalone Resiliente',
  });

  useEffect(() => {
    supabaseService.checkHealth().then(res => {
      setSupabaseStatus({
        isConfigured: res.isConfigured,
        message: res.message,
      });
    });
  }, []);

  // 1. SPLASH SCREEN
  if (currentScreen === 'splash') {
    return (
      <SplashPage
        onComplete={(isAuthenticated) => {
          if (isAuthenticated) {
            setCurrentScreen('temporary_home');
          } else {
            setCurrentScreen('login');
          }
        }}
      />
    );
  }

  // 2. LOGIN SCREEN
  if (currentScreen === 'login') {
    return (
      <LoginPage
        onNavigateToRegister={() => setCurrentScreen('register')}
        onNavigateToForgotPassword={() => setCurrentScreen('forgot_password')}
        onLoginSuccess={() => setCurrentScreen('temporary_home')}
      />
    );
  }

  // 3. REGISTER SCREEN (SIGN UP)
  if (currentScreen === 'register') {
    return (
      <RegisterPage
        onNavigateToLogin={() => setCurrentScreen('login')}
        onRegisterSuccess={() => setCurrentScreen('temporary_home')}
      />
    );
  }

  // 4. FORGOT PASSWORD SCREEN
  if (currentScreen === 'forgot_password') {
    return (
      <ForgotPasswordPage
        onNavigateToLogin={() => setCurrentScreen('login')}
        onNavigateToUpdatePassword={() => setCurrentScreen('update_password')}
      />
    );
  }

  // 5. UPDATE PASSWORD SCREEN
  if (currentScreen === 'update_password') {
    return (
      <UpdatePasswordPage
        onNavigateToLogin={() => setCurrentScreen('login')}
        onUpdateSuccess={() => setCurrentScreen('temporary_home')}
      />
    );
  }

  // 6. TEMPORARY HOME / HUB CENTRAL (FASE 4)
  if (currentScreen === 'temporary_home') {
    return (
      <TemporaryHomePage
        onNavigateToProfile={() => setCurrentScreen('profile')}
        onNavigateToUpdatePassword={() => setCurrentScreen('update_password')}
        onNavigateToMyBusinesses={() => setCurrentScreen('my_businesses')}
        onNavigateToCreateBusiness={() => setCurrentScreen('create_business')}
        onNavigateToEditBusiness={(orgId) => {
          setSelectedOrgIdForDetail(orgId);
          setCurrentScreen('edit_business');
        }}
        onNavigateToMembers={(orgId) => {
          setSelectedOrgIdForDetail(orgId);
          setCurrentScreen('business_members');
        }}
        onExploreWorkspace={() => setCurrentScreen('main_app')}
      />
    );
  }

  // 7. PROFILE SCREEN
  if (currentScreen === 'profile') {
    return (
      <ProfilePage
        onBackToHome={() => setCurrentScreen('temporary_home')}
        onNavigateToUpdatePassword={() => setCurrentScreen('update_password')}
      />
    );
  }

  // 8. MIS NEGOCIOS (FASE 4)
  if (currentScreen === 'my_businesses') {
    return (
      <MyBusinessesPage
        onNavigateToCreate={() => setCurrentScreen('create_business')}
        onNavigateToEdit={(orgId) => {
          setSelectedOrgIdForDetail(orgId);
          setCurrentScreen('edit_business');
        }}
        onNavigateToMembers={(orgId) => {
          setSelectedOrgIdForDetail(orgId);
          setCurrentScreen('business_members');
        }}
        onSelectAndEnter={async (orgId) => {
          setCurrentOrgId(orgId);
          await selectOrganization(orgId);
          setCurrentScreen('main_app');
        }}
        onBackToHome={() => setCurrentScreen('temporary_home')}
      />
    );
  }

  // 9. CREAR MI NEGOCIO (FASE 4)
  if (currentScreen === 'create_business') {
    return (
      <CreateOrganizationPage
        onBack={() => setCurrentScreen('my_businesses')}
        onSuccess={(orgId) => {
          setCurrentOrgId(orgId);
          setCurrentScreen('main_app');
        }}
      />
    );
  }

  // 10. EDITAR INFORMACIÓN DEL NEGOCIO (FASE 4)
  if (currentScreen === 'edit_business') {
    const orgIdToUse = selectedOrgIdForDetail || activeOrganization?.id || '';
    return (
      <OrganizationEditPage
        organizationId={orgIdToUse}
        onBack={() => setCurrentScreen('my_businesses')}
        onSaved={() => setCurrentScreen('my_businesses')}
      />
    );
  }

  // 11. MIEMBROS Y ROLES DEL NEGOCIO (FASE 4)
  if (currentScreen === 'business_members') {
    const orgIdToUse = selectedOrgIdForDetail || activeOrganization?.id || '';
    return (
      <OrganizationMembersPage
        organizationId={orgIdToUse}
        onBack={() => setCurrentScreen('my_businesses')}
      />
    );
  }

  // 12. CLIENT PORTAL (End customer public view)
  if (activeView === 'client_catalog') {
    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
        <div className="max-w-md mx-auto mb-3 flex items-center justify-between">
          <button
            onClick={() => setActiveView('dashboard')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
          >
            ← Volver al Panel de Administración
          </button>
          <span className="text-[11px] font-semibold text-slate-500">Vista previa de clientes</span>
        </div>
        <ClientPortalScreen />
      </div>
    );
  }

  const settings = currentOrg?.settings;
  const modules = settings?.active_modules;

  // 13. MAIN BUSINESS DASHBOARD & MULTI-TENANT WORKSPACE
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveView('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                NF
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                  NEGOCIO FLEX
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                  v{APP_CONFIG.version}
                </span>
              </div>
            </div>

            {/* Tenant / Organization Switcher */}
            <div className="hidden sm:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Empresa:</span>
              <select
                value={currentOrg?.id}
                onChange={async e => {
                  const newId = e.target.value;
                  setCurrentOrgId(newId);
                  await selectOrganization(newId);
                }}
                className="pl-2.5 pr-7 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-300 text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.business_type})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setCurrentScreen('my_businesses')}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                title="Mis Negocios"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Area: Status Badge, Client App & User */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Home button */}
            <button
              onClick={() => setCurrentScreen('temporary_home')}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Hub Central"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Backend / Supabase Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Radio className={`w-3 h-3 ${supabaseStatus.isConfigured ? 'text-emerald-500 animate-pulse' : 'text-indigo-500'}`} />
              <span>{supabaseStatus.isConfigured ? 'Supabase Conectado' : 'Modo Standalone Resiliente'}</span>
            </div>

            {/* Client Portal Link */}
            <button
              onClick={() => setActiveView('client_catalog')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver App Clientes</span>
            </button>

            {/* Super Admin Switcher */}
            <button
              onClick={() => setActiveView(activeView === 'super_admin' ? 'dashboard' : 'super_admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeView === 'super_admin'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Super Admin</span>
            </button>

            {/* User Avatar, Profile link & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={() => setCurrentScreen('profile')}
                className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer overflow-hidden"
                title="Mi Perfil"
              >
                {profile?.avatarUrl || user?.avatarUrl ? (
                  <img
                    src={profile?.avatarUrl || user?.avatarUrl}
                    alt={profile?.fullName || user?.fullName || 'U'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{(profile?.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}</span>
                )}
              </button>

              <button
                onClick={async () => {
                  await logout();
                  setCurrentScreen('login');
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar */}
        <aside className={`lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 ${
          isMobileMenuOpen ? 'block' : 'hidden lg:block'
        }`}>
          
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Administración</span>
            <span className="text-[10px] font-mono text-indigo-600">
              {userRole?.toUpperCase() || 'STAFF'}
            </span>
          </div>

          <button
            onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Métricas</span>
          </button>

          <button
            onClick={() => { setActiveView('customizer'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'customizer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Personalizar Marca & App</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100">
            Módulos Operativos
          </div>

          {modules?.products && (
            <button
              onClick={() => { setActiveView('products'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'products' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Catálogo de Productos</span>
            </button>
          )}

          {modules?.services && (
            <button
              onClick={() => { setActiveView('services'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'services' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Servicios & Tarifas</span>
            </button>
          )}

          {modules?.orders && (
            <button
              onClick={() => { setActiveView('orders'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'orders' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Pedidos & Despacho</span>
            </button>
          )}

          {modules?.appointments && (
            <button
              onClick={() => { setActiveView('appointments'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'appointments' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Reservas & Agenda</span>
            </button>
          )}

          <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100">
            Multi-Tenant & Negocios
          </div>

          <button
            onClick={() => setCurrentScreen('my_businesses')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Mis Negocios & Sedes</span>
          </button>

          {(isOwner || isAdmin) && (
            <>
              <button
                onClick={() => {
                  setSelectedOrgIdForDetail(currentOrg?.id || '');
                  setCurrentScreen('edit_business');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Información del Negocio</span>
              </button>

              <button
                onClick={() => {
                  setSelectedOrgIdForDetail(currentOrg?.id || '');
                  setCurrentScreen('business_members');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Miembros & Permisos</span>
              </button>
            </>
          )}

          <button
            onClick={() => { setActiveView('super_admin'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'super_admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Global Super Admin</span>
          </button>

          <button
            onClick={() => setCurrentScreen('create_business')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors mt-2 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>+ Crear Nuevo Negocio</span>
          </button>

        </aside>

        {/* Main Content Pane */}
        <main className="lg:col-span-9">
          {activeView === 'dashboard' && <DashboardScreen />}
          {activeView === 'customizer' && <CustomizerScreen />}
          {activeView === 'products' && <ProductsScreen />}
          {activeView === 'services' && <ServicesScreen />}
          {activeView === 'orders' && <OrdersScreen />}
          {activeView === 'appointments' && <AppointmentsScreen />}
          {activeView === 'client_portal' && <ClientPortalScreen />}
          {activeView === 'super_admin' && <SuperAdminScreen />}
        </main>

      </div>

    </div>
  );
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <AppProvider>
          <AppNavigation />
        </AppProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
