import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Organization, 
  UserProfile, 
  Product, 
  ServiceItem, 
  Category, 
  Order, 
  Appointment, 
  Promotion,
  SubscriptionPlan,
  Subscription,
  PaymentTransaction,
  UserAccount,
  WebhookLog,
  OrganizationSettings,
  BusinessHour,
  GalleryItem,
  Customer
} from '../types';
import { 
  INITIAL_ORGANIZATIONS, 
  INITIAL_PLANS, 
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PAYMENTS,
  INITIAL_USERS,
  INITIAL_WEBHOOK_LOGS,
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SERVICES, 
  INITIAL_ORDERS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PROMOTIONS,
  INITIAL_BUSINESS_HOURS,
  INITIAL_GALLERY_ITEMS,
  INITIAL_CUSTOMERS
} from '../core/data/initialData';
import {
  checkProductLimit,
  checkGalleryLimit,
  checkStaffLimit,
  calculateTrialDaysRemaining,
  LimitCheckResult
} from '../core/utils/subscriptionLimits';

interface AppContextType {
  // Current active user & view role
  currentUser: UserProfile;
  currentRole: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
  setCurrentRole: (role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER') => void;
  
  // Multi-tenant selection
  currentOrg: Organization;
  organizations: Organization[];
  setCurrentOrgId: (orgId: string) => void;
  
  // Navigation / views
  activeView: string;
  setActiveView: (view: string) => void;
  
  // State Collections
  categories: Category[];
  products: Product[];
  services: ServiceItem[];
  orders: Order[];
  appointments: Appointment[];
  promotions: Promotion[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: PaymentTransaction[];
  users: UserAccount[];
  webhookLogs: WebhookLog[];
  businessHours: BusinessHour[];
  galleryItems: GalleryItem[];
  customers: Customer[];
  
  // Subscription & SaaS helpers
  getCurrentSubscription: (orgId?: string) => Subscription | undefined;
  getCurrentPlan: (orgId?: string) => SubscriptionPlan | undefined;
  changePlan: (orgId: string, planId: string, billingPeriod?: 'MONTHLY' | 'ANNUAL') => void;
  startFreeTrial: (orgId: string, planId?: string) => void;
  cancelSubscription: (orgId: string) => void;
  renewSubscription: (orgId: string) => void;
  updateCustomDomain: (orgId: string, domain: string) => void;
  processPayment: (data: {
    orgId: string;
    planId: string;
    amount: number;
    gateway: 'Culqi' | 'Mercado Pago' | 'Niubiz' | 'Izipay' | 'Yape / Plin';
    paymentMethodType?: 'CARD' | 'QR' | 'TRANSFER';
    billingPeriod?: 'MONTHLY' | 'ANNUAL';
    cardLast4?: string;
    cardBrand?: string;
  }) => Promise<PaymentTransaction>;
  
  // Limit Checkers
  canAddProduct: (orgId?: string) => LimitCheckResult;
  canAddGalleryImage: (orgId?: string) => LimitCheckResult;
  canAddStaff: (orgId?: string) => LimitCheckResult;

  // Upgrade Modal & Checkout Modals
  upgradeModalOpen: boolean;
  upgradeModalReason: string;
  openUpgradeModal: (reason?: string) => void;
  closeUpgradeModal: () => void;
  checkoutModalOpen: boolean;
  selectedPlanForCheckout: SubscriptionPlan | null;
  selectedBillingPeriod: 'MONTHLY' | 'ANNUAL';
  openCheckoutModal: (plan: SubscriptionPlan, billingPeriod?: 'MONTHLY' | 'ANNUAL') => void;
  closeCheckoutModal: () => void;

  // Auth / Registration Modal & Super Admin Approval
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  requireSuperAdminApproval: boolean;
  setRequireSuperAdminApproval: (required: boolean) => void;
  pendingApprovalsCount: number;
  approveUserAccount: (userId: string, orgId?: string) => void;
  rejectUserAccount: (userId: string, orgId?: string, reason?: string) => void;
  approveAllPendingUsers: () => void;
  registerNewTenantAccount: (data: {
    fullName: string;
    email: string;
    businessName: string;
    businessType: string;
    whatsapp: string;
    selectedPlanId: string;
    startWithTrial: boolean;
  }) => Organization;
  updateUserAccountStatus: (userId: string, status: UserAccount['status']) => void;

  // Organization settings
  updateOrganizationSettings: (settings: Partial<OrganizationSettings>) => void;
  updateBusinessInfo: (info: { name?: string; description?: string; business_type?: any }) => void;
  updateBusinessHours: (hours: BusinessHour[]) => void;
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'created_at'>) => void;
  removeGalleryItem: (id: string) => void;
  reorderGalleryItems: (items: GalleryItem[]) => void;
  createOrganization: (orgData: Partial<Organization> & { initialModules?: Record<string, boolean> }) => Organization;
  
  // Categories actions
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;

  // Product Actions
  addProduct: (prod: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  toggleProductFeatured: (id: string) => void;
  reorderProducts: (products: Product[]) => void;

  // Service Actions
  addService: (serv: Omit<ServiceItem, 'id' | 'created_at'>) => void;
  updateService: (id: string, serv: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  toggleServiceFeatured: (id: string) => void;
  reorderServices: (services: ServiceItem[]) => void;

  // Customer Actions
  addCustomer: (cust: Omit<Customer, 'id' | 'created_at'>) => void;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Real-time Sound & Notifications
  latestNewOrderNotification: Order | null;
  clearOrderNotification: () => void;
  playOrderAlertSound: () => void;

  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  createOrder: (order: Omit<Order, 'id' | 'order_number' | 'created_at'>) => Order;
  createAppointment: (apt: Omit<Appointment, 'id' | 'created_at'>) => Appointment;
  updateAppointmentStatus: (aptId: string, status: Appointment['status']) => void;
  
  // Cart for Customer View
  cart: Array<{ product: Product; quantity: number }>;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const defaultUser: UserProfile = {
  id: 'usr-admin-01',
  email: 'enriquebauza1@gmail.com',
  full_name: 'Enrique Bauza',
  phone: '+51 987 654 321',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  is_super_admin: true,
  created_at: new Date().toISOString()
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser] = useState<UserProfile>(defaultUser);
  const [currentRole, setCurrentRole] = useState<'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER'>('OWNER');
  
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('negocioflex_orgs');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [currentOrgId, setCurrentOrgIdState] = useState<string>(() => {
    return organizations[0]?.id || 'org-restaurante-01';
  });

  const [activeView, setActiveView] = useState<string>('dashboard');

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('negocioflex_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('negocioflex_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('negocioflex_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('negocioflex_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('negocioflex_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(() => {
    const saved = localStorage.getItem('negocioflex_hours');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_HOURS;
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('negocioflex_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY_ITEMS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('negocioflex_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // SaaS Subscriptions & Monetization
  const [plans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('negocioflex_subscriptions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('negocioflex_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('negocioflex_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(() => {
    const saved = localStorage.getItem('negocioflex_webhook_logs');
    return saved ? JSON.parse(saved) : INITIAL_WEBHOOK_LOGS;
  });

  // Modals for Upgrade, Checkout, and Auth
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState('');
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Super Admin Approval Policy for New Registrations
  const [requireSuperAdminApproval, setRequireSuperAdminApprovalState] = useState<boolean>(() => {
    const saved = localStorage.getItem('negocioflex_require_approval');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const setRequireSuperAdminApproval = (required: boolean) => {
    setRequireSuperAdminApprovalState(required);
    localStorage.setItem('negocioflex_require_approval', JSON.stringify(required));
  };

  const pendingApprovalsCount = users.filter(u => u.status === 'PENDING_APPROVAL').length;

  const [latestNewOrderNotification, setLatestNewOrderNotification] = useState<Order | null>(null);
  const [promotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);

  // Audio alert function using Web Audio API (cross-browser chime sound)
  const playOrderAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio alert not allowed by browser autoplay policy until user interacts', e);
    }
  };

  const clearOrderNotification = () => {
    setLatestNewOrderNotification(null);
  };

  // Persistence to local state
  useEffect(() => {
    localStorage.setItem('negocioflex_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('negocioflex_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('negocioflex_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('negocioflex_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('negocioflex_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('negocioflex_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('negocioflex_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('negocioflex_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('negocioflex_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('negocioflex_webhook_logs', JSON.stringify(webhookLogs));
  }, [webhookLogs]);

  useEffect(() => {
    localStorage.setItem('negocioflex_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('negocioflex_hours', JSON.stringify(businessHours));
  }, [businessHours]);

  useEffect(() => {
    localStorage.setItem('negocioflex_gallery', JSON.stringify(galleryItems));
  }, [galleryItems]);

  const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations[0];

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id);
  };

  // Subscription helpers
  const getCurrentSubscription = (orgId?: string) => {
    const targetId = orgId || currentOrg?.id;
    return subscriptions.find(s => s.organization_id === targetId || s.business_id === targetId);
  };

  const getCurrentPlan = (orgId?: string) => {
    const sub = getCurrentSubscription(orgId);
    if (!sub) return plans[0];
    return plans.find(p => p.id === sub.plan_id) || plans[0];
  };

  const canAddProduct = (orgId?: string): LimitCheckResult => {
    const targetId = orgId || currentOrg?.id;
    const plan = getCurrentPlan(targetId);
    const sub = getCurrentSubscription(targetId);
    const count = products.filter(p => p.organization_id === targetId).length;
    return checkProductLimit(count, plan, sub);
  };

  const canAddGalleryImage = (orgId?: string): LimitCheckResult => {
    const targetId = orgId || currentOrg?.id;
    const plan = getCurrentPlan(targetId);
    const count = galleryItems.filter(g => g.organization_id === targetId).length;
    return checkGalleryLimit(count, plan);
  };

  const canAddStaff = (orgId?: string): LimitCheckResult => {
    const targetId = orgId || currentOrg?.id;
    const plan = getCurrentPlan(targetId);
    const count = users.filter(u => u.organization_id === targetId).length;
    return checkStaffLimit(count, plan);
  };

  const openUpgradeModal = (reason?: string) => {
    setUpgradeModalReason(reason || '');
    setUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setUpgradeModalOpen(false);
  };

  const openCheckoutModal = (plan: SubscriptionPlan, billingPeriod: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') => {
    setSelectedPlanForCheckout(plan);
    setSelectedBillingPeriod(billingPeriod);
    setCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setSelectedPlanForCheckout(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const changePlan = (orgId: string, planId: string, billingPeriod: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') => {
    const targetPlan = plans.find(p => p.id === planId) || plans[0];
    const amount = billingPeriod === 'ANNUAL' ? (targetPlan.price_annual || targetPlan.price_monthly * 10) : targetPlan.price_monthly;
    
    setSubscriptions(prev => {
      const existing = prev.find(s => s.organization_id === orgId || s.business_id === orgId);
      const now = new Date();
      const end = new Date(now.getTime() + (billingPeriod === 'ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000);
      
      if (existing) {
        return prev.map(s => s.id === existing.id ? {
          ...s,
          plan_id: targetPlan.id,
          plan_name: targetPlan.name,
          status: 'active',
          billing_period: billingPeriod,
          amount_paid: amount,
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          next_billing_date: end.toISOString(),
          updated_at: now.toISOString()
        } : s);
      } else {
        const newSub: Subscription = {
          id: `sub-${Date.now()}`,
          business_id: orgId,
          organization_id: orgId,
          plan_id: targetPlan.id,
          plan_name: targetPlan.name,
          status: 'active',
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          next_billing_date: end.toISOString(),
          auto_renew: true,
          billing_period: billingPeriod,
          amount_paid: amount,
          payment_method: 'Tarjeta / Pasarela',
          created_at: now.toISOString()
        };
        return [...prev, newSub];
      }
    });
  };

  const startFreeTrial = (orgId: string, planId: string = 'plan-inicial') => {
    const targetPlan = plans.find(p => p.id === planId) || plans[0];
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    setSubscriptions(prev => {
      const filtered = prev.filter(s => s.organization_id !== orgId && s.business_id !== orgId);
      const newSub: Subscription = {
        id: `sub-trial-${Date.now()}`,
        business_id: orgId,
        organization_id: orgId,
        plan_id: targetPlan.id,
        plan_name: targetPlan.name,
        status: 'trial',
        start_date: now.toISOString(),
        end_date: trialEnd.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        next_billing_date: trialEnd.toISOString(),
        auto_renew: false,
        billing_period: 'MONTHLY',
        amount_paid: 0.00,
        payment_method: 'Prueba Gratuita 14 Días',
        created_at: now.toISOString()
      };
      return [...filtered, newSub];
    });
  };

  const cancelSubscription = (orgId: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.organization_id === orgId || s.business_id === orgId) {
        return {
          ...s,
          auto_renew: false,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  const renewSubscription = (orgId: string) => {
    const sub = getCurrentSubscription(orgId);
    if (!sub) return;
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    setSubscriptions(prev => prev.map(s => {
      if (s.id === sub.id) {
        return {
          ...s,
          status: 'active',
          auto_renew: true,
          end_date: end.toISOString(),
          current_period_end: end.toISOString(),
          next_billing_date: end.toISOString(),
          last_payment_date: now.toISOString(),
          updated_at: now.toISOString()
        };
      }
      return s;
    }));
  };

  const updateCustomDomain = (orgId: string, domain: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.organization_id === orgId || s.business_id === orgId) {
        return {
          ...s,
          custom_domain: domain.trim().toLowerCase(),
          updated_at: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  const processPayment = async (data: {
    orgId: string;
    planId: string;
    amount: number;
    gateway: 'Culqi' | 'Mercado Pago' | 'Niubiz' | 'Izipay' | 'Yape / Plin';
    paymentMethodType?: 'CARD' | 'QR' | 'TRANSFER';
    billingPeriod?: 'MONTHLY' | 'ANNUAL';
    cardLast4?: string;
    cardBrand?: string;
  }): Promise<PaymentTransaction> => {
    const targetOrg = organizations.find(o => o.id === data.orgId) || currentOrg;
    const targetPlan = plans.find(p => p.id === data.planId) || plans[0];
    const txnId = `txn_${data.gateway.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now()}`;
    const now = new Date().toISOString();

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      organization_id: targetOrg.id,
      organization_name: targetOrg.name,
      plan_id: targetPlan.id,
      plan_name: `${targetPlan.name} (${data.billingPeriod === 'ANNUAL' ? 'Anual' : 'Mensual'})`,
      amount: data.amount,
      currency: 'S/',
      payment_gateway: data.gateway,
      payment_method_type: data.paymentMethodType || 'CARD',
      transaction_id: txnId,
      status: 'APPROVED',
      customer_name: currentUser.full_name,
      customer_email: currentUser.email,
      card_last4: data.cardLast4 || '4242',
      card_brand: data.cardBrand || 'Visa',
      webhook_verified: true,
      created_at: now,
      receipt_url: `https://recibos.negocioflex.pe/${txnId}`
    };

    // 1. Record payment transaction
    setPayments(prev => [newPayment, ...prev]);

    // 2. Dispatch simulated Webhook Event
    const webhookEntry: WebhookLog = {
      id: `wh-${Date.now()}`,
      gateway: `${data.gateway} Webhook Engine`,
      event_type: 'subscription.payment_succeeded',
      payload: {
        event: 'charge.successful',
        transaction_id: txnId,
        business_id: targetOrg.id,
        amount: data.amount,
        plan_id: targetPlan.id,
        status: 'PAID'
      },
      status: 'PROCESSED',
      created_at: now
    };
    setWebhookLogs(prev => [webhookEntry, ...prev]);

    // 3. Update subscription status to 'active'
    changePlan(targetOrg.id, targetPlan.id, data.billingPeriod || 'MONTHLY');

    return newPayment;
  };

  const registerNewTenantAccount = (data: {
    fullName: string;
    email: string;
    businessName: string;
    businessType: string;
    whatsapp: string;
    selectedPlanId: string;
    startWithTrial: boolean;
  }): Organization => {
    const isPendingApproval = requireSuperAdminApproval;

    // 1. Create Organization
    const newOrg = createOrganization({
      name: data.businessName,
      business_type: data.businessType as any,
      description: `Negocio de ${data.businessName} en Negocio Flex.`,
      is_active: !isPendingApproval,
      approval_status: isPendingApproval ? 'PENDING' : 'APPROVED'
    });

    // Update settings with whatsapp
    if (data.whatsapp) {
      updateOrganizationSettings({
        whatsapp_number: data.whatsapp.replace(/\D/g, ''),
        phone: data.whatsapp
      });
    }

    // 2. Create User Account
    const newUserId = `usr-${Date.now()}`;
    const targetPlan = plans.find(p => p.id === data.selectedPlanId) || plans[0];
    const newUser: UserAccount = {
      id: newUserId,
      full_name: data.fullName,
      email: data.email,
      phone: data.whatsapp,
      role: 'OWNER',
      organization_id: newOrg.id,
      organization_name: newOrg.name,
      plan_name: targetPlan.name,
      requested_plan_id: targetPlan.id,
      status: isPendingApproval ? 'PENDING_APPROVAL' : (data.startWithTrial ? 'TRIAL' : 'ACTIVE'),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName)}`,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    setUsers(prev => [newUser, ...prev]);

    // 3. Set Subscription (either 14-day trial or active)
    if (data.startWithTrial) {
      startFreeTrial(newOrg.id, targetPlan.id);
    } else {
      changePlan(newOrg.id, targetPlan.id, 'MONTHLY');
    }

    return newOrg;
  };

  const approveUserAccount = (userId: string, orgId?: string) => {
    setUsers(prevUsers => {
      const user = prevUsers.find(u => u.id === userId);
      const targetOrgId = orgId || user?.organization_id;

      if (targetOrgId) {
        setOrganizations(prevOrgs => prevOrgs.map(org => {
          if (org.id === targetOrgId) {
            return {
              ...org,
              is_active: true,
              approval_status: 'APPROVED',
              rejection_reason: undefined
            };
          }
          return org;
        }));

        setSubscriptions(prevSubs => prevSubs.map(sub => {
          if (sub.organization_id === targetOrgId || sub.business_id === targetOrgId) {
            return {
              ...sub,
              status: 'active'
            };
          }
          return sub;
        }));
      }

      return prevUsers.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            status: 'ACTIVE',
            rejection_reason: undefined
          };
        }
        return u;
      });
    });
  };

  const rejectUserAccount = (userId: string, orgId?: string, reason?: string) => {
    setUsers(prevUsers => {
      const user = prevUsers.find(u => u.id === userId);
      const targetOrgId = orgId || user?.organization_id;

      if (targetOrgId) {
        setOrganizations(prevOrgs => prevOrgs.map(org => {
          if (org.id === targetOrgId) {
            return {
              ...org,
              is_active: false,
              approval_status: 'REJECTED',
              rejection_reason: reason || 'Solicitud rechazada por el Super Administrador.'
            };
          }
          return org;
        }));
      }

      return prevUsers.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            status: 'REJECTED',
            rejection_reason: reason || 'Solicitud no cumple con los requisitos.'
          };
        }
        return u;
      });
    });
  };

  const approveAllPendingUsers = () => {
    const pendingList = users.filter(u => u.status === 'PENDING_APPROVAL');
    pendingList.forEach(u => {
      approveUserAccount(u.id, u.organization_id);
    });
  };

  const updateUserAccountStatus = (userId: string, status: UserAccount['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const updateBusinessInfo = (info: { name?: string; description?: string; business_type?: any }) => {
    setOrganizations(prev => prev.map(org => {
      if (org.id === currentOrgId) {
        return {
          ...org,
          name: info.name !== undefined ? info.name : org.name,
          description: info.description !== undefined ? info.description : org.description,
          business_type: info.business_type !== undefined ? info.business_type : org.business_type,
        };
      }
      return org;
    }));
  };

  const updateOrganizationSettings = (newSettings: Partial<OrganizationSettings>) => {
    setOrganizations(prev => prev.map(org => {
      if (org.id === currentOrgId && org.settings) {
        return {
          ...org,
          settings: {
            ...org.settings,
            ...newSettings
          }
        };
      }
      return org;
    }));
  };

  const updateBusinessHours = (newHours: BusinessHour[]) => {
    setBusinessHours(prev => {
      const otherOrgsHours = prev.filter(h => h.organization_id !== currentOrgId);
      return [...otherOrgsHours, ...newHours];
    });
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'created_at'>) => {
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setGalleryItems(prev => [...prev, newItem]);
  };

  const removeGalleryItem = (id: string) => {
    setGalleryItems(prev => prev.filter(g => g.id !== id));
  };

  const reorderGalleryItems = (reordered: GalleryItem[]) => {
    setGalleryItems(prev => {
      const otherOrgsItems = prev.filter(g => g.organization_id !== currentOrgId);
      return [...otherOrgsItems, ...reordered];
    });
  };

  const createOrganization = (orgData: Partial<Organization> & { initialModules?: Record<string, boolean> }) => {
    const newId = `org-${Date.now()}`;
    const slug = (orgData.name || 'nuevo-negocio').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const newOrg: Organization = {
      id: newId,
      name: orgData.name || 'Nuevo Negocio',
      slug,
      business_type: orgData.business_type || 'store',
      description: orgData.description || '',
      is_active: orgData.is_active !== undefined ? orgData.is_active : true,
      approval_status: orgData.approval_status || (orgData.is_active === false ? 'PENDING' : 'APPROVED'),
      rejection_reason: orgData.rejection_reason,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      settings: {
        organization_id: newId,
        logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        primary_color: '#2563EB',
        secondary_color: '#3B82F6',
        accent_color: '#10B981',
        address: 'Dirección Comercial, Lima',
        phone: '+51 900 000 000',
        whatsapp_number: '51900000000',
        whatsapp_message: '¡Hola! Me gustaría hacer una consulta o pedido.',
        email: 'contacto@negocio.pe',
        currency: 'S/',
        slogan: 'Calidad y servicio garantizado',
        active_modules: {
          products: orgData.initialModules?.products ?? true,
          services: orgData.initialModules?.services ?? false,
          categories: true,
          orders: orgData.initialModules?.orders ?? true,
          appointments: orgData.initialModules?.appointments ?? false,
          delivery: orgData.initialModules?.delivery ?? true,
          promotions: true,
          gallery: true,
          whatsapp: true,
          hours: true,
          location: true,
          testimonials: true,
          social: true,
          notifications: true,
          analytics: true,
        }
      }
    };

    setOrganizations(prev => [newOrg, ...prev]);
    setCurrentOrgIdState(newId);
    
    // Auto-create default trial subscription for new business
    startFreeTrial(newId, 'plan-inicial');

    return newOrg;
  };

  // Category Operations
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const reorderCategories = (reordered: Category[]) => {
    setCategories(prev => {
      const otherOrgsCats = prev.filter(c => c.organization_id !== currentOrgId);
      return [...otherOrgsCats, ...reordered];
    });
  };

  // Product Operations
  const addProduct = (prod: Omit<Product, 'id' | 'created_at'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated, updated_at: new Date().toISOString() } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const toggleProductFeatured = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !p.is_featured } : p));
  };

  const reorderProducts = (reordered: Product[]) => {
    setProducts(prev => {
      const otherOrgsProds = prev.filter(p => p.organization_id !== currentOrgId);
      return [...otherOrgsProds, ...reordered];
    });
  };

  // Service Operations
  const addService = (serv: Omit<ServiceItem, 'id' | 'created_at'>) => {
    const newServ: ServiceItem = {
      ...serv,
      id: `serv-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setServices(prev => [newServ, ...prev]);
  };

  const updateService = (id: string, updated: Partial<ServiceItem>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated, updated_at: new Date().toISOString() } : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const toggleServiceActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  const toggleServiceFeatured = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_featured: !s.is_featured } : s));
  };

  const reorderServices = (reordered: ServiceItem[]) => {
    setServices(prev => {
      const otherOrgsServs = prev.filter(s => s.organization_id !== currentOrgId);
      return [...otherOrgsServs, ...reordered];
    });
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'created_at'>) => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated, updated_at: new Date().toISOString() } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'order_number' | 'created_at'>) => {
    const count = orders.filter(o => o.organization_id === orderData.organization_id).length + 101;
    const orderNumber = `#000${String(count).padStart(3, '0')}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      created_at: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);

    // Auto-create or update customer record for this business
    if (orderData.customer_name && orderData.customer_phone) {
      setCustomers(prev => {
        const cleanPhone = orderData.customer_phone.replace(/\s+/g, '');
        const existing = prev.find(
          c => c.organization_id === orderData.organization_id && (c.phone.replace(/\s+/g, '') === cleanPhone || c.name.toLowerCase() === orderData.customer_name.toLowerCase())
        );

        if (existing) {
          return prev.map(c => c.id === existing.id ? {
            ...c,
            name: orderData.customer_name,
            phone: orderData.customer_phone,
            address: orderData.delivery_address || c.address,
            reference: orderData.customer_reference || c.reference,
            total_orders: (c.total_orders || 1) + 1,
            total_spent: (c.total_spent || 0) + orderData.total,
            last_order_date: new Date().toISOString(),
            last_order_number: orderNumber,
            updated_at: new Date().toISOString()
          } : c);
        } else {
          const newCust: Customer = {
            id: `cust-${Date.now()}`,
            organization_id: orderData.organization_id,
            name: orderData.customer_name,
            phone: orderData.customer_phone,
            address: orderData.delivery_address || '',
            reference: orderData.customer_reference || '',
            notes: orderData.notes || '',
            total_orders: 1,
            total_spent: orderData.total,
            last_order_date: new Date().toISOString(),
            last_order_number: orderNumber,
            created_at: new Date().toISOString()
          };
          return [newCust, ...prev];
        }
      });
    }

    // Trigger real-time sound alert and toast notification
    playOrderAlertSound();
    setLatestNewOrderNotification(newOrder);

    return newOrder;
  };

  const createAppointment = (aptData: Omit<Appointment, 'id' | 'created_at'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setAppointments(prev => [newApt, ...prev]);
    return newApt;
  };

  const updateAppointmentStatus = (aptId: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status } : a));
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        currentOrg,
        organizations,
        setCurrentOrgId,
        activeView,
        setActiveView,
        categories,
        products,
        services,
        orders,
        appointments,
        promotions,
        plans,
        subscriptions,
        payments,
        users,
        webhookLogs,
        businessHours,
        galleryItems,
        customers,
        getCurrentSubscription,
        getCurrentPlan,
        changePlan,
        startFreeTrial,
        cancelSubscription,
        renewSubscription,
        updateCustomDomain,
        processPayment,
        canAddProduct,
        canAddGalleryImage,
        canAddStaff,
        upgradeModalOpen,
        upgradeModalReason,
        openUpgradeModal,
        closeUpgradeModal,
        checkoutModalOpen,
        selectedPlanForCheckout,
        selectedBillingPeriod,
        openCheckoutModal,
        closeCheckoutModal,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        requireSuperAdminApproval,
        setRequireSuperAdminApproval,
        pendingApprovalsCount,
        approveUserAccount,
        rejectUserAccount,
        approveAllPendingUsers,
        registerNewTenantAccount,
        updateUserAccountStatus,
        latestNewOrderNotification,
        clearOrderNotification,
        playOrderAlertSound,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateOrganizationSettings,
        updateBusinessInfo,
        updateBusinessHours,
        addGalleryItem,
        removeGalleryItem,
        reorderGalleryItems,
        createOrganization,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        toggleProductFeatured,
        reorderProducts,
        addService,
        updateService,
        deleteService,
        toggleServiceActive,
        toggleServiceFeatured,
        reorderServices,
        updateOrderStatus,
        createOrder,
        createAppointment,
        updateAppointmentStatus,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
