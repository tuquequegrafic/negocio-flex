/**
 * Negocio Flex - Unified Backoffice Entry (Fase 9)
 * Shell administrativo centralizado con soporte multi-tenant, RBAC Zero Trust,
 * y orquestación modular de todas las fases del negocio.
 * Resuelve la fragmentación histórica entre main.tsx, AppRoot.tsx y App.tsx.
 */

import React from 'react';
import { BackofficeShell } from './features/backoffice';
import { AuthProvider } from './features/auth/presentation/providers/AuthContext';
import { OrganizationProvider } from './features/organizations/presentation/providers/OrganizationContext';
import { AppProvider } from './context/AppContext';

export interface AppProps {
  readonly onNavigateScreen?: (screen: string) => void;
}

export const App: React.FC<AppProps> = ({ onNavigateScreen }) => {
  return <BackofficeShell onNavigateScreen={onNavigateScreen} />;
};

export default function StandaloneApp() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <AppProvider>
          <BackofficeShell />
        </AppProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
