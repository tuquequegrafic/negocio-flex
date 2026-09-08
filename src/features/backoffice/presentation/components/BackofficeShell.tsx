/**
 * Negocio Flex - BackofficeShell Component (Fase 9)
 * Shell Administrativo Unificado / Backoffice Central.
 * Punto único de orquestación para navegación, RBAC, multi-tenant switcher,
 * área de contenido modular, notificaciones en vivo y modales SaaS.
 */

import React, { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { useBackofficeNavigation } from '../hooks/useBackofficeNavigation';
import { BackofficeTopBar } from './BackofficeTopBar';
import { BackofficeSidebar } from './BackofficeSidebar';
import { BackofficeContentArea } from './BackofficeContentArea';

// Modales Globales del SaaS
import { PlanUpgradeModal } from '../../../../components/PlanUpgradeModal';
import { CheckoutPaymentModal } from '../../../../components/CheckoutPaymentModal';
import { AuthModal } from '../../../../components/AuthModal';
import { LegalModal } from '../../../../components/LegalModal';
import { TutorialModal } from '../../../../components/TutorialModal';
import { InstallAppModal } from '../../../../components/InstallAppModal';
import { OnboardingWizard } from '../../../../components/OnboardingWizard';

import { Bell, ShieldCheck, X } from 'lucide-react';
import { formatCurrency } from '../../../../core/utils/formatters';

export interface BackofficeShellProps {
  readonly onNavigateScreen?: (screen: string) => void;
}

export const BackofficeShell: React.FC<BackofficeShellProps> = ({
  onNavigateScreen,
}) => {
  const {
    currentOrg,
    latestNewOrderNotification,
    clearOrderNotification,
    setActiveView,
    activeView,
    currentUser,
    approveUserAccount,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const currency = currentOrg?.settings?.currency || 'S/';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Barra Superior Unificada */}
      <BackofficeTopBar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onNavigateScreen={onNavigateScreen}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* 2. Cuerpo Principal: Sidebar + Contenido */}
      <div className="flex-1 flex flex-row min-h-[calc(100vh-4rem)]">
        {/* Barra Lateral Centralizada */}
        <BackofficeSidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenLegal={() => setIsLegalOpen(true)}
          onOpenInstall={() => setIsInstallAppOpen(true)}
        />

        {/* Contenedor Principal Dinámico */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Banner de Aviso de Aprobación Pendiente (si aplica) */}
          {(currentOrg?.approval_status === 'PENDING' ||
            (!currentOrg?.is_active && currentOrg?.approval_status !== 'APPROVED')) &&
            activeView !== 'super_admin' && (
              <div className="m-4 mb-0 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      Cuenta en Proceso de Aprobación por Super Administrador
                    </h4>
                    <p className="text-xs text-amber-900/80">
                      Tu negocio <strong>{currentOrg?.name}</strong> está en espera de autorización oficial para operar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => approveUserAccount(currentUser?.id || '', currentOrg?.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
                  >
                    ⚡ Aprobar Ahora (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('super_admin')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-semibold text-xs transition-colors"
                  >
                    Ir a Super Admin
                  </button>
                </div>
              </div>
            )}

          {/* Área de Pantallas con Guard */}
          <BackofficeContentArea onNavigateScreen={onNavigateScreen} />
        </div>
      </div>

      {/* 3. Notificación Flotante en Vivo de Nuevo Pedido */}
      {latestNewOrderNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">¡Nuevo Pedido Recibido!</span>
              <button
                type="button"
                onClick={clearOrderNotification}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-bold text-slate-100 text-sm mt-0.5">
              {latestNewOrderNotification.customer_name}
            </p>

            <p className="text-slate-300 text-[11px]">
              {latestNewOrderNotification.items.length}{' '}
              {latestNewOrderNotification.items.length === 1 ? 'producto' : 'productos'} • Total:{' '}
              <strong className="text-white">
                {formatCurrency(latestNewOrderNotification.total, currency)}
              </strong>
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  clearOrderNotification();
                  setActiveView('orders');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Ver en Pedidos
              </button>
              <button
                type="button"
                onClick={clearOrderNotification}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modales Globales del SaaS */}
      <PlanUpgradeModal />
      <CheckoutPaymentModal />
      <AuthModal />
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab="terms"
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialRole="ADMIN"
      />
      <InstallAppModal
        isOpen={isInstallAppOpen}
        onClose={() => setIsInstallAppOpen(false)}
        businessName={currentOrg?.name || 'Negocio Flex'}
        businessSlug={currentOrg?.slug}
        targetRole="ADMIN"
      />

      {/* 5. Asistente Onboarding para Nuevos Negocios */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(false)}
              className="absolute -top-10 right-0 text-white text-xs font-bold hover:opacity-80"
            >
              Cerrar ✕
            </button>
            <OnboardingWizard onComplete={() => setIsOnboardingOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
