import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateWhatsAppLink } from '../core/utils/formatters';
import { 
  ShoppingBag, 
  Sparkles, 
  Calendar, 
  Phone, 
  MapPin, 
  Clock, 
  Check, 
  MessageCircle, 
  Plus, 
  Minus, 
  Trash2,
  ArrowRight,
  ChevronLeft,
  Search,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Globe,
  Share2,
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BrandLogo } from './BrandLogo';

export const ClientPortalScreen: React.FC = () => {
  const { 
    currentOrg, 
    products, 
    services, 
    categories, 
    businessHours,
    galleryItems,
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart,
    createOrder,
    createAppointment,
    setActiveView 
  } = useApp();

  const settings = currentOrg.settings!;
  const modules = settings.active_modules;
  const currency = settings.currency || 'S/';

  const orgProducts = products.filter(p => p.organization_id === currentOrg.id && p.is_active);
  const orgServices = services.filter(s => s.organization_id === currentOrg.id && s.is_active);
  const orgCategories = categories.filter(c => c.organization_id === currentOrg.id && c.is_active);
  const orgHours = businessHours.filter(h => h.organization_id === currentOrg.id);
  const orgGallery = galleryItems.filter(g => g.organization_id === currentOrg.id);

  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'booking' | 'gallery' | 'hours' | 'cart'>(
    modules.products ? 'products' : modules.services ? 'services' : 'gallery'
  );
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Checkout states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'YAPE_PLIN' | 'CASH' | 'CARD'>('YAPE_PLIN');
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  // Booking Flow states
  const [selectedServiceId, setSelectedServiceId] = useState<string>(orgServices[0]?.id || '');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('15:00');
  const [bookingCompleted, setBookingCompleted] = useState<any | null>(null);

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.promo_price || item.product.price) * item.quantity, 0);
  const deliveryFee = modules.delivery ? 6.00 : 0.00;
  const finalTotal = cartTotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || cart.length === 0) return;

    const newOrder = createOrder({
      organization_id: currentOrg.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      status: 'PENDING',
      subtotal: cartTotal,
      discount: 0,
      delivery_fee: deliveryFee,
      total: finalTotal,
      delivery_address: deliveryAddress || undefined,
      payment_method: paymentMethod,
      notes: notes || undefined,
      items: cart.map(i => ({
        id: `item-${Date.now()}-${i.product.id}`,
        order_id: '',
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.promo_price || i.product.price,
        subtotal: (i.product.promo_price || i.product.price) * i.quantity
      }))
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    clearCart();
    setOrderCompleted(newOrder);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedServiceId) return;

    const serv = orgServices.find(s => s.id === selectedServiceId);
    if (!serv) return;

    const newApt = createAppointment({
      organization_id: currentOrg.id,
      service_id: serv.id,
      service_name: serv.name,
      service_price: serv.price,
      duration_minutes: serv.duration_minutes,
      customer_name: customerName,
      customer_phone: customerPhone,
      appointment_date: bookingDate,
      start_time: bookingTime,
      end_time: '16:00',
      status: 'PENDING',
      notes: notes || undefined
    });

    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.6 }
    });

    setBookingCompleted(newApt);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 font-sans text-slate-800">
      
      {/* Return to Admin Switcher Header */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Vista interactiva de cliente final para: <strong>{currentOrg.name}</strong></span>
        </div>
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Volver al Panel
        </button>
      </div>

      {/* Hero Header with Tenant Theme & Colors */}
      <div 
        className="rounded-3xl overflow-hidden shadow-xl text-white relative"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${settings.cover_url}) center/cover no-repeat`
        }}
      >
        <div className="p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 min-h-[220px]">
          <div className="flex items-center gap-4">
            <img
              src={settings.logo_url}
              alt={currentOrg.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-lg bg-white shrink-0"
            />
            <div>
              <span className="text-xs bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {currentOrg.business_type.toUpperCase()}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white leading-tight">{currentOrg.name}</h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-lg">{settings.slogan || currentOrg.description}</p>
              
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {settings.address}</span>
              </div>
            </div>
          </div>

          {modules.whatsapp && (
            <a
              href={generateWhatsAppLink(
                settings.whatsapp_number,
                `¡Hola! Estoy viendo el catálogo de ${currentOrg.name} y me gustaría recibir información.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all self-start sm:self-end"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle className="w-5 h-5" /> Chat WhatsApp
            </a>
          )}
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/15 px-4 flex gap-2 overflow-x-auto text-xs font-bold">
          {modules.products && (
            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'products' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              Productos & Platos
            </button>
          )}

          {modules.services && (
            <button
              onClick={() => setActiveTab('services')}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'services' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              Servicios & Precios
            </button>
          )}

          {modules.appointments && (
            <button
              onClick={() => setActiveTab('booking')}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'booking' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              Reservar Cita / Turno
            </button>
          )}

          {modules.gallery && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'gallery' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              Galería de Fotos
            </button>
          )}

          {modules.hours && (
            <button
              onClick={() => setActiveTab('hours')}
              className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'hours' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              Horarios & Ubicación
            </button>
          )}

          {modules.orders && (
            <button
              onClick={() => setActiveTab('cart')}
              className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ml-auto whitespace-nowrap ${
                activeTab === 'cart' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mi Carrito</span>
              {cart.length > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-black text-slate-900 shadow-xs"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Views */}

      {/* 1. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dynamic Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCat('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCat === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({orgProducts.length})
              </button>

              {orgCategories.filter(c => c.type === 'PRODUCT').map(c => {
                const count = orgProducts.filter(p => p.category_id === c.id).length;
                const isSelected = selectedCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={isSelected ? { backgroundColor: settings.primary_color } : {}}
                  >
                    <span>{c.icon || '🏷️'}</span>
                    <span>{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⭐ Featured Products Highlight (If any exist and not filtering heavily) */}
          {selectedCat === 'ALL' && !search && orgProducts.some(p => p.is_featured) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-amber-500">⭐</span>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Destacados de la casa</h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Recomendados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orgProducts.filter(p => p.is_featured).map(p => (
                  <div 
                    key={`feat-${p.id}`}
                    className="bg-gradient-to-br from-amber-500/10 via-white to-white p-4 rounded-3xl border-2 border-amber-200 shadow-sm flex gap-4 items-center group relative overflow-hidden"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute top-1 left-1 text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md shadow-2xs">
                        ⭐ TOP
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        {p.category_name || 'Especial'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                      
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 font-mono">
                            {formatCurrency(p.promo_price || p.price, currency)}
                          </span>
                          {p.promo_price && (
                            <span className="text-[11px] text-slate-400 line-through font-mono">
                              {formatCurrency(p.price, currency)}
                            </span>
                          )}
                        </div>

                        {modules.orders && (
                          <button
                            onClick={() => addToCart(p, 1)}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs active:scale-95 transition-all flex items-center gap-1"
                            style={{ backgroundColor: settings.primary_color }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Pedir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Catalog Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-slate-900">
                {selectedCat === 'ALL' ? 'Todos los Productos' : 'Artículos de la Categoría'}
              </h3>
              <span className="text-xs text-slate-400">
                {orgProducts
                  .filter(p => (selectedCat === 'ALL' || p.category_id === selectedCat) && 
                               (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())))
                  .length} resultados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {orgProducts
                .filter(p => {
                  const matchesCat = selectedCat === 'ALL' || p.category_id === selectedCat;
                  const matchesSearch = !search || 
                    p.name.toLowerCase().includes(search.toLowerCase()) || 
                    p.description.toLowerCase().includes(search.toLowerCase());
                  return matchesCat && matchesSearch;
                })
                .sort((a, b) => (a.display_order || 999) - (b.display_order || 999))
                .map(p => (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group">
                  <div>
                    <div className="h-44 bg-slate-100 relative overflow-hidden">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.category_name && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-xl">
                          {p.category_name}
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-xl shadow-xs">
                          ⭐ Destacado
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{p.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                      
                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-base font-black text-slate-900 font-mono">
                          {formatCurrency(p.promo_price || p.price, currency)}
                        </span>
                        {p.promo_price && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {formatCurrency(p.price, currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    {modules.orders ? (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: settings.primary_color }}
                      >
                        <Plus className="w-4 h-4" /> Agregar al Pedido
                      </button>
                    ) : (
                      <a
                        href={generateWhatsAppLink(
                          settings.whatsapp_number,
                          `Hola, estoy interesado en comprar "${p.name}" (${formatCurrency(p.price, currency)}) en ${currentOrg.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgServices.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex gap-4 items-start">
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                  
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(s.price, currency)}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} min
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setActiveTab('booking');
                    }}
                    className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Agendar este servicio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BOOKING TAB */}
      {activeTab === 'booking' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
          {bookingCompleted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">¡Reserva Solicitada con Éxito!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tu cita para <strong>{bookingCompleted.service_name}</strong> el día <strong>{bookingCompleted.appointment_date}</strong> a las <strong>{bookingCompleted.start_time}</strong> ha sido registrada.
              </p>

              <a
                href={generateWhatsAppLink(
                  settings.whatsapp_number,
                  `¡Hola! Acabo de registrar mi cita en su app para "${bookingCompleted.service_name}" el día ${bookingCompleted.appointment_date} a las ${bookingCompleted.start_time}. Mi nombre es ${bookingCompleted.customer_name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                <MessageCircle className="w-4 h-4" /> Enviar Confirmación a WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reservar Cita en {currentOrg.name}</h2>
                <p className="text-xs text-slate-500">Selecciona el servicio y fecha de tu preferencia.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio a Reservar</label>
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-medium"
                >
                  {orgServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.price, currency)} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Deseada</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tu Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ej: Lucía Ramírez"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tu Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 mt-4"
                style={{ backgroundColor: settings.primary_color }}
              >
                Confirmar y Solicitar Cita
              </button>
            </form>
          )}
        </div>
      )}

      {/* 4. CART & CHECKOUT TAB */}
      {activeTab === 'cart' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
          {orderCompleted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">¡Pedido Realizado con Éxito!</h2>
              <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-800 font-bold inline-block">
                {orderCompleted.order_number}
              </span>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hemos recibido tu pedido por un total de <strong>{formatCurrency(orderCompleted.total, currency)}</strong>. El negocio iniciará su preparación enseguida.
              </p>

              <a
                href={generateWhatsAppLink(
                  settings.whatsapp_number,
                  `¡Hola ${currentOrg.name}! Acabo de realizar el pedido ${orderCompleted.order_number} por un total de ${formatCurrency(orderCompleted.total, currency)}. Mi nombre es ${orderCompleted.customer_name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                <MessageCircle className="w-4 h-4" /> Enviar Pedido a WhatsApp del Local
              </a>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Tu carrito está vacío</h3>
              <p className="text-xs text-slate-400">Agrega productos desde el menú o catálogo para realizar tu pedido.</p>
              <button
                onClick={() => setActiveTab('products')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Resumen de tu Pedido</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cart.map(item => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.product.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {formatCurrency(item.product.promo_price || item.product.price, currency)} c/u
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => addToCart(item.product, -1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(item.product, 1)}
                          className="px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-slate-900 w-16 text-right">
                        {formatCurrency((item.product.promo_price || item.product.price) * item.quantity, currency)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Datos para la Entrega</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de Entrega (Opcional si es para recoger)</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Calle, número, departamento o referencia..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Método de Pago Preferido</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'YAPE_PLIN', label: 'Yape / Plin' },
                      { key: 'CASH', label: 'Efectivo' },
                      { key: 'CARD', label: 'Tarjeta' },
                    ].map(pm => (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setPaymentMethod(pm.key as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          paymentMethod === pm.key
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total summary */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal productos:</span>
                  <span>{formatCurrency(cartTotal, currency)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Costo de Delivery estimado:</span>
                    <span>{formatCurrency(deliveryFee, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Final:</span>
                  <span>{formatCurrency(finalTotal, currency)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-95"
                style={{ backgroundColor: settings.primary_color }}
              >
                Completar Pedido ({formatCurrency(finalTotal, currency)})
              </button>
            </form>
          )}
        </div>
      )}

      {/* 5. GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" style={{ color: settings.primary_color }} />
                <span>Galería de Fotos e Instalaciones</span>
              </h2>
              <p className="text-xs text-slate-500">Conoce más sobre la experiencia y el ambiente de {currentOrg.name}.</p>
            </div>

            {orgGallery.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No hay fotos publicadas en la galería</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {orgGallery.map((item, idx) => (
                  <div key={item.id} className="group relative rounded-2xl overflow-hidden shadow-2xs border border-slate-100 bg-slate-100 h-52">
                    <img
                      src={item.image_url}
                      alt={item.title || 'Foto de galería'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                        <span className="text-white text-xs font-bold drop-shadow-sm">{item.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. HOURS & LOCATION TAB */}
      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horarios */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: settings.primary_color }} />
                <span>Horarios de Atención</span>
              </h2>
              <p className="text-xs text-slate-500">Días y horas de apertura de nuestro local.</p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {orgHours.map(hour => (
                <div key={hour.day_of_week} className="py-2.5 flex justify-between items-center">
                  <span className="font-medium text-slate-700">{hour.day_name}</span>
                  <span className={`font-bold ${hour.is_closed ? 'text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full' : 'text-slate-900 font-mono'}`}>
                    {hour.is_closed ? 'Cerrado' : `${hour.open_time} - ${hour.close_time}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ubicación y Contacto */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: settings.primary_color }} />
                <span>Ubicación y Contacto</span>
              </h2>
              <p className="text-xs text-slate-500">Visítanos o comunícate con nosotros.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 block">Dirección Principal</span>
                <p className="text-slate-600 font-medium flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 block">Teléfonos de Contacto</span>
                <p className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{settings.phone}</span>
                </p>
              </div>

              {modules.whatsapp && (
                <a
                  href={generateWhatsAppLink(settings.whatsapp_number, settings.whatsapp_message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4" /> Hablar con nosotros por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-200 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {settings.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-pink-600 hover:bg-pink-50 transition-colors shadow-2xs"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {settings.facebook_url && (
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs"
            >
              <Facebook className="w-4 h-4" />
            </a>
          )}
          {settings.tiktok_url && (
            <a
              href={settings.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Share2 className="w-4 h-4" />
            </a>
          )}
          {settings.youtube_url && (
            <a
              href={settings.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 transition-colors shadow-2xs"
            >
              <Video className="w-4 h-4" />
            </a>
          )}
          {settings.website_url && (
            <a
              href={settings.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-100">
          <p>© {new Date().getFullYear()} {currentOrg.name}. Todos los derechos reservados.</p>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-[11px] text-slate-600 font-medium">
            <span>Impulsado por</span>
            <BrandLogo variant="compact" size="xs" />
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      {modules.whatsapp && (
        <a
          href={generateWhatsAppLink(settings.whatsapp_number, settings.whatsapp_message)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-bounce-short"
          style={{ backgroundColor: '#25D366' }}
          title="Escríbenos por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      )}

    </div>
  );
};
