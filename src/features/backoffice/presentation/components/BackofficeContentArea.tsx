/**
 * Negocio Flex - BackofficeContentArea Component (Fase 9)
 * Área de contenido dinámico del Backoffice.
 * Enruta las pantallas administrativas y las protege mediante RoleViewGuard.
 */

import React from 'react';
import { useBackofficeNavigation } from '../hooks/useBackofficeNavigation';
import { RoleViewGuard } from '../guards/RoleViewGuard';

// Pantallas del Sistema
import { DashboardScreen } from '../../../../components/DashboardScreen';
import { OrdersScreen } from '../../../../components/OrdersScreen';
import { AppointmentsScreen } from '../../../../components/AppointmentsScreen';
import { ProductsScreen } from '../../../../components/ProductsScreen';
import { CategoriesScreen } from '../../../../components/CategoriesScreen';
import { ServicesScreen } from '../../../../components/ServicesScreen';
import { CustomersScreen } from '../../../../components/CustomersScreen';
import { CustomizerScreen } from '../../../../components/CustomizerScreen';
import { SubscriptionScreen } from '../../../../components/SubscriptionScreen';
import { PricingScreen } from '../../../../components/PricingScreen';
import { LandingScreen } from '../../../../components/LandingScreen';
import { GalleryScreen } from '../../../../components/GalleryScreen';
import { TestCenterScreen } from '../../../../components/TestCenterScreen';
import { SuperAdminScreen } from '../../../../components/SuperAdminScreen';
import { PublicBusinessPage } from '../../../../components/PublicBusinessPage';

// Pantallas de Configuración Multi-Tenant (Fase 4)
import { OrganizationEditPage } from '../../../organizations/presentation/pages/OrganizationEditPage';
import { OrganizationMembersPage } from '../../../organizations/presentation/pages/OrganizationMembersPage';

// Pantalla POS (Fase 13)
import { PosTerminalScreen } from '../../../pos';

export interface BackofficeContentAreaProps {
  readonly onNavigateScreen?: (screen: string) => void;
}

export const BackofficeContentArea: React.FC<BackofficeContentAreaProps> = ({
  onNavigateScreen,
}) => {
  const { activeView, setActiveView, activeOrganizationId } = useBackofficeNavigation();

  const renderViewContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardScreen />;

      case 'pos':
        return <PosTerminalScreen />;

      case 'orders':
        return <OrdersScreen />;

      case 'appointments':
        return <AppointmentsScreen />;

      case 'products':
        return <ProductsScreen />;

      case 'categories':
        return <CategoriesScreen />;

      case 'services':
        return <ServicesScreen />;

      case 'customers':
        return <CustomersScreen />;

      case 'customizer':
      case 'settings':
        return <CustomizerScreen />;

      case 'business_info':
        return (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <OrganizationEditPage
              organizationId={activeOrganizationId || ''}
              onBack={() => setActiveView('dashboard')}
              onSaved={() => setActiveView('dashboard')}
            />
          </div>
        );

      case 'business_members':
        return (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <OrganizationMembersPage
              organizationId={activeOrganizationId || ''}
              onBack={() => setActiveView('dashboard')}
            />
          </div>
        );

      case 'subscription':
        return <SubscriptionScreen />;

      case 'pricing':
        return <PricingScreen />;

      case 'landing':
        return <LandingScreen />;

      case 'gallery':
        return <GalleryScreen />;

      case 'test_center':
        return <TestCenterScreen />;

      case 'super_admin':
        return <SuperAdminScreen />;

      case 'client_catalog':
      case 'client_portal':
      case 'public_page':
        return <PublicBusinessPage onBackToAdmin={() => setActiveView('dashboard')} />;

      default:
        return <DashboardScreen />;
    }
  };

  return (
    <main className="flex-1 min-w-0 bg-slate-100 overflow-y-auto">
      <RoleViewGuard
        viewId={activeView}
        onSwitchOrgRequest={() => onNavigateScreen?.('my_businesses')}
      >
        {renderViewContent()}
      </RoleViewGuard>
    </main>
  );
};
