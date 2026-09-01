import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { DashboardScreen } from './components/DashboardScreen';
import { CustomizerScreen } from './components/CustomizerScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { ServicesScreen } from './components/ServicesScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { AppointmentsScreen } from './components/AppointmentsScreen';
import { PublicBusinessPage } from './components/PublicBusinessPage';
import { SuperAdminScreen } from './components/SuperAdminScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { PricingScreen } from './components/PricingScreen';
import { PlanUpgradeModal } from './components/PlanUpgradeModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { AuthModal } from './components/AuthModal';
import { LandingScreen } from './components/LandingScreen';
import { TestCenterScreen } from './components/TestCenterScreen';
import { LegalModal } from './components/LegalModal';
import { TutorialModal } from './components/TutorialModal';
import { InstallAppModal } from './components/InstallAppModal';
import { BrandLogo } from './components/BrandLogo';
import { formatCurrency } from './core/utils/formatters';
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
  PlusCircle, 
  ChevronDown,
  Menu,
  X,
  User,
  Globe,
  Layers,
  Users,
  Image as ImageIcon,
  Settings,
  Bell,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Zap,
  Tag,
  BookOpen,
  Smartphone,
  Download
} from 'lucide-react';

export default function App() {
  const { 
    currentOrg, 
    organizations, 
    setCurrentOrgId, 
    activeView, 
    setActiveView,
    currentRole,
    setCurrentRole,
    currentUser,
    orders,
    customers,
    products,
    latestNewOrderNotification,
    clearOrderNotification,
    getCurrentSubscription,
    getCurrentPlan,
    openUpgradeModal,
    openAuthModal,
    pendingApprovalsCount,
    approveUserAccount
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'terms' | 'privacy' | 'cookies' | 'refunds'>('terms');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialRole, setTutorialRole] = useState<'ADMIN' | 'CUSTOMER'>('ADMIN');
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);

  const currentSub = getCurrentSubscription();
  const currentPlan = getCurrentPlan();

  const orgOrders = orders.filter(o => o.organization_id === currentOrg?.id);
  const pendingOrdersCount = orgOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const orgCustomersCount = customers.filter(c => c.organization_id === currentOrg?.id).length;
  const orgProductsCount = products.filter(p => p.organization_id === currentOrg?.id).length;

  const settings = currentOrg?.settings;
  const modules = settings?.active_modules;
  const currency = settings?.currency || 'S/';

  // 1. Landing Page SaaS Comercial (Phase 11.20 & 12.17)
  if (activeView === 'landing') {
    return (
      <>
        <LandingScreen 
          onStartOnboarding={() => {
            setIsOnboardingOpen(true);
            setActiveView('dashboard');
          }}
          onGoToDashboard={() => setActiveView('dashboard')}
          onOpenPricing={() => setActiveView('pricing')}
          onOpenLegal={(tab) => {
            setLegalInitialTab(tab);
            setIsLegalOpen(true);
          }}
          onOpenTestCenter={() => setActiveView('test_center')}
          onOpenTutorial={(role) => {
            setTutorialRole(role || 'ADMIN');
            setIsTutorialOpen(true);
          }}
          onOpenInstallApp={() => setIsInstallAppOpen(true)}
        />
        <LegalModal
          isOpen={isLegalOpen}
          onClose={() => setIsLegalOpen(false)}
          initialTab={legalInitialTab}
        />
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          initialRole={tutorialRole}
        />
        <InstallAppModal
          isOpen={isInstallAppOpen}
          onClose={() => setIsInstallAppOpen(false)}
          businessName={currentOrg?.name || 'Negocio Flex'}
          businessSlug={currentOrg?.slug}
          targetRole="ADMIN"
        />
      </>
    );
  }

  // 2. If in public client view, render the modern dynamic PublicBusinessPage (Phase 7 & 8)
  if (activeView === 'client_catalog' || activeView === 'public_page') {
    return (
      <PublicBusinessPage 
        businessSlug={currentOrg?.slug} 
        onBackToAdmin={() => setActiveView('dashboard')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo / Brand & Tenant Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              className="flex items-center cursor-pointer select-none" 
              onClick={() => setActiveView('dashboard')}
              title="Ir al Panel Principal - Negocio Flex"
            >
              <BrandLogo variant="horizontal" size="sm" />
            </div>

            {/* Tenant Selector Dropdown */}
            <div className="flex items-center gap-2 ml-1 sm:ml-4 pl-2 sm:pl-4 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium hidden md:inline">Negocio:</span>
              <div className="relative">
                <select
                  value={currentOrg?.id}
                  onChange={e => setCurrentOrgId(e.target.value)}
                  className="max-w-[150px] sm:max-w-[200px] pl-3 pr-8 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-300 text-slate-800 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 truncate"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={openAuthModal}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Registrar nuevo negocio / Tenant"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Tools & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Landing Page SaaS Button */}
            <button
              onClick={() => setActiveView('landing')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              title="Página de inicio comercial para vender la plataforma"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Landing SaaS</span>
            </button>

            {/* Install App on Phone Button */}
            <button
              onClick={() => setIsInstallAppOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
              title="Instalar o descargar la aplicación en tu celular"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar App</span>
            </button>

            {/* Tutorial & Manual Button */}
            <button
              onClick={() => { setTutorialRole('ADMIN'); setIsTutorialOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 transition-colors shadow-2xs"
              title="Manual de uso para administradores y clientes"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Manual de Uso</span>
            </button>

            {/* QA Test Center Button */}
            <button
              onClick={() => setActiveView('test_center')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeView === 'test_center'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
              title="Suite de 20 pruebas de QA, Seguridad RLS y Lanzamiento"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span className="hidden sm:inline">Suite QA (Fase 12)</span>
            </button>

            {/* View Client App Button */}
            <button
              onClick={() => setActiveView('client_catalog')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver mi página</span>
            </button>

            {/* Pricing Screen Shortcut */}
            <button
              onClick={() => setActiveView('pricing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeView === 'pricing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Precios & Planes</span>
            </button>

            {/* SuperAdmin View Toggle */}
            <button
              onClick={() => setActiveView(activeView === 'super_admin' ? 'dashboard' : 'super_admin')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeView === 'super_admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Super Admin</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">{currentUser.full_name}</span>
                <span className="text-[10px] text-slate-400 block">Dueño / Admin</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main App Layout with Sidebar and Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar Navigation (Phase 9 & 10 Structure) */}
        <aside className={`lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 ${
          isMobileMenuOpen ? 'block' : 'hidden lg:block'
        }`}>
          
          {/* Business Profile Card inside Sidebar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={currentOrg?.name} 
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {currentOrg?.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="truncate flex-1">
              <span className="font-bold text-slate-900 text-xs truncate block">{currentOrg?.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                  currentSub?.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : currentSub?.status === 'trial'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentPlan?.name || 'Plan Inicial'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation Menu */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Panel del Negocio
            </div>

            {/* 🏠 Dashboard */}
            <button
              onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'dashboard' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 📦 Productos */}
            <button
              onClick={() => { setActiveView('products'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'products' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Productos</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeView === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {orgProductsCount}
              </span>
            </button>

            {/* 📂 Categorías */}
            <button
              onClick={() => { setActiveView('categories'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'categories' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Categorías</span>
              </div>
            </button>

            {/* 📋 Pedidos */}
            <button
              onClick={() => { setActiveView('orders'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'orders' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4" />
                <span>Pedidos</span>
              </div>
              {pendingOrdersCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-white animate-pulse">
                  {pendingOrdersCount} pend.
                </span>
              ) : (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeView === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {orgOrders.length}
                </span>
              )}
            </button>

            {/* 👥 Clientes */}
            <button
              onClick={() => { setActiveView('customers'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'customers' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeView === 'customers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {orgCustomersCount}
              </span>
            </button>

            {/* 📸 Galería */}
            <button
              onClick={() => { setActiveView('gallery'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'gallery' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4" />
                <span>Galería</span>
              </div>
            </button>

            {/* ⚙️ Configuración / Personalización */}
            <button
              onClick={() => { setActiveView('customizer'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'customizer' || activeView === 'settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </div>
            </button>

            <div className="pt-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suscripción & SaaS
            </div>

            {/* 💳 Mi Plan y Suscripción (Phase 10) */}
            <button
              onClick={() => { setActiveView('subscription'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'subscription' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Mi Plan y Facturación</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                currentSub?.status === 'trial' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentSub?.status === 'trial' ? 'Prueba' : 'Activo'}
              </span>
            </button>

            {/* 💰 Planes y Precios Públicos */}
            <button
              onClick={() => { setActiveView('pricing'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'pricing' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Ver Planes y Precios</span>
              </div>
            </button>

            {/* 🧪 Suite QA & Auditoría de Lanzamiento (Fase 12) */}
            <button
              onClick={() => { setActiveView('test_center'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeView === 'test_center' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>Auditoría & Suite QA (20)</span>
              </div>
              <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">
                Fase 12
              </span>
            </button>

            {/* 🚀 Landing Comercial SaaS */}
            <button
              onClick={() => { setActiveView('landing'); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Landing Page SaaS</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            {/* 📲 Descargar App Móvil */}
            <button
              onClick={() => { setIsInstallAppOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Descargar App Móvil</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded-md">
                PWA
              </span>
            </button>

            {/* 📖 Manual & Tutoriales */}
            <button
              onClick={() => { setTutorialRole('ADMIN'); setIsTutorialOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Manual y Tutoriales</span>
              </div>
              <span className="text-[10px] font-black bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded-md">
                Guía
              </span>
            </button>

            {/* 📜 Centro Legal */}
            <button
              onClick={() => { setIsLegalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Términos & Privacidad</span>
              </div>
            </button>

            {/* Servicios & Citas (Optional Modules if active) */}
            {modules?.services && (
              <button
                onClick={() => { setActiveView('services'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeView === 'services' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Servicios</span>
                </div>
              </button>
            )}

            {modules?.appointments && (
              <button
                onClick={() => { setActiveView('appointments'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeView === 'appointments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>Reservas & Agenda</span>
                </div>
              </button>
            )}
          </div>

          {/* SaaS Plan Upgrade Mini-Banner in Sidebar Footer */}
          <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-indigo-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> {currentPlan?.name}
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                {orgProductsCount}/{currentPlan?.max_products >= 9999 ? '∞' : currentPlan?.max_products} prods
              </span>
            </div>
            
            <p className="text-[10px] text-slate-300 leading-tight">
              {currentSub?.status === 'trial' 
                ? 'Estás en tu prueba de 14 días. Activa tu plan para desbloquear todo.'
                : '¿Necesitas más productos o dominio personalizado?'}
            </p>

            <button
              type="button"
              onClick={() => openUpgradeModal()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors"
            >
              Mejorar Plan Ahora
            </button>
          </div>

          {/* Bottom Action: Direct Link to Public Store */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setActiveView('client_catalog')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all shadow-2xs"
            >
              <Globe className="w-4 h-4" />
              <span>Ver mi página web</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </div>

        </aside>

        {/* Right Main Content Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {/* Pending Approval Notice Banner for Current Org */}
          {(currentOrg?.approval_status === 'PENDING' || (!currentOrg?.is_active && currentOrg?.approval_status !== 'APPROVED')) && activeView !== 'super_admin' && (
            <div className="bg-amber-500/10 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      Cuenta en Proceso de Aprobación por Super Administrador
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
                      MODO REVISIÓN
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80">
                    Tu negocio <strong>{currentOrg?.name}</strong> está en espera de autorización oficial para comenzar a operar y procesar ventas.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => approveUserAccount(currentUser.id, currentOrg?.id)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all"
                  title="Simular aprobación inmediata (demo)"
                >
                  ⚡ Aprobar Ahora (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('super_admin')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs transition-all"
                >
                  Ir a Super Admin
                </button>
              </div>
            </div>
          )}

          {activeView === 'dashboard' && <DashboardScreen />}
          {activeView === 'products' && <ProductsScreen />}
          {activeView === 'categories' && <CategoriesScreen />}
          {activeView === 'orders' && <OrdersScreen />}
          {activeView === 'customers' && <CustomersScreen />}
          {activeView === 'gallery' && <GalleryScreen />}
          {(activeView === 'customizer' || activeView === 'settings') && <CustomizerScreen />}
          {activeView === 'subscription' && <SubscriptionScreen />}
          {activeView === 'pricing' && <PricingScreen />}
          {activeView === 'test_center' && <TestCenterScreen />}
          {activeView === 'services' && <ServicesScreen />}
          {activeView === 'appointments' && <AppointmentsScreen />}
          {activeView === 'super_admin' && <SuperAdminScreen />}
        </main>

      </div>

      {/* Real-time New Order Floating Notification Toast */}
      {latestNewOrderNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 animate-slide-up flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400">¡Nuevo Pedido Recibido!</span>
              <button 
                onClick={clearOrderNotification}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="font-bold text-slate-100 text-sm mt-0.5">
              {latestNewOrderNotification.customer_name}
            </p>
            
            <p className="text-slate-300 text-[11px]">
              {latestNewOrderNotification.items.length} {latestNewOrderNotification.items.length === 1 ? 'producto' : 'productos'} • Total: <strong className="text-white">{formatCurrency(latestNewOrderNotification.total, currency)}</strong>
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => {
                  clearOrderNotification();
                  setActiveView('orders');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] transition-colors"
              >
                Ver en Pedidos
              </button>
              <button
                onClick={clearOrderNotification}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global SaaS Modals */}
      <PlanUpgradeModal />
      <CheckoutPaymentModal />
      <AuthModal />
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalInitialTab}
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialRole={tutorialRole}
      />
      <InstallAppModal
        isOpen={isInstallAppOpen}
        onClose={() => setIsInstallAppOpen(false)}
        businessName={currentOrg?.name || 'Negocio Flex'}
        businessSlug={currentOrg?.slug}
        targetRole="ADMIN"
      />

      {/* Modal Onboarding New Business */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
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
}
