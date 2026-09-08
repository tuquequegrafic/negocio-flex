/**
 * Negocio Flex - RoleViewGuard Component (Fase 9)
 * Guard de presentación para vistas del Backoffice.
 * Impide renderizar interfaces para las cuales el usuario o tenant no cuenta con autorización.
 */

import React from 'react';
import { useBackofficeNavigation } from '../hooks/useBackofficeNavigation';
import { AccessDeniedView } from '../components/AccessDeniedView';

export interface RoleViewGuardProps {
  readonly viewId: string;
  readonly children: React.ReactNode;
  readonly onSwitchOrgRequest?: () => void;
}

export const RoleViewGuard: React.FC<RoleViewGuardProps> = ({
  viewId,
  children,
  onSwitchOrgRequest,
}) => {
  const { checkViewAccess, setActiveView } = useBackofficeNavigation();

  const checkResult = checkViewAccess(viewId);

  if (!checkResult.allowed) {
    return (
      <AccessDeniedView
        checkResult={checkResult}
        onGoDashboard={() => setActiveView('dashboard')}
        onGoPricing={() => setActiveView('pricing')}
        onSwitchOrg={onSwitchOrgRequest}
      />
    );
  }

  return <>{children}</>;
};
