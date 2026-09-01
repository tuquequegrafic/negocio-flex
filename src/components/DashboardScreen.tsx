import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../core/utils/formatters';
import { 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Users, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Settings,
  ChevronRight,
  Plus,
  Volume2,
  Bell,
  MessageCircle,
  Package,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Zap,
  Store,
  MapPin,
  Check
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { 
    currentOrg, 
    orders, 
    products, 
    categories, 
    customers, 
    galleryItems,
    setActiveView,
    updateOrderStatus,
    createOrder,
    playOrderAlertSound
  } = useApp();

  const [simulating, setSimulating] = useState(false);

  const orgOrders = orders.filter(o => o.organization_id === currentOrg.id);
  const orgProducts = products.filter(p => p.organization_id === currentOrg.id);
  const orgCategories = categories.filter(c => c.organization_id === currentOrg.id);
  const orgCustomers = customers.filter(c => c.organization_id === currentOrg.id);
  const orgGallery = galleryItems.filter(g => g.organization_id === currentOrg.id);

  // Financial calculations
  const totalSales = orgOrders.reduce((acc, curr) => acc + curr.total, 0);
  const pendingOrders = orgOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const deliveredOrders = orgOrders.filter(o => o.status === 'DELIVERED');
  const activeProducts = orgProducts.filter(p => p.is_active);

  const settings = currentOrg.settings || {
    primary_color: '#B91C1C',
    secondary_color: '#DC2626',
    currency: 'S/',
    whatsapp_number: '51987654321',
    whatsapp_message: '¡Hola! Quisiera realizar un pedido.',
    logo_url: '',
    cover_url: '',
    address: '',
    phone: '',
    slogan: '',
    active_modules: {
      products: true,
      services: true,
      categories: true,
      orders: true,
      appointments: true,
      delivery: true,
      promotions: true,
      gallery: true,
      whatsapp: true,
      notifications: true,
      analytics: true
    }
  };

  const currency = settings.currency || 'S/';

  // Function to simulate a real-time order from a customer
  const handleSimulateCustomerOrder = () => {
    if (orgProducts.length === 0) return;
    setSimulating(true);

    const randomProduct = orgProducts[Math.floor(Math.random() * orgProducts.length)];
    const mockNames = ['Carlos Mendoza', 'Sofía Benavides', 'Mateo Alarcón', 'Valeria Quispe', 'Diego Navarro'];
    const mockPhones = ['+51 987 112 233', '+51 945 667 788', '+51 912 334 455', '+51 998 445 566'];
    const mockAddresses = ['Calle Los Cedros 340', 'Av. Dos de Mayo 890, Dpto 401', 'Av. Primavera 1200'];

    const chosenName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const chosenPhone = mockPhones[Math.floor(Math.random() * mockPhones.length)];
    const chosenAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];

    setTimeout(() => {
      createOrder({
        organization_id: currentOrg.id,
        customer_name: chosenName,
        customer_phone: chosenPhone,
        delivery_address: chosenAddress,
        customer_reference: 'Portón azul frente al parque',
        delivery_type: 'DELIVERY',
        payment_method: 'YAPE / PLIN',
        items: [
          {
            product_id: randomProduct.id,
            name: randomProduct.name,
            price: randomProduct.price,
            quantity: 2,
            subtotal: randomProduct.price * 2
          }
        ],
        subtotal: randomProduct.price * 2,
        delivery_fee: 5.00,
        total: (randomProduct.price * 2) + 5.00,
        status: 'PENDING',
        notes: 'Por favor avisar al llegar por WhatsApp.'
      });
      setSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Top Identity & Welcome Banner */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${settings.primary_color || '#0F172A'} 0%, ${settings.secondary_color || '#1E293B'} 100%)`
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={currentOrg.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white shrink-0" 
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shrink-0">
                {currentOrg.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Panel de Propietario
                </span>
                <span className="text-xs text-white/80 hidden sm:inline">ID: {currentOrg.slug}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1 text-white">{currentOrg.name}</h1>
              <p className="text-xs sm:text-sm text-white/85 mt-0.5 max-w-xl">
                {settings.slogan || currentOrg.description || 'Gestión centralizada de catálogo, pedidos, clientes y sucursales'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => playOrderAlertSound()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold backdrop-blur-md border border-white/20 text-xs transition-all shadow-xs"
              title="Probar sonido de notificación de pedido"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Probar Sonido</span>
            </button>

            <button
              onClick={handleSimulateCustomerOrder}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50"
              title="Simular un pedido entrante de cliente en tiempo real"
            >
              <Zap className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Simulando...' : 'Simular Pedido'}</span>
            </button>

            <button
              onClick={() => setActiveView('client_catalog')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Ver mi página web</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 2. Pending Orders Attention Banner (If any pending) */}
      {pendingOrders.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-pulse-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-950">
                  ¡Tienes {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de atención!
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Acción requerida
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Revisa y cambia el estado para notificar automáticamente al cliente por WhatsApp.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('orders')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
          >
            <span>Atender Pedidos Ahora</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Primary KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Sales */}
        <div 
          onClick={() => setActiveView('orders')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ventas Totales</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(totalSales, currency)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {deliveredOrders.length} pedidos completados
            </div>
          </div>
        </div>

        {/* Orders */}
        <div 
          onClick={() => setActiveView('orders')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pedidos</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {orgOrders.length}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
              <Clock className="w-3.5 h-3.5" /> {pendingOrders.length} pendientes
            </div>
          </div>
        </div>

        {/* Customers */}
        <div 
          onClick={() => setActiveView('customers')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clientes</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {orgCustomers.length}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Base de datos activa
            </div>
          </div>
        </div>

        {/* Products */}
        <div 
          onClick={() => setActiveView('products')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Productos Activos</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {activeProducts.length} <span className="text-xs text-slate-400 font-normal">/ {orgProducts.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" /> {orgCategories.length} categorías
            </div>
          </div>
        </div>

      </div>

      {/* 4. Main Two Columns: Recent Orders Feed + Fast Navigation / Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Orders Feed (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Pedidos en Vivo</h3>
                  <p className="text-xs text-slate-400">Sincronización en tiempo real con la tienda pública</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveView('orders')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Ver todos ({orgOrders.length}) <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {orgOrders.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400">No hay pedidos registrados en este negocio todavía.</p>
                  <button
                    onClick={handleSimulateCustomerOrder}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    <Zap className="w-3.5 h-3.5" /> Simular Pedido de Prueba
                  </button>
                </div>
              ) : (
                orgOrders.slice(0, 5).map(order => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
                    PREPARING: 'bg-purple-50 text-purple-700 border-purple-200',
                    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  return (
                    <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.order_number}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${statusColors[order.status] || 'bg-slate-100'}`}>
                            {order.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700">
                          <strong>{order.customer_name}</strong> • {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'} • {order.delivery_type === 'PICKUP' ? 'Recojo' : 'Delivery'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-sm font-black font-mono text-slate-900">
                          {formatCurrency(order.total, currency)}
                        </span>
                        
                        <button
                          onClick={() => setActiveView('orders')}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Gestionar
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Quick Navigation & Business Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Action Navigation Buttons */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Accesos Rápidos</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveView('products')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Productos</span>
                  <span className="text-[10px] text-slate-400">{orgProducts.length} items</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('categories')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Categorías</span>
                  <span className="text-[10px] text-slate-400">{orgCategories.length} grupos</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('orders')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pedidos</span>
                  <span className="text-[10px] text-slate-400">{orgOrders.length} registrados</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('customers')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Clientes</span>
                  <span className="text-[10px] text-slate-400">{orgCustomers.length} clientes</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('gallery')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Galería</span>
                  <span className="text-[10px] text-slate-400">{orgGallery.length} fotos</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('settings')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Configuración</span>
                  <span className="text-[10px] text-slate-400">Datos & Marca</span>
                </div>
              </button>
            </div>

          </div>

          {/* WhatsApp Direct Channel Card */}
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Canal de Pedidos WhatsApp</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Activo
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Número receptor:</span>
                <span className="font-mono text-sm text-emerald-400 font-black">+{settings.whatsapp_number}</span>
              </div>
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title="Abrir chat de prueba"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => setActiveView('settings')}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              Configurar Datos de Negocio
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
