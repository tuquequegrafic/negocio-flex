import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  Customer,
  InventoryMovement,
  InventoryReferenceType,
  InventoryMovementType
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
  INITIAL_INVENTORY_MOVEMENTS,
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
import { supabaseService } from '../core/network/supabase_client';
import type { Database } from '../types/database.types';
import { CategoryDataSource } from '../features/categories/data/datasources/category_datasource';
import { CategoryRepositoryImpl } from '../features/categories/data/repositories/category_repository_impl';
import {
  GetCategoriesUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  ReorderCategoriesUseCase,
} from '../features/categories/domain/usecases/category_usecases';
import { CategoryModel } from '../features/categories/data/models/category_model';
import { ProductDataSource } from '../features/products/data/datasources/product_datasource';
import { ProductRepositoryImpl } from '../features/products/data/repositories/product_repository_impl';
import {
  GetProductsUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  ToggleProductActiveUseCase,
  ToggleProductFeaturedUseCase,
  ReorderProductsUseCase,
} from '../features/products/domain/usecases/product_usecases';
import { ProductModel } from '../features/products/data/models/product_model';
import { InventoryDataSource } from '../features/inventory/data/datasources/inventory_datasource';
import { InventoryRepositoryImpl } from '../features/inventory/data/repositories/inventory_repository_impl';
import {
  DeductStockUseCase,
  RestoreStockUseCase,
  AdjustInventoryUseCase,
  GetInventoryLedgerUseCase,
  GetCurrentStockUseCase,
} from '../features/inventory/domain/usecases/inventory_usecases';
import { InventoryMovementEntity } from '../features/inventory/domain/entities/inventory_movement_entity';
import { ServiceDataSource } from '../features/services/data/datasources/service_datasource';
import { ServiceRepositoryImpl } from '../features/services/data/repositories/service_repository_impl';
import {
  GetServicesUseCase,
  CreateServiceUseCase,
  UpdateServiceUseCase,
  DeleteServiceUseCase,
  ToggleServiceActiveUseCase,
  ToggleServiceFeaturedUseCase,
  ReorderServicesUseCase,
} from '../features/services/domain/usecases/service_usecases';
import { ServiceModel } from '../features/services/data/models/service_model';
import { CustomerDataSource } from '../features/customers/data/datasources/customer_datasource';
import { CustomerRepositoryImpl } from '../features/customers/data/repositories/customer_repository_impl';
import {
  GetCustomersUseCase,
  GetCustomerByIdUseCase,
  GetCustomerProfile360UseCase,
  FindOrCreateCustomerUseCase,
  CreateCustomerUseCase,
  UpdateCustomerUseCase,
  DeleteCustomerUseCase,
  SearchCustomersUseCase,
} from '../features/customers/domain/usecases/customer_usecases';
import { CustomerModel } from '../features/customers/data/models/customer_model';
import { CustomerProfile360, CreateCustomerParams } from '../features/customers/domain/entities/customer_entity';
import { normalizePhone } from '../core/utils/phone_utils';
import { OrderDataSource } from '../features/orders/data/datasources/order_datasource';
import { OrderRepositoryImpl } from '../features/orders/data/repositories/order_repository_impl';
import {
  GetOrdersUseCase,
  GetOrderByIdUseCase,
  CreateOrderUseCase,
  UpdateOrderUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderUseCase,
  GetOrderItemsUseCase,
  CreateOrderItemsUseCase,
} from '../features/orders/domain/usecases/order_usecases';
import { OrderModel } from '../features/orders/data/models/order_model';
import { AppointmentDataSource } from '../features/appointments/data/datasources/appointment_datasource';
import { AppointmentRepositoryImpl } from '../features/appointments/data/repositories/appointment_repository_impl';
import {
  GetAppointmentsUseCase,
  GetAppointmentByIdUseCase,
  CreateAppointmentUseCase,
  UpdateAppointmentUseCase,
  UpdateAppointmentStatusUseCase,
  DeleteAppointmentUseCase,
  CheckAppointmentOverlapUseCase,
} from '../features/appointments/domain/usecases/appointment_usecases';
import { AppointmentModel } from '../features/appointments/data/models/appointment_model';
import { logger } from '../core/utils/logger';

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
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  appointments: Appointment[];
  appointmentsLoading: boolean;
  refreshAppointments: () => Promise<void>;
  promotions: Promotion[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: PaymentTransaction[];
  users: UserAccount[];
  webhookLogs: WebhookLog[];
  businessHours: BusinessHour[];
  galleryItems: GalleryItem[];
  customers: Customer[];
  
  // Phase 12: Inventory & Ledger
  inventoryMovements: InventoryMovement[];
  inventoryLoading: boolean;
  adjustInventory: (params: {
    productId: string;
    movementType: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL_LOAD' | 'REVERSAL';
    quantity: number;
    direction?: 'IN' | 'OUT';
    unitCost?: number;
    reason: string;
    referenceType?: InventoryReferenceType;
    referenceId?: string;
  }) => Promise<InventoryMovement>;
  refreshInventoryMovements: () => Promise<void>;
  
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
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void> | void;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void> | void;
  deleteCategory: (id: string) => Promise<void> | void;
  reorderCategories: (categories: Category[]) => Promise<void> | void;

  // Product Actions
  addProduct: (prod: Omit<Product, 'id' | 'created_at'>) => Promise<void> | void;
  updateProduct: (id: string, prod: Partial<Product>) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  toggleProductActive: (id: string) => Promise<void> | void;
  toggleProductFeatured: (id: string) => Promise<void> | void;
  reorderProducts: (products: Product[]) => Promise<void> | void;

  // Service Actions
  addService: (serv: Omit<ServiceItem, 'id' | 'created_at'>) => Promise<void> | void;
  updateService: (id: string, serv: Partial<ServiceItem>) => Promise<void> | void;
  deleteService: (id: string) => Promise<void> | void;
  toggleServiceActive: (id: string) => Promise<void> | void;
  toggleServiceFeatured: (id: string) => Promise<void> | void;
  reorderServices: (services: ServiceItem[]) => Promise<void> | void;

  // Customer Actions (Fase 8 - CRM)
  customersLoading: boolean;
  refreshCustomers: () => Promise<void>;
  getCustomerProfile360: (customerId: string) => Promise<CustomerProfile360 | null>;
  findOrCreateCustomer: (params: CreateCustomerParams) => Promise<Customer>;
  addCustomer: (cust: Omit<Customer, 'id' | 'created_at'>) => Promise<Customer>;
  updateCustomer: (id: string, cust: Partial<Customer>) => Promise<Customer | void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Real-time Sound & Notifications
  latestNewOrderNotification: Order | null;
  clearOrderNotification: () => void;
  playOrderAlertSound: () => void;

  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'order_number' | 'created_at'>) => Order;
  deleteOrder: (orderId: string) => Promise<void>;
  createAppointment: (apt: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment>;
  updateAppointment: (aptId: string, apt: Partial<Appointment>) => Promise<void>;
  updateAppointmentStatus: (aptId: string, status: Appointment['status']) => Promise<void> | void;
  deleteAppointment: (aptId: string) => Promise<void>;
  checkAppointmentOverlap: (date: string, startTime: string, endTime: string, staffName?: string, excludeAppointmentId?: string, organizationId?: string) => Promise<boolean>;
  
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

// Mutex / Lock en memoria para evitar condiciones de carrera en reservas simultáneas
const inFlightAppointmentLocks = new Set<string>();

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

  // Category UseCases & Clean Architecture Instances (Fase 4.1)
  const categoryDataSource = useMemo(() => new CategoryDataSource(), []);
  const categoryRepository = useMemo(() => new CategoryRepositoryImpl(categoryDataSource), [categoryDataSource]);
  const getCategoriesUseCase = useMemo(() => new GetCategoriesUseCase(categoryRepository), [categoryRepository]);
  const createCategoryUseCase = useMemo(() => new CreateCategoryUseCase(categoryRepository), [categoryRepository]);
  const updateCategoryUseCase = useMemo(() => new UpdateCategoryUseCase(categoryRepository), [categoryRepository]);
  const deleteCategoryUseCase = useMemo(() => new DeleteCategoryUseCase(categoryRepository), [categoryRepository]);
  const reorderCategoriesUseCase = useMemo(() => new ReorderCategoriesUseCase(categoryRepository), [categoryRepository]);

  // Product UseCases & Clean Architecture Instances (Fase 4.2)
  const productDataSource = useMemo(() => new ProductDataSource(), []);
  const productRepository = useMemo(() => new ProductRepositoryImpl(productDataSource), [productDataSource]);
  const getProductsUseCase = useMemo(() => new GetProductsUseCase(productRepository), [productRepository]);
  const createProductUseCase = useMemo(() => new CreateProductUseCase(productRepository), [productRepository]);
  const updateProductUseCase = useMemo(() => new UpdateProductUseCase(productRepository), [productRepository]);
  const deleteProductUseCase = useMemo(() => new DeleteProductUseCase(productRepository), [productRepository]);
  const toggleProductActiveUseCase = useMemo(() => new ToggleProductActiveUseCase(productRepository), [productRepository]);
  const toggleProductFeaturedUseCase = useMemo(() => new ToggleProductFeaturedUseCase(productRepository), [productRepository]);
  const reorderProductsUseCase = useMemo(() => new ReorderProductsUseCase(productRepository), [productRepository]);

  // Service UseCases & Clean Architecture Instances (Fase 4.3)
  const serviceDataSource = useMemo(() => new ServiceDataSource(), []);
  const serviceRepository = useMemo(() => new ServiceRepositoryImpl(serviceDataSource), [serviceDataSource]);
  const getServicesUseCase = useMemo(() => new GetServicesUseCase(serviceRepository), [serviceRepository]);
  const createServiceUseCase = useMemo(() => new CreateServiceUseCase(serviceRepository), [serviceRepository]);
  const updateServiceUseCase = useMemo(() => new UpdateServiceUseCase(serviceRepository), [serviceRepository]);
  const deleteServiceUseCase = useMemo(() => new DeleteServiceUseCase(serviceRepository), [serviceRepository]);
  const toggleServiceActiveUseCase = useMemo(() => new ToggleServiceActiveUseCase(serviceRepository), [serviceRepository]);
  const toggleServiceFeaturedUseCase = useMemo(() => new ToggleServiceFeaturedUseCase(serviceRepository), [serviceRepository]);
  const reorderServicesUseCase = useMemo(() => new ReorderServicesUseCase(serviceRepository), [serviceRepository]);

  // Customer UseCases & Clean Architecture Instances (Fase 4.4 & Fase 8)
  const customerDataSource = useMemo(() => new CustomerDataSource(), []);
  const customerRepository = useMemo(() => new CustomerRepositoryImpl(customerDataSource), [customerDataSource]);
  const getCustomersUseCase = useMemo(() => new GetCustomersUseCase(customerRepository), [customerRepository]);
  const getCustomerByIdUseCase = useMemo(() => new GetCustomerByIdUseCase(customerRepository), [customerRepository]);
  const getCustomerProfile360UseCase = useMemo(() => new GetCustomerProfile360UseCase(customerRepository), [customerRepository]);
  const findOrCreateCustomerUseCase = useMemo(() => new FindOrCreateCustomerUseCase(customerRepository), [customerRepository]);
  const createCustomerUseCase = useMemo(() => new CreateCustomerUseCase(customerRepository), [customerRepository]);
  const updateCustomerUseCase = useMemo(() => new UpdateCustomerUseCase(customerRepository), [customerRepository]);
  const deleteCustomerUseCase = useMemo(() => new DeleteCustomerUseCase(customerRepository), [customerRepository]);
  const searchCustomersUseCase = useMemo(() => new SearchCustomersUseCase(customerRepository), [customerRepository]);

  // Order UseCases & Clean Architecture Instances (Fase 5)
  const orderDataSource = useMemo(() => new OrderDataSource(), []);
  const orderRepository = useMemo(() => new OrderRepositoryImpl(orderDataSource), [orderDataSource]);
  const getOrdersUseCase = useMemo(() => new GetOrdersUseCase(orderRepository), [orderRepository]);
  const getOrderByIdUseCase = useMemo(() => new GetOrderByIdUseCase(orderRepository), [orderRepository]);
  const createOrderUseCase = useMemo(() => new CreateOrderUseCase(orderRepository), [orderRepository]);
  const updateOrderUseCase = useMemo(() => new UpdateOrderUseCase(orderRepository), [orderRepository]);
  const updateOrderStatusUseCase = useMemo(() => new UpdateOrderStatusUseCase(orderRepository), [orderRepository]);
  const deleteOrderUseCase = useMemo(() => new DeleteOrderUseCase(orderRepository), [orderRepository]);
  const getOrderItemsUseCase = useMemo(() => new GetOrderItemsUseCase(orderRepository), [orderRepository]);
  const createOrderItemsUseCase = useMemo(() => new CreateOrderItemsUseCase(orderRepository), [orderRepository]);

  // Appointment UseCases & Clean Architecture Instances (Fase 6)
  const appointmentDataSource = useMemo(() => new AppointmentDataSource(), []);
  const appointmentRepository = useMemo(() => new AppointmentRepositoryImpl(appointmentDataSource), [appointmentDataSource]);
  const getAppointmentsUseCase = useMemo(() => new GetAppointmentsUseCase(appointmentRepository), [appointmentRepository]);
  const getAppointmentByIdUseCase = useMemo(() => new GetAppointmentByIdUseCase(appointmentRepository), [appointmentRepository]);
  const createAppointmentUseCase = useMemo(() => new CreateAppointmentUseCase(appointmentRepository), [appointmentRepository]);
  const updateAppointmentUseCase = useMemo(() => new UpdateAppointmentUseCase(appointmentRepository), [appointmentRepository]);
  const updateAppointmentStatusUseCase = useMemo(() => new UpdateAppointmentStatusUseCase(appointmentRepository), [appointmentRepository]);
  const deleteAppointmentUseCase = useMemo(() => new DeleteAppointmentUseCase(appointmentRepository), [appointmentRepository]);
  const checkAppointmentOverlapUseCase = useMemo(() => new CheckAppointmentOverlapUseCase(appointmentRepository), [appointmentRepository]);

  // Fuente de Verdad: Supabase PostgreSQL (public.categories)
  const [categories, setCategories] = useState<Category[]>([]);

  // Fuente de Verdad: Supabase PostgreSQL (public.products)
  const [products, setProducts] = useState<Product[]>([]);

  // Fuente de Verdad: Supabase PostgreSQL (public.services)
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Fuente de Verdad: Supabase PostgreSQL (public.customers)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);

  // Fuente de Verdad: Supabase PostgreSQL (public.orders)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Fuente de Verdad: Libro Mayor de Inventario (Fase 12: inventory_movements)
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    return INITIAL_INVENTORY_MOVEMENTS.map(m => ({
      id: m.id,
      organization_id: m.organization_id,
      product_id: m.product_id,
      product_name: m.product_name,
      movement_type: m.movement_type,
      quantity: m.quantity,
      stock_before: m.stock_before,
      stock_after: m.stock_after,
      unit_cost: m.unit_cost,
      total_cost: m.total_cost,
      reference_type: m.reference_type,
      reference_id: m.reference_id,
      reason: m.reason,
      created_by: m.created_by,
      created_at: m.created_at,
    }));
  });
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(false);

  const inventoryDataSource = useMemo(() => {
    const initialEntities: InventoryMovementEntity[] = INITIAL_INVENTORY_MOVEMENTS.map(m => ({
      id: m.id,
      organizationId: m.organization_id,
      productId: m.product_id,
      productName: m.product_name,
      movementType: m.movement_type,
      quantity: m.quantity,
      stockBefore: m.stock_before,
      stockAfter: m.stock_after,
      unitCost: m.unit_cost,
      totalCost: m.total_cost,
      referenceType: m.reference_type,
      referenceId: m.reference_id,
      reason: m.reason,
      createdBy: m.created_by,
      createdAt: m.created_at,
    }));
    return new InventoryDataSource(initialEntities);
  }, []);

  const inventoryRepository = useMemo(() => {
    return new InventoryRepositoryImpl(inventoryDataSource, {
      getProductStockFn: (prodId: string) => {
        const prod = products.find(p => p.id === prodId);
        return {
          stock: prod?.stock ?? 0,
          name: prod?.name ?? 'Producto',
          costPrice: prod?.cost_price ?? 0,
          trackInventory: prod?.track_inventory ?? true,
          allowNegativeStock: prod?.allow_negative_stock ?? false,
        };
      },
      updateProductStockFn: (prodId: string, newStock: number, newCost?: number) => {
        setProducts(prev => prev.map(p => {
          if (p.id === prodId) {
            return {
              ...p,
              stock: newStock,
              cost_price: newCost !== undefined && newCost > 0 ? newCost : p.cost_price,
            };
          }
          return p;
        }));
      },
    });
  }, [inventoryDataSource, products]);

  const deductStockUseCase = useMemo(() => new DeductStockUseCase(inventoryRepository), [inventoryRepository]);
  const restoreStockUseCase = useMemo(() => new RestoreStockUseCase(inventoryRepository), [inventoryRepository]);
  const adjustInventoryUseCase = useMemo(() => new AdjustInventoryUseCase(inventoryRepository), [inventoryRepository]);
  const getInventoryLedgerUseCase = useMemo(() => new GetInventoryLedgerUseCase(inventoryRepository), [inventoryRepository]);
  const getCurrentStockUseCase = useMemo(() => new GetCurrentStockUseCase(inventoryRepository), [inventoryRepository]);

  // Sincronización reactiva de categorías con Supabase PostgreSQL
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      if (!currentOrgId) {
        setCategories([]);
        return;
      }

      if (!supabaseService.isConfigured) {
        const initialForOrg = INITIAL_CATEGORIES.filter(c => c.organization_id === currentOrgId);
        setCategories(initialForOrg);
        return;
      }

      try {
        const results = await getCategoriesUseCase.execute(currentOrgId);
        if (isMounted) {
          const mapped: Category[] = (results as CategoryModel[]).map(cat =>
            typeof cat.toLegacy === 'function'
              ? cat.toLegacy()
              : {
                  id: cat.id,
                  organization_id: (cat as any).organizationId || (cat as any).organization_id,
                  name: cat.name,
                  description: cat.description || undefined,
                  image_url: (cat as any).imageUrl || (cat as any).image_url,
                  icon: cat.icon || undefined,
                  type: cat.type,
                  display_order: (cat as any).displayOrder ?? (cat as any).display_order ?? 0,
                  is_active: (cat as any).isActive ?? (cat as any).is_active ?? true,
                  created_at: (cat as any).createdAt || (cat as any).created_at,
                }
          );
          setCategories(mapped);
        }
      } catch (error) {
        logger.warning('Aviso al cargar categorías desde Supabase, aplicando datos iniciales:', error);
        if (isMounted) {
          setCategories(INITIAL_CATEGORIES.filter(c => c.organization_id === currentOrgId));
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [currentOrgId, getCategoriesUseCase]);

  // Sincronización reactiva de productos con Supabase PostgreSQL (Fase 4.2)
  const refreshProducts = useCallback(async () => {
    if (!currentOrgId) {
      setProducts([]);
      return;
    }

    if (!supabaseService.isConfigured) {
      const initialForOrg = INITIAL_PRODUCTS.filter(p => p.organization_id === currentOrgId);
      setProducts(initialForOrg);
      return;
    }

    try {
      const results = await getProductsUseCase.execute(currentOrgId);
      const mapped: Product[] = (results as ProductModel[]).map(prod => {
        const category = categories.find(c => c.id === prod.categoryId);
        const legacy = typeof prod.toLegacy === 'function'
          ? prod.toLegacy()
          : {
              id: prod.id,
              organization_id: (prod as any).organizationId || (prod as any).organization_id,
              category_id: prod.categoryId || undefined,
              name: prod.name,
              sku: prod.sku,
              cost_price: prod.costPrice,
              description: prod.description,
              price: prod.price,
              promo_price: prod.promoPrice ?? undefined,
              stock: prod.stock,
              track_inventory: prod.trackInventory,
              allow_negative_stock: prod.allowNegativeStock,
              barcode: prod.barcode,
              is_active: prod.isActive,
              is_featured: prod.isFeatured,
              display_order: prod.displayOrder,
              images: prod.images,
              category_name: category?.name,
              created_at: prod.createdAt || new Date().toISOString(),
              updated_at: prod.updatedAt,
            };

        if (!legacy.category_name && category?.name) {
          legacy.category_name = category.name;
        }
        return legacy;
      });
      setProducts(mapped);
    } catch (error) {
      logger.warning('Aviso al cargar productos desde Supabase, aplicando datos iniciales:', error);
      setProducts(INITIAL_PRODUCTS.filter(p => p.organization_id === currentOrgId));
    }
  }, [currentOrgId, categories, getProductsUseCase]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Sincronización reactiva de servicios con Supabase PostgreSQL (Fase 4.3)
  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      if (!currentOrgId) {
        setServices([]);
        return;
      }

      if (!supabaseService.isConfigured) {
        const initialForOrg = INITIAL_SERVICES.filter(s => s.organization_id === currentOrgId);
        setServices(initialForOrg);
        return;
      }

      try {
        const results = await getServicesUseCase.execute(currentOrgId);
        if (isMounted) {
          const mapped: ServiceItem[] = results.map(serv => {
            const category = categories.find(c => c.id === serv.categoryId);
            const legacy = serv instanceof ServiceModel
              ? serv.toLegacy()
              : {
                  id: serv.id,
                  organization_id: serv.organizationId,
                  category_id: serv.categoryId || undefined,
                  name: serv.name,
                  description: serv.description,
                  price: serv.price,
                  promo_price: serv.promoPrice !== null ? serv.promoPrice : undefined,
                  duration_minutes: serv.durationMinutes,
                  image_url: serv.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
                  is_active: serv.isActive,
                  is_featured: serv.isFeatured,
                  display_order: serv.displayOrder,
                  category_name: serv.categoryName || category?.name,
                  created_at: serv.createdAt || new Date().toISOString(),
                  updated_at: serv.updatedAt,
                };

            if (!legacy.category_name && category?.name) {
              legacy.category_name = category.name;
            }
            return legacy;
          });
          setServices(mapped);
        }
      } catch (error) {
        logger.warning('Aviso al cargar servicios desde Supabase, aplicando datos iniciales:', error);
        if (isMounted) {
          setServices(INITIAL_SERVICES.filter(s => s.organization_id === currentOrgId));
        }
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [currentOrgId, categories, getServicesUseCase]);

  // Sincronización reactiva de clientes con Supabase PostgreSQL (Fase 4.4)
  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      if (!currentOrgId) {
        setCustomers([]);
        return;
      }

      if (!supabaseService.isConfigured) {
        const initialForOrg = INITIAL_CUSTOMERS.filter(c => c.organization_id === currentOrgId);
        setCustomers(initialForOrg);
        return;
      }

      try {
        const results = await getCustomersUseCase.execute(currentOrgId);
        if (isMounted) {
          const mapped: Customer[] = results.map(cust =>
            cust instanceof CustomerModel
              ? cust.toLegacy()
              : {
                  id: cust.id,
                  organization_id: cust.organizationId,
                  name: cust.name,
                  phone: cust.phone,
                  email: cust.email,
                  address: cust.address,
                  reference: cust.reference,
                  notes: cust.notes,
                  total_orders: cust.totalOrders,
                  total_spent: cust.totalSpent,
                  last_order_date: cust.lastOrderDate,
                  last_order_number: cust.lastOrderNumber,
                  created_at: cust.createdAt || new Date().toISOString(),
                  updated_at: cust.updatedAt,
                }
          );
          setCustomers(mapped);
        }
      } catch (error) {
        logger.warning('Aviso al cargar clientes desde Supabase, aplicando datos iniciales:', error);
        if (isMounted) {
          setCustomers(INITIAL_CUSTOMERS.filter(c => c.organization_id === currentOrgId));
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [currentOrgId, getCustomersUseCase]);

  // Sincronización reactiva de pedidos con Supabase PostgreSQL (Fase 5)
  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      if (!currentOrgId) {
        if (isMounted) setOrders([]);
        return;
      }

      try {
        if (isMounted) setOrdersLoading(true);
        if (supabaseService.isConfigured) {
          logger.info('Sincronizando pedidos desde Supabase PostgreSQL...', { currentOrgId });
          const data = await getOrdersUseCase.execute(currentOrgId);
          if (isMounted) {
            const mapped: Order[] = data.map(ord =>
              ord instanceof OrderModel
                ? ord.toLegacy()
                : OrderModel.fromLegacy(ord as any).toLegacy()
            );
            setOrders(mapped);
          }
        } else {
          if (isMounted) {
            setOrders(INITIAL_ORDERS.filter(o => o.organization_id === currentOrgId));
          }
        }
      } catch (error) {
        logger.warning('Aviso al cargar pedidos desde Supabase, aplicando datos iniciales:', error);
        if (isMounted) {
          setOrders(INITIAL_ORDERS.filter(o => o.organization_id === currentOrgId));
        }
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [currentOrgId, getOrdersUseCase]);

  // Fuente de Verdad: Supabase PostgreSQL (public.appointments)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(true);

  // Carga reactiva de citas desde Supabase PostgreSQL
  useEffect(() => {
    let isMounted = true;

    async function loadAppointments() {
      if (!currentOrgId) {
        setAppointments([]);
        setAppointmentsLoading(false);
        return;
      }

      try {
        setAppointmentsLoading(true);
        if (supabaseService.isConfigured) {
          const entities = await getAppointmentsUseCase.execute(currentOrgId);
          if (isMounted) {
            const mapped = entities.map(apt =>
              apt instanceof AppointmentModel
                ? apt.toLegacy()
                : AppointmentModel.fromLegacy(apt as any).toLegacy()
            );
            setAppointments(mapped);
          }
        } else {
          if (isMounted) {
            setAppointments(INITIAL_APPOINTMENTS.filter(a => a.organization_id === currentOrgId));
          }
        }
      } catch (error) {
        logger.warning('Aviso al cargar citas desde Supabase, aplicando datos iniciales:', error);
        if (isMounted) {
          setAppointments(INITIAL_APPOINTMENTS.filter(a => a.organization_id === currentOrgId));
        }
      } finally {
        if (isMounted) {
          setAppointmentsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [currentOrgId, getAppointmentsUseCase]);

  const refreshAppointments = useCallback(async () => {
    if (!currentOrgId) return;
    try {
      setAppointmentsLoading(true);
      if (supabaseService.isConfigured) {
        const entities = await getAppointmentsUseCase.execute(currentOrgId);
        const mapped = entities.map(apt =>
          apt instanceof AppointmentModel
            ? apt.toLegacy()
            : AppointmentModel.fromLegacy(apt as any).toLegacy()
        );
        setAppointments(mapped);
      } else {
        setAppointments(INITIAL_APPOINTMENTS.filter(a => a.organization_id === currentOrgId));
      }
    } catch (error) {
      logger.error('Error refrescando citas desde Supabase:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [currentOrgId, getAppointmentsUseCase]);

  const refreshInventoryMovements = useCallback(async () => {
    if (!currentOrgId) return;
    try {
      setInventoryLoading(true);
      const data = await getInventoryLedgerUseCase.execute(currentOrgId, { userRole: currentRole });
      setInventoryMovements(data.map(m => ({
        id: m.id,
        organization_id: m.organizationId,
        product_id: m.productId,
        product_name: m.productName,
        movement_type: m.movementType,
        quantity: m.quantity,
        stock_before: m.stockBefore,
        stock_after: m.stockAfter,
        unit_cost: m.unitCost,
        total_cost: m.totalCost,
        reference_type: m.referenceType,
        reference_id: m.referenceId,
        reason: m.reason,
        created_by: m.createdBy,
        created_at: m.createdAt,
      })));
    } catch (err) {
      logger.warning('Error refrescando libro mayor de inventario:', err);
    } finally {
      setInventoryLoading(false);
    }
  }, [currentOrgId, currentRole, getInventoryLedgerUseCase]);

  // Sincronización reactiva del libro mayor de inventario (Fase 12)
  useEffect(() => {
    refreshInventoryMovements();
  }, [currentOrgId, refreshInventoryMovements]);

  const adjustInventory = async (params: {
    productId: string;
    movementType: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL_LOAD' | 'REVERSAL';
    quantity: number;
    direction?: 'IN' | 'OUT';
    unitCost?: number;
    reason: string;
    referenceType?: InventoryReferenceType;
    referenceId?: string;
  }): Promise<InventoryMovement> => {
    try {
      const result = await adjustInventoryUseCase.execute({
        organizationId: currentOrgId,
        productId: params.productId,
        movementType: params.movementType,
        quantity: params.quantity,
        direction: params.direction,
        unitCost: params.unitCost,
        reason: params.reason,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        userId: currentUser.id,
        userRole: currentRole,
      });

      const legacyMovement: InventoryMovement = {
        id: result.id,
        organization_id: result.organizationId,
        product_id: result.productId,
        product_name: result.productName,
        movement_type: result.movementType,
        quantity: result.quantity,
        stock_before: result.stockBefore,
        stock_after: result.stockAfter,
        unit_cost: result.unitCost,
        total_cost: result.totalCost,
        reference_type: result.referenceType,
        reference_id: result.referenceId,
        reason: result.reason,
        created_by: result.createdBy,
        created_at: result.createdAt,
      };

      setInventoryMovements(prev => [legacyMovement, ...prev]);
      return legacyMovement;
    } catch (error) {
      logger.error('Error en adjustInventory:', error);
      throw error;
    }
  };

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(() => {
    const saved = localStorage.getItem('negocioflex_hours');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_HOURS;
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('negocioflex_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY_ITEMS;
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

  // Suscripción Realtime a Supabase PostgreSQL (public.appointments)
  // Sincroniza en vivo entre múltiples sesiones/dispositivos
  useEffect(() => {
    if (!currentOrgId || !supabaseService.isConfigured) return;

    const client = supabaseService.getClient();
    if (!client) return;

    const channelName = `realtime-appointments-${currentOrgId}`;
    logger.info(`Conectando suscripción Realtime para citas de la org ${currentOrgId}...`);

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `organization_id=eq.${currentOrgId}`,
        },
        (payload) => {
          logger.info(`Evento Realtime de cita [${payload.eventType}] recibido en Supabase:`, payload);

          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            if (raw) {
              const newApt = AppointmentModel.fromRow(raw).toLegacy();
              setAppointments(prev => {
                if (prev.some(a => a.id === newApt.id)) {
                  return prev.map(a => a.id === newApt.id ? newApt : a);
                }
                return [newApt, ...prev];
              });
              playOrderAlertSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            if (raw) {
              const updatedApt = AppointmentModel.fromRow(raw).toLegacy();
              setAppointments(prev => prev.map(a => a.id === updatedApt.id ? updatedApt : a));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setAppointments(prev => prev.filter(a => a.id !== deletedId));
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`Canal Realtime appointments estado: ${status}`);
      });

    return () => {
      logger.info(`Desuscribiendo canal Realtime appointments: ${channelName}`);
      client.removeChannel(channel);
    };
  }, [currentOrgId]);

  const clearOrderNotification = () => {
    setLatestNewOrderNotification(null);
  };

  // Persistence to local state
  useEffect(() => {
    localStorage.setItem('negocioflex_orgs', JSON.stringify(organizations));
  }, [organizations]);

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

    const client = supabaseService.getClient();
    if (client && currentOrgId) {
      const updateData: Database['public']['Tables']['organizations']['Update'] = { updated_at: new Date().toISOString() };
      if (info.name !== undefined) updateData.name = info.name;
      if (info.description !== undefined) updateData.description = info.description;
      if (info.business_type !== undefined) updateData.business_type = info.business_type;

      client.from('organizations').update(updateData).eq('id', currentOrgId).then();
    }
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

    const client = supabaseService.getClient();
    if (client && currentOrgId) {
      const dbSettings: Database['public']['Tables']['organization_settings']['Update'] = { updated_at: new Date().toISOString() };
      if (newSettings.logo_url !== undefined) dbSettings.logo_url = newSettings.logo_url;
      if (newSettings.cover_url !== undefined) dbSettings.cover_url = newSettings.cover_url;
      if (newSettings.primary_color !== undefined) dbSettings.primary_color = newSettings.primary_color;
      if (newSettings.secondary_color !== undefined) dbSettings.secondary_color = newSettings.secondary_color;
      if (newSettings.accent_color !== undefined) dbSettings.accent_color = newSettings.accent_color;
      if (newSettings.text_color !== undefined) dbSettings.text_color = newSettings.text_color;
      if (newSettings.address !== undefined) dbSettings.address = newSettings.address;
      if (newSettings.phone !== undefined) dbSettings.phone = newSettings.phone;
      if (newSettings.whatsapp_number !== undefined) dbSettings.whatsapp_number = newSettings.whatsapp_number;
      if (newSettings.whatsapp_message !== undefined) dbSettings.whatsapp_message = newSettings.whatsapp_message;
      if (newSettings.email !== undefined) dbSettings.email = newSettings.email;
      if (newSettings.instagram_url !== undefined) dbSettings.instagram_url = newSettings.instagram_url;
      if (newSettings.facebook_url !== undefined) dbSettings.facebook_url = newSettings.facebook_url;
      if (newSettings.tiktok_url !== undefined) dbSettings.tiktok_url = newSettings.tiktok_url;
      if (newSettings.youtube_url !== undefined) dbSettings.youtube_url = newSettings.youtube_url;
      if (newSettings.website_url !== undefined) dbSettings.website_url = newSettings.website_url;
      if (newSettings.currency !== undefined) dbSettings.currency = newSettings.currency;
      if (newSettings.slogan !== undefined) dbSettings.slogan = newSettings.slogan;
      if (newSettings.active_modules !== undefined) dbSettings.active_modules = newSettings.active_modules as unknown as Database['public']['Tables']['organization_settings']['Update']['active_modules'];

      client.from('organization_settings').update(dbSettings).eq('organization_id', currentOrgId).then();
    }
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

  // Category Operations (Supabase PostgreSQL como Fuente Única de Verdad - Fase 4.1)
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    try {
      if (!supabaseService.isConfigured) {
        const localCat: Category = {
          ...cat,
          id: `cat-${Date.now()}`,
          organization_id: cat.organization_id || currentOrgId,
          created_at: new Date().toISOString()
        };
        setCategories(prev => [...prev, localCat]);
        return;
      }

      const created = await createCategoryUseCase.execute({
        organizationId: cat.organization_id || currentOrgId,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.image_url,
        icon: cat.icon,
        type: cat.type,
        displayOrder: cat.display_order,
        isActive: cat.is_active,
      });

      const legacyCategory: Category = {
        id: created.id,
        organization_id: created.organizationId,
        name: created.name,
        description: created.description || undefined,
        image_url: created.imageUrl || undefined,
        icon: created.icon || undefined,
        type: created.type,
        display_order: created.displayOrder,
        is_active: created.isActive,
        created_at: created.createdAt,
      };

      setCategories(prev => [...prev, legacyCategory]);
    } catch (error) {
      logger.error('Error en addCategory:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    try {
      if (!supabaseService.isConfigured) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
        return;
      }

      const result = await updateCategoryUseCase.execute(id, {
        name: updated.name,
        description: updated.description,
        imageUrl: updated.image_url,
        icon: updated.icon,
        type: updated.type,
        displayOrder: updated.display_order,
        isActive: updated.is_active,
      });

      setCategories(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                name: result.name,
                description: result.description || undefined,
                image_url: result.imageUrl || undefined,
                icon: result.icon || undefined,
                type: result.type,
                display_order: result.displayOrder,
                is_active: result.isActive,
              }
            : c
        )
      );
    } catch (error) {
      logger.error('Error en updateCategory:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      if (!supabaseService.isConfigured) {
        setCategories(prev => prev.filter(c => c.id !== id));
        return;
      }

      await deleteCategoryUseCase.execute(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      logger.error('Error en deleteCategory:', error);
      throw error;
    }
  };

  const reorderCategories = async (reordered: Category[]) => {
    try {
      const itemsToUpdate = reordered.map((cat, idx) => ({
        id: cat.id,
        displayOrder: idx + 1,
      }));

      // Actualización optimista de estado local
      setCategories(prev => {
        const otherOrgsCats = prev.filter(c => c.organization_id !== currentOrgId);
        return [...otherOrgsCats, ...reordered.map((cat, idx) => ({ ...cat, display_order: idx + 1 }))];
      });

      if (supabaseService.isConfigured) {
        await reorderCategoriesUseCase.execute(currentOrgId, itemsToUpdate);
      }
    } catch (error) {
      logger.error('Error en reorderCategories:', error);
      throw error;
    }
  };

  // Product Operations (Fase 4.2 - Supabase PostgreSQL)
  const addProduct = async (prod: Omit<Product, 'id' | 'created_at'>) => {
    try {
      if (!supabaseService.isConfigured) {
        const localProd: Product = {
          ...prod,
          id: `prod-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setProducts(prev => [localProd, ...prev]);

        // MED-01: Registrar movimiento INITIAL_LOAD en Kárdex si se registra con stock > 0
        if (localProd.stock > 0) {
          const initMovement: InventoryMovement = {
            id: `mov-${Date.now()}`,
            organization_id: localProd.organization_id || currentOrgId,
            product_id: localProd.id,
            product_name: localProd.name,
            movement_type: 'INITIAL_LOAD',
            quantity: localProd.stock,
            stock_before: 0,
            stock_after: localProd.stock,
            unit_cost: localProd.cost_price || 0,
            total_cost: Number(((localProd.cost_price || 0) * localProd.stock).toFixed(2)),
            reference_type: 'INITIAL_INVENTORY',
            reason: 'Carga inicial al registrar producto',
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
          };
          setInventoryMovements(prev => [initMovement, ...prev]);
          inventoryDataSource.recordInitialLoad(initMovement as any);
        }
        return;
      }

      const result = await createProductUseCase.execute({
        organizationId: prod.organization_id || currentOrgId,
        categoryId: prod.category_id || null,
        name: prod.name,
        sku: prod.sku,
        costPrice: prod.cost_price,
        description: prod.description,
        price: prod.price,
        promoPrice: prod.promo_price ?? null,
        stock: prod.stock,
        trackInventory: prod.track_inventory,
        allowNegativeStock: prod.allow_negative_stock,
        barcode: prod.barcode,
        isActive: prod.is_active,
        isFeatured: prod.is_featured,
        displayOrder: prod.display_order,
        images: prod.images,
        categoryName: prod.category_name,
      });

      const category = categories.find(c => c.id === result.categoryId);
      const legacy: Product = typeof (result as any).toLegacy === 'function'
        ? (result as any).toLegacy()
        : {
            id: result.id,
            organization_id: result.organizationId,
            category_id: result.categoryId || undefined,
            name: result.name,
            sku: result.sku,
            cost_price: result.costPrice,
            description: result.description,
            price: result.price,
            promo_price: result.promoPrice ?? undefined,
            stock: result.stock,
            track_inventory: result.trackInventory,
            allow_negative_stock: result.allowNegativeStock,
            barcode: result.barcode,
            is_active: result.isActive,
            is_featured: result.isFeatured,
            display_order: result.displayOrder,
            images: result.images,
            category_name: category?.name || prod.category_name,
            created_at: result.createdAt || new Date().toISOString(),
            updated_at: result.updatedAt,
          };

      if (!legacy.category_name && (category?.name || prod.category_name)) {
        legacy.category_name = category?.name || prod.category_name;
      }

      setProducts(prev => [legacy, ...prev]);
    } catch (error) {
      logger.error('Error en addProduct:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    try {
      if (!supabaseService.isConfigured) {
        // HIGH-01: No permitir mutación directa de stock al editar producto (inmutabilidad Kárdex)
        const { stock: _omittedStock, ...safeUpdated } = updated as any;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...safeUpdated, updated_at: new Date().toISOString() } : p));
        return;
      }

      const result = await updateProductUseCase.execute(id, {
        name: updated.name,
        sku: updated.sku,
        costPrice: updated.cost_price,
        description: updated.description,
        categoryId: updated.category_id !== undefined ? updated.category_id : undefined,
        price: updated.price,
        promoPrice: updated.promo_price,
        // HIGH-01: El stock no se pasa para edición directa
        trackInventory: updated.track_inventory,
        allowNegativeStock: updated.allow_negative_stock,
        barcode: updated.barcode,
        isActive: updated.is_active,
        isFeatured: updated.is_featured,
        displayOrder: updated.display_order,
        images: updated.images,
        categoryName: updated.category_name,
      });

      const category = categories.find(c => c.id === result.categoryId);

      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                name: result.name,
                sku: result.sku !== undefined ? result.sku : p.sku,
                cost_price: result.costPrice !== undefined ? result.costPrice : p.cost_price,
                description: result.description,
                category_id: result.categoryId || undefined,
                price: result.price,
                promo_price: result.promoPrice ?? undefined,
                stock: result.stock,
                track_inventory: result.trackInventory !== undefined ? result.trackInventory : p.track_inventory,
                allow_negative_stock: result.allowNegativeStock !== undefined ? result.allowNegativeStock : p.allow_negative_stock,
                barcode: result.barcode !== undefined ? result.barcode : p.barcode,
                is_active: result.isActive,
                is_featured: result.isFeatured,
                display_order: result.displayOrder,
                images: result.images,
                category_name: category?.name || updated.category_name || p.category_name,
                updated_at: result.updatedAt || new Date().toISOString(),
              }
            : p
        )
      );
    } catch (error) {
      logger.error('Error en updateProduct:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (!supabaseService.isConfigured) {
        setProducts(prev => prev.filter(p => p.id !== id));
        return;
      }

      await deleteProductUseCase.execute(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      logger.error('Error en deleteProduct:', error);
      throw error;
    }
  };

  const toggleProductActive = async (id: string) => {
    try {
      const current = products.find(p => p.id === id);
      if (!current) return;
      const nextActive = !current.is_active;

      // Optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: nextActive } : p));

      if (supabaseService.isConfigured) {
        await toggleProductActiveUseCase.execute(id, nextActive);
      }
    } catch (error) {
      logger.error('Error en toggleProductActive:', error);
      // Revert optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
      throw error;
    }
  };

  const toggleProductFeatured = async (id: string) => {
    try {
      const current = products.find(p => p.id === id);
      if (!current) return;
      const nextFeatured = !current.is_featured;

      // Optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: nextFeatured } : p));

      if (supabaseService.isConfigured) {
        await toggleProductFeaturedUseCase.execute(id, nextFeatured);
      }
    } catch (error) {
      logger.error('Error en toggleProductFeatured:', error);
      // Revert optimistic update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !p.is_featured } : p));
      throw error;
    }
  };

  const reorderProducts = async (reordered: Product[]) => {
    try {
      const itemsToUpdate = reordered.map((prod, idx) => ({
        id: prod.id,
        displayOrder: idx + 1,
      }));

      // Optimistic update
      setProducts(prev => {
        const otherOrgsProds = prev.filter(p => p.organization_id !== currentOrgId);
        return [...otherOrgsProds, ...reordered.map((prod, idx) => ({ ...prod, display_order: idx + 1 }))];
      });

      if (supabaseService.isConfigured) {
        await reorderProductsUseCase.execute(currentOrgId, itemsToUpdate);
      }
    } catch (error) {
      logger.error('Error en reorderProducts:', error);
      throw error;
    }
  };

  // Service Operations (Fase 4.3)
  const addService = async (serv: Omit<ServiceItem, 'id' | 'created_at'>) => {
    try {
      if (supabaseService.isConfigured) {
        const createdEntity = await createServiceUseCase.execute({
          organizationId: serv.organization_id || currentOrgId,
          categoryId: serv.category_id || null,
          name: serv.name,
          description: serv.description,
          price: serv.price,
          promoPrice: serv.promo_price ?? null,
          durationMinutes: serv.duration_minutes,
          imageUrl: serv.image_url ?? null,
          isActive: serv.is_active,
          isFeatured: serv.is_featured,
          displayOrder: serv.display_order,
          categoryName: serv.category_name,
        });

        const category = categories.find(c => c.id === createdEntity.categoryId);
        const legacy = createdEntity instanceof ServiceModel
          ? createdEntity.toLegacy()
          : {
              id: createdEntity.id,
              organization_id: createdEntity.organizationId,
              category_id: createdEntity.categoryId || undefined,
              name: createdEntity.name,
              description: createdEntity.description,
              price: createdEntity.price,
              promo_price: createdEntity.promoPrice !== null ? createdEntity.promoPrice : undefined,
              duration_minutes: createdEntity.durationMinutes,
              image_url: createdEntity.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
              is_active: createdEntity.isActive,
              is_featured: createdEntity.isFeatured,
              display_order: createdEntity.displayOrder,
              category_name: createdEntity.categoryName || category?.name,
              created_at: createdEntity.createdAt || new Date().toISOString(),
              updated_at: createdEntity.updatedAt,
            };

        setServices(prev => [legacy, ...prev]);
      } else {
        const newServ: ServiceItem = {
          ...serv,
          id: `serv-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setServices(prev => [newServ, ...prev]);
      }
    } catch (error) {
      logger.error('Error en addService:', error);
      throw error;
    }
  };

  const updateService = async (id: string, updated: Partial<ServiceItem>) => {
    try {
      if (supabaseService.isConfigured) {
        const updatedEntity = await updateServiceUseCase.execute(id, {
          categoryId: updated.category_id !== undefined ? (updated.category_id || null) : undefined,
          name: updated.name,
          description: updated.description,
          price: updated.price,
          promoPrice: updated.promo_price !== undefined ? updated.promo_price : undefined,
          durationMinutes: updated.duration_minutes,
          imageUrl: updated.image_url !== undefined ? updated.image_url : undefined,
          isActive: updated.is_active,
          isFeatured: updated.is_featured,
          displayOrder: updated.display_order,
          categoryName: updated.category_name,
        });

        const category = categories.find(c => c.id === updatedEntity.categoryId);
        const legacy = updatedEntity instanceof ServiceModel
          ? updatedEntity.toLegacy()
          : {
              id: updatedEntity.id,
              organization_id: updatedEntity.organizationId,
              category_id: updatedEntity.categoryId || undefined,
              name: updatedEntity.name,
              description: updatedEntity.description,
              price: updatedEntity.price,
              promo_price: updatedEntity.promoPrice !== null ? updatedEntity.promoPrice : undefined,
              duration_minutes: updatedEntity.durationMinutes,
              image_url: updatedEntity.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
              is_active: updatedEntity.isActive,
              is_featured: updatedEntity.isFeatured,
              display_order: updatedEntity.displayOrder,
              category_name: updatedEntity.categoryName || category?.name,
              created_at: updatedEntity.createdAt || new Date().toISOString(),
              updated_at: updatedEntity.updatedAt,
            };

        setServices(prev => prev.map(s => s.id === id ? legacy : s));
      } else {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated, updated_at: new Date().toISOString() } : s));
      }
    } catch (error) {
      logger.error('Error en updateService:', error);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      if (supabaseService.isConfigured) {
        await deleteServiceUseCase.execute(id);
      }
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      logger.error('Error en deleteService:', error);
      throw error;
    }
  };

  const toggleServiceActive = async (id: string) => {
    const currentService = services.find(s => s.id === id);
    if (!currentService) return;
    const newActiveState = !currentService.is_active;

    // Optimistic update
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: newActiveState } : s));

    try {
      if (supabaseService.isConfigured) {
        await toggleServiceActiveUseCase.execute(id, newActiveState);
      }
    } catch (error) {
      logger.error('Error en toggleServiceActive:', error);
      // Revert optimistic update
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !newActiveState } : s));
      throw error;
    }
  };

  const toggleServiceFeatured = async (id: string) => {
    const currentService = services.find(s => s.id === id);
    if (!currentService) return;
    const newFeaturedState = !currentService.is_featured;

    // Optimistic update
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_featured: newFeaturedState } : s));

    try {
      if (supabaseService.isConfigured) {
        await toggleServiceFeaturedUseCase.execute(id, newFeaturedState);
      }
    } catch (error) {
      logger.error('Error en toggleServiceFeatured:', error);
      // Revert optimistic update
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_featured: !newFeaturedState } : s));
      throw error;
    }
  };

  const reorderServices = async (reordered: ServiceItem[]) => {
    try {
      const itemsToUpdate = reordered.map((serv, idx) => ({
        id: serv.id,
        displayOrder: idx + 1,
      }));

      // Optimistic update
      setServices(prev => {
        const otherOrgsServs = prev.filter(s => s.organization_id !== currentOrgId);
        return [...otherOrgsServs, ...reordered.map((serv, idx) => ({ ...serv, display_order: idx + 1 }))];
      });

      if (supabaseService.isConfigured) {
        await reorderServicesUseCase.execute(currentOrgId, itemsToUpdate);
      }
    } catch (error) {
      logger.error('Error en reorderServices:', error);
      throw error;
    }
  };

  const addCustomer = async (custData: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
    try {
      if (supabaseService.isConfigured) {
        const created = await createCustomerUseCase.execute({
          organizationId: custData.organization_id || currentOrgId,
          name: custData.name,
          phone: custData.phone,
          email: custData.email,
          address: custData.address,
          reference: custData.reference,
          notes: custData.notes,
          totalOrders: custData.total_orders ?? 0,
          totalSpent: custData.total_spent ?? 0,
          lastOrderDate: custData.last_order_date,
          lastOrderNumber: custData.last_order_number,
        });

        const legacy = created instanceof CustomerModel ? created.toLegacy() : {
          id: created.id,
          organization_id: created.organizationId,
          name: created.name,
          phone: created.phone,
          email: created.email,
          address: created.address,
          reference: created.reference,
          notes: created.notes,
          total_orders: created.totalOrders,
          total_spent: created.totalSpent,
          last_order_date: created.lastOrderDate,
          last_order_number: created.lastOrderNumber,
          created_at: created.createdAt || new Date().toISOString(),
          updated_at: created.updatedAt,
        };

        setCustomers(prev => [legacy, ...prev]);
        return legacy;
      } else {
        const newCust: Customer = {
          ...custData,
          id: `cust-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setCustomers(prev => [newCust, ...prev]);
        return newCust;
      }
    } catch (error) {
      logger.error('Error en addCustomer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updated: Partial<Customer>): Promise<Customer | void> => {
    const previous = customers.find(c => c.id === id);
    if (!previous) return;

    // Optimistic update
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated, updated_at: new Date().toISOString() } : c));

    try {
      if (supabaseService.isConfigured) {
        const result = await updateCustomerUseCase.execute(id, {
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          reference: updated.reference,
          notes: updated.notes,
          totalOrders: updated.total_orders,
          totalSpent: updated.total_spent,
          lastOrderDate: updated.last_order_date,
          lastOrderNumber: updated.last_order_number,
        });

        const legacy = result instanceof CustomerModel ? result.toLegacy() : {
          id: result.id,
          organization_id: result.organizationId,
          name: result.name,
          phone: result.phone,
          email: result.email,
          address: result.address,
          reference: result.reference,
          notes: result.notes,
          total_orders: result.totalOrders,
          total_spent: result.totalSpent,
          last_order_date: result.lastOrderDate,
          last_order_number: result.lastOrderNumber,
          created_at: result.createdAt,
          updated_at: result.updatedAt,
        };

        setCustomers(prev => prev.map(c => c.id === id ? legacy : c));
        return legacy;
      }
    } catch (error) {
      logger.error('Error en updateCustomer:', error);
      if (previous) {
        setCustomers(prev => prev.map(c => c.id === id ? previous : c));
      }
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const previous = customers.find(c => c.id === id);

    // Optimistic update
    setCustomers(prev => prev.filter(c => c.id !== id));

    try {
      if (supabaseService.isConfigured) {
        await deleteCustomerUseCase.execute(id);
      }
    } catch (error) {
      logger.error('Error en deleteCustomer:', error);
      if (previous) {
        setCustomers(prev => [...prev, previous]);
      }
      throw error;
    }
  };

  const refreshCustomers = async (): Promise<void> => {
    if (!currentOrgId) return;
    setCustomersLoading(true);
    try {
      if (supabaseService.isConfigured) {
        const results = await getCustomersUseCase.execute(currentOrgId);
        const mapped: Customer[] = results.map(cust =>
          cust instanceof CustomerModel ? cust.toLegacy() : {
            id: cust.id,
            organization_id: cust.organizationId,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            reference: cust.reference,
            notes: cust.notes,
            total_orders: cust.totalOrders,
            total_spent: cust.totalSpent,
            last_order_date: cust.lastOrderDate,
            last_order_number: cust.lastOrderNumber,
            created_at: cust.createdAt,
            updated_at: cust.updatedAt,
          }
        );
        setCustomers(mapped);
      }
    } catch (err) {
      logger.error('Error refrescando clientes:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const getCustomerProfile360 = async (customerId: string): Promise<CustomerProfile360 | null> => {
    try {
      if (supabaseService.isConfigured && currentOrgId) {
        return await getCustomerProfile360UseCase.execute(currentOrgId, customerId);
      }
      return null;
    } catch (error) {
      logger.error('Error en getCustomerProfile360:', error);
      return null;
    }
  };

  const findOrCreateCustomer = async (params: CreateCustomerParams): Promise<Customer> => {
    try {
      if (supabaseService.isConfigured) {
        const result = await findOrCreateCustomerUseCase.execute(params);
        const legacy = result instanceof CustomerModel ? result.toLegacy() : {
          id: result.id,
          organization_id: result.organizationId,
          name: result.name,
          phone: result.phone,
          email: result.email,
          address: result.address,
          reference: result.reference,
          notes: result.notes,
          total_orders: result.totalOrders,
          total_spent: result.totalSpent,
          last_order_date: result.lastOrderDate,
          last_order_number: result.lastOrderNumber,
          created_at: result.createdAt || new Date().toISOString(),
          updated_at: result.updatedAt,
        };
        setCustomers(prev => {
          const exists = prev.some(c => c.id === legacy.id);
          return exists ? prev.map(c => c.id === legacy.id ? legacy : c) : [legacy, ...prev];
        });
        return legacy;
      } else {
        return await addCustomer({
          organization_id: params.organizationId,
          name: params.name,
          phone: params.phone,
          email: params.email,
          address: params.address,
          reference: params.reference,
          notes: params.notes,
          total_orders: params.totalOrders ?? 0,
          total_spent: params.totalSpent ?? 0,
        });
      }
    } catch (error) {
      logger.error('Error en findOrCreateCustomer:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const previous = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    // Fase 12: Reversión compensatoria de inventario en Libro Mayor Inmutable (idempotente)
    if (status === 'CANCELLED' && previous && previous.status !== 'CANCELLED') {
      (previous.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          setProducts(prev => prev.map(p => p.id === item.product_id ? { ...p, stock: restoredStock } : p));
        }
      });

      restoreStockUseCase.execute({
        organizationId: previous.organization_id,
        orderId,
        reason: `Restauración por cancelación de Pedido ${previous.order_number}`,
        userId: currentUser.id,
      }).then(res => {
        logger.info('Reversión compensatoria de inventario procesada:', { orderId, idempotent: res.idempotent });
        refreshInventoryMovements();
      }).catch(err => {
        logger.error('Error en reversión de inventario al cancelar pedido:', err);
      });

      // Descontar métricas del cliente (LTV y conteo de órdenes válidas) garantizando aislamiento multi-tenant
      const targetCustomer = customers.find(c =>
        c.organization_id === previous.organization_id && (
          (previous.customer_id && c.id === previous.customer_id) ||
          (normalizePhone(c.phone) === normalizePhone(previous.customer_phone))
        )
      );
      if (targetCustomer) {
        const newTotalOrders = Math.max(0, (targetCustomer.total_orders || 1) - 1);
        const newTotalSpent = Math.max(0, Number(targetCustomer.total_spent || 0) - Number(previous.total || 0));
        setCustomers(prev => prev.map(c => c.id === targetCustomer.id ? {
          ...c,
          total_orders: newTotalOrders,
          total_spent: newTotalSpent,
        } : c));

        if (supabaseService.isConfigured) {
          updateCustomerUseCase.execute(targetCustomer.id, {
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
          }).catch(err => logger.warning('Error ajustando LTV de cliente tras cancelación de pedido:', err));
        }
      }
    }

    if (supabaseService.isConfigured) {
      try {
        await updateOrderStatusUseCase.execute(orderId, status);
        logger.info('Estado de pedido actualizado en Supabase PostgreSQL:', { orderId, status });
      } catch (error) {
        logger.error('Error al actualizar estado en Supabase:', error);
        if (previous) {
          setOrders(prev => prev.map(o => o.id === orderId ? previous : o));
        }
        throw error;
      }
    }
  };

  const deleteOrder = async (orderId: string) => {
    const previous = orders.find(o => o.id === orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));

    if (supabaseService.isConfigured) {
      try {
        await deleteOrderUseCase.execute(orderId);
        logger.info('Pedido eliminado en Supabase PostgreSQL:', { orderId });
      } catch (error) {
        logger.error('Error al eliminar pedido en Supabase:', error);
        if (previous) {
          setOrders(prev => [...prev, previous]);
        }
        throw error;
      }
    }
  };

  const refreshOrders = async () => {
    if (!currentOrgId) return;
    try {
      setOrdersLoading(true);
      if (supabaseService.isConfigured) {
        const data = await getOrdersUseCase.execute(currentOrgId);
        const mapped = data.map(item =>
          item instanceof OrderModel ? item.toLegacy() : OrderModel.fromLegacy(item as any).toLegacy()
        );
        setOrders(mapped);
      }
    } catch (err) {
      logger.error('Error refrescando pedidos:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'order_number' | 'created_at'>): Order => {
    const count = orders.filter(o => o.organization_id === orderData.organization_id).length + 101;
    const orderNumber = `#000${String(count).padStart(3, '0')}`;
    const orderId = crypto.randomUUID();
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      order_number: orderNumber,
      created_at: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);

    const validItems = (orderData.items || []).filter(item => item.product_id && item.quantity > 0);

    // Si Supabase NO está configurado, procesar deducción atómica en almacén local
    if (!supabaseService.isConfigured && validItems.length > 0) {
      validItems.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          setProducts(prev => prev.map(p => p.id === item.product_id ? { ...p, stock: newStock } : p));
        }
      });

      deductStockUseCase.execute({
        organizationId: orderData.organization_id,
        orderId,
        items: validItems.map(it => ({
          productId: it.product_id,
          productName: it.product_name || 'Producto',
          quantity: it.quantity,
        })),
        userId: currentUser.id,
        reason: `Venta confirmada por Pedido ${orderNumber}`,
      }).then(res => {
        logger.info('Deducción local de inventario procesada:', { orderId, idempotent: res.idempotent });
        refreshInventoryMovements();
      }).catch(err => {
        logger.error('Error en deducción local de inventario:', err);
      });
    }

    // Auto-create or update customer record for this business (Fase 5 & Fase 8 - Captura Atómica de Clientes)
    let linkedCustomerId: string | undefined = undefined;
    if (orderData.customer_name && orderData.customer_phone) {
      const canonicalPhone = normalizePhone(orderData.customer_phone);
      // Vinculación rápida en memoria
      const existing = customers.find(
        c => c.organization_id === orderData.organization_id && normalizePhone(c.phone) === canonicalPhone
      );
      if (existing) {
        linkedCustomerId = existing.id;
      }
    }

    // Persistir Pedido y Artículos en Supabase PostgreSQL con captura atómica de cliente
    if (supabaseService.isConfigured) {
      const persistOrderWithCustomer = async () => {
        let finalCustomerId = linkedCustomerId;
        if (orderData.customer_name && orderData.customer_phone) {
          const canonicalPhone = normalizePhone(orderData.customer_phone);
          try {
            const customerResult = await findOrCreateCustomer({
              organizationId: orderData.organization_id,
              name: orderData.customer_name,
              phone: canonicalPhone,
              address: orderData.delivery_address || undefined,
              reference: orderData.customer_reference || undefined,
              notes: orderData.notes || undefined,
              totalOrders: 1,
              totalSpent: orderData.total,
              lastOrderDate: new Date().toISOString(),
              lastOrderNumber: orderNumber,
            });
            if (customerResult) {
              finalCustomerId = customerResult.id;
            }
          } catch (custErr) {
            logger.warning('Aviso en captura atómica de cliente para pedido:', custErr);
          }
        }

        // 1. Persistencia estricta del Pedido y Order Items primero
        const res = await createOrderUseCase.execute({
          id: orderId,
          organizationId: orderData.organization_id,
          customerId: finalCustomerId,
          customerName: orderData.customer_name,
          customerPhone: orderData.customer_phone,
          orderNumber: orderNumber,
          status: orderData.status,
          subtotal: orderData.subtotal,
          discount: orderData.discount || 0,
          deliveryFee: orderData.delivery_fee || 0,
          total: orderData.total,
          deliveryType: orderData.delivery_type,
          deliveryAddress: orderData.delivery_address,
          customerReference: orderData.customer_reference,
          paymentMethod: orderData.payment_method,
          notes: orderData.notes,
          items: (orderData.items || []).map(it => ({
            id: it.id,
            productId: it.product_id,
            productName: it.product_name,
            productImage: it.product_image,
            quantity: it.quantity,
            unitPrice: it.unit_price,
            subtotal: it.subtotal,
          })),
        });

        const legacy = res instanceof OrderModel ? res.toLegacy() : null;
        if (legacy) {
          setOrders(prev => prev.map(o => o.id === orderId ? legacy : o));
        }
        logger.info('Pedido persistido en Supabase PostgreSQL con captura atómica:', { orderId, customerId: finalCustomerId });

        // 2. CRIT-02: Deducción atómica mediante RPC SOLO después de que el pedido y sus artículos están persistidos en PostgreSQL
        if (validItems.length > 0) {
          try {
            const deductRes = await deductStockUseCase.execute({
              organizationId: orderData.organization_id,
              orderId,
              items: validItems.map(it => ({
                productId: it.product_id,
                productName: it.product_name || 'Producto',
                quantity: it.quantity,
              })),
              userId: currentUser.id,
              reason: `Venta confirmada por Pedido ${orderNumber}`,
            });
            logger.info('Deducción atómica de inventario procesada exitosamente en Supabase:', {
              orderId,
              idempotent: deductRes.idempotent,
            });
            await refreshInventoryMovements();
            await refreshProducts();
          } catch (deductErr) {
            logger.error('Error en deducción atómica de inventario en Supabase:', deductErr);
          }
        }
      };

      persistOrderWithCustomer().catch(err => {
        logger.error('Error persistiendo pedido a Supabase:', err);
      });
    }

    // Trigger real-time sound alert and toast notification
    playOrderAlertSound();
    setLatestNewOrderNotification(newOrder);

    return newOrder;
  };

  const createAppointment = async (aptData: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> => {
    // 1. Control de concurrencia atómica en memoria: Clave única por organización, fecha, hora y especialista
    const staffKey = (aptData.staff_name || 'global').trim().toLowerCase();
    const lockKey = `${aptData.organization_id}_${aptData.appointment_date}_${aptData.start_time}_${staffKey}`;

    if (inFlightAppointmentLocks.has(lockKey)) {
      throw new Error('Conflicto de concurrencia: Ya existe una solicitud procesando este mismo horario simultáneamente.');
    }

    // 2. Validación inmediata de solapamiento en el estado activo actual
    const isOverlapping = appointments.some(a => {
      if (a.organization_id !== aptData.organization_id) return false;
      if (a.appointment_date !== aptData.appointment_date) return false;
      if (a.status === 'CANCELLED') return false;
      if (aptData.staff_name && a.staff_name && aptData.staff_name.trim().toLowerCase() !== a.staff_name.trim().toLowerCase()) {
        return false;
      }
      return a.start_time < aptData.end_time && a.end_time > aptData.start_time;
    });

    if (isOverlapping) {
      throw new Error('Conflicto de horario: El horario seleccionado ya se encuentra ocupado.');
    }

    inFlightAppointmentLocks.add(lockKey);

    const aptId = crypto.randomUUID();
    const newApt: Appointment = {
      ...aptData,
      id: aptId,
      created_at: new Date().toISOString()
    };

    // Optimistic UI update
    setAppointments(prev => [newApt, ...prev]);

    try {
      // Relación con Clientes: Vincular o registrar cliente en el CRM de forma atómica
      if (aptData.customer_phone && aptData.customer_name) {
        const canonicalPhone = normalizePhone(aptData.customer_phone);
        const aptNotes = aptData.notes ? `Cita ${aptData.appointment_date}: ${aptData.notes}` : undefined;
        try {
          await findOrCreateCustomer({
            organizationId: aptData.organization_id,
            name: aptData.customer_name.trim(),
            phone: canonicalPhone,
            email: aptData.customer_email?.trim() || undefined,
            notes: aptNotes,
            totalOrders: 0,
            totalSpent: 0,
          });
        } catch (custErr) {
          logger.warning('Aviso al vincular cliente de cita en CRM:', custErr);
        }
      }

      // Persistir en Supabase PostgreSQL (public.appointments) con protección de Trigger Atómico
      if (supabaseService.isConfigured) {
        try {
          const res = await createAppointmentUseCase.execute({
            id: aptId,
            organizationId: aptData.organization_id,
            serviceId: aptData.service_id || null,
            serviceName: aptData.service_name,
            servicePrice: aptData.service_price,
            durationMinutes: aptData.duration_minutes,
            staffId: aptData.staff_id || null,
            staffName: aptData.staff_name || null,
            customerName: aptData.customer_name,
            customerPhone: aptData.customer_phone,
            customerEmail: aptData.customer_email || null,
            appointmentDate: aptData.appointment_date,
            startTime: aptData.start_time,
            endTime: aptData.end_time,
            status: aptData.status as any,
            notes: aptData.notes || null,
          });
          const legacy = res instanceof AppointmentModel ? res.toLegacy() : null;
          if (legacy) {
            setAppointments(prev => prev.map(a => a.id === aptId ? legacy : a));
          }
          logger.info('Cita persistida en Supabase PostgreSQL:', { aptId });
        } catch (err) {
          logger.error('Error persistiendo cita en Supabase, aplicando rollback:', err);
          setAppointments(prev => prev.filter(a => a.id !== aptId));
          throw err;
        }
      }

      return newApt;
    } finally {
      inFlightAppointmentLocks.delete(lockKey);
    }
  };

  const updateAppointment = async (aptId: string, data: Partial<Appointment>) => {
    const previous = appointments.find(a => a.id === aptId);
    if (!previous) return;

    const updated: Appointment = {
      ...previous,
      ...data,
      id: aptId,
    };

    setAppointments(prev => prev.map(a => a.id === aptId ? updated : a));

    if (supabaseService.isConfigured) {
      try {
        await updateAppointmentUseCase.execute(aptId, {
          serviceId: data.service_id,
          serviceName: data.service_name,
          servicePrice: data.service_price,
          durationMinutes: data.duration_minutes,
          staffId: data.staff_id,
          staffName: data.staff_name,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerEmail: data.customer_email,
          appointmentDate: data.appointment_date,
          startTime: data.start_time,
          endTime: data.end_time,
          status: data.status as any,
          notes: data.notes,
        });
        logger.info('Cita actualizada en Supabase PostgreSQL:', { aptId });
      } catch (error) {
        logger.error('Error actualizando cita en Supabase, aplicando rollback:', error);
        setAppointments(prev => prev.map(a => a.id === aptId ? previous : a));
        throw error;
      }
    }
  };

  const updateAppointmentStatus = async (aptId: string, status: Appointment['status']) => {
    const previous = appointments.find(a => a.id === aptId);
    if (!previous) return;

    setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status } : a));

    if (supabaseService.isConfigured) {
      try {
        await updateAppointmentStatusUseCase.execute(aptId, status as any);
        logger.info('Estado de cita actualizado en Supabase:', { aptId, status });
      } catch (error) {
        logger.error('Error actualizando estado de cita en Supabase, aplicando rollback:', error);
        setAppointments(prev => prev.map(a => a.id === aptId ? previous : a));
        throw error;
      }
    }
  };

  const deleteAppointment = async (aptId: string) => {
    const previous = appointments.find(a => a.id === aptId);
    if (!previous) return;

    setAppointments(prev => prev.filter(a => a.id !== aptId));

    if (supabaseService.isConfigured) {
      try {
        await deleteAppointmentUseCase.execute(aptId);
        logger.info('Cita eliminada de Supabase PostgreSQL:', { aptId });
      } catch (error) {
        logger.error('Error eliminando cita en Supabase, aplicando rollback:', error);
        setAppointments(prev => [previous, ...prev]);
        throw error;
      }
    }
  };

  const checkAppointmentOverlap = async (
    date: string,
    startTime: string,
    endTime: string,
    staffName?: string,
    excludeAppointmentId?: string,
    organizationId?: string
  ): Promise<boolean> => {
    const orgIdToUse = organizationId || currentOrgId;
    if (supabaseService.isConfigured && orgIdToUse) {
      try {
        return await checkAppointmentOverlapUseCase.execute(
          orgIdToUse,
          date,
          startTime,
          endTime,
          staffName,
          excludeAppointmentId
        );
      } catch (err) {
        logger.warning('Aviso al comprobar solapamiento en Supabase, recurriendo a estado local:', err);
      }
    }

    // Comprobación de respaldo con citas en memoria
    return appointments.some(apt => {
      if (apt.organization_id !== orgIdToUse) return false;
      if (apt.status === 'CANCELLED') return false;
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.appointment_date !== date) return false;
      if (staffName && apt.staff_name && staffName.trim().toLowerCase() !== apt.staff_name.trim().toLowerCase()) {
        return false;
      }
      return apt.start_time < endTime && apt.end_time > startTime;
    });
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
        inventoryMovements,
        inventoryLoading,
        adjustInventory,
        refreshInventoryMovements,
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
        customersLoading,
        refreshCustomers,
        getCustomerProfile360,
        findOrCreateCustomer,
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
        ordersLoading,
        refreshOrders,
        deleteOrder,
        updateOrderStatus,
        createOrder,
        appointmentsLoading,
        refreshAppointments,
        createAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        checkAppointmentOverlap,
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
