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

import { BackofficeShell } from '../features/backoffice';
import { PublicBusinessPage } from '../components/PublicBusinessPage';
import { APP_CONFIG } from '../core/config/app_config';
import { supabaseService } from '../core/network/supabase_client';
import { detectPublicSlugFromUrl, setUrlSlugWithoutReload } from '../core/utils/public_url_helper';

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
  const { status, user, profile, logout, isPasswordRecovery } = useAuth();
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
  const [publicSlug, setPublicSlug] = useState<string | null>(() => detectPublicSlugFromUrl());
  const [supabaseStatus, setSupabaseStatus] = useState<{ isConfigured: boolean; message: string }>({
    isConfigured: APP_CONFIG.supabase.isConfigured,
    message: APP_CONFIG.supabase.isConfigured ? 'Supabase Conectado' : 'Modo Standalone Resiliente',
  });

  // Escuchar cambios de URL en el navegador (Back / Forward / PushState)
  useEffect(() => {
    const handlePopState = () => {
      setPublicSlug(detectPublicSlugFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    supabaseService.checkHealth().then(res => {
      setSupabaseStatus({
        isConfigured: res.isConfigured,
        message: res.message,
      });
    });
  }, []);

  // Sincronización reactiva con el estado de autenticación de Supabase
  useEffect(() => {
    // Si la URL apunta a un catálogo público (/r/:slug), no forzar login
    if (publicSlug) {
      return;
    }

    if (isPasswordRecovery) {
      setCurrentScreen('update_password');
      return;
    }

    if (currentScreen === 'splash') {
      return;
    }

    const isPublicScreen =
      currentScreen === 'login' ||
      currentScreen === 'register' ||
      currentScreen === 'forgot_password' ||
      currentScreen === 'update_password';

    if (status === 'unauthenticated' && !isPublicScreen) {
      setCurrentScreen('login');
    }
  }, [status, isPasswordRecovery, currentScreen, publicSlug]);

  // 0. VISTA PÚBLICA DEL NEGOCIO POR SLUG (FASE 7)
  // Se evalúa antes que cualquier redirección a autenticación o splash.
  // Permite acceso 100% anónimo a clientes finales.
  if (publicSlug) {
    return (
      <PublicBusinessPage
        businessSlug={publicSlug}
        onBackToAdmin={status === 'authenticated' ? () => {
          setPublicSlug(null);
          setUrlSlugWithoutReload(null);
          setCurrentScreen('temporary_home');
        } : undefined}
        onLoginClick={status === 'unauthenticated' ? () => {
          setPublicSlug(null);
          setUrlSlugWithoutReload(null);
          setCurrentScreen('login');
        } : undefined}
      />
    );
  }

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

  // 12. VISTA PÚBLICA DEL NEGOCIO / CATÁLOGO (FASE 7)
  if (activeView === 'client_catalog' || activeView === 'client_portal' || activeView === 'public_page') {
    return (
      <PublicBusinessPage
        businessSlug={currentOrg?.slug}
        onBackToAdmin={() => setActiveView('dashboard')}
      />
    );
  }

  // 13. MAIN BUSINESS DASHBOARD & MULTI-TENANT BACKOFFICE SHELL (FASE 9)
  return (
    <BackofficeShell
      onNavigateScreen={(screen: string) => {
        if (screen === 'profile' || screen === 'my_businesses' || screen === 'create_business') {
          setCurrentScreen(screen as any);
        } else if (screen === 'edit_business') {
          setSelectedOrgIdForDetail(activeOrganization?.id || currentOrg?.id || '');
          setCurrentScreen('edit_business');
        } else if (screen === 'business_members') {
          setSelectedOrgIdForDetail(activeOrganization?.id || currentOrg?.id || '');
          setCurrentScreen('business_members');
        }
      }}
    />
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
