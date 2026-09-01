import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateWhatsAppLink, isBusinessOpenNow } from '../core/utils/formatters';
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
  Video,
  X,
  ExternalLink,
  Navigation,
  Lock,
  AlertCircle,
  Copy,
  Info,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TutorialModal } from './TutorialModal';
import { InstallAppModal } from './InstallAppModal';
import { BrandLogo } from './BrandLogo';

interface PublicBusinessPageProps {
  businessSlug?: string;
  onBackToAdmin?: () => void;
}

export const PublicBusinessPage: React.FC<PublicBusinessPageProps> = ({ 
  businessSlug, 
  onBackToAdmin 
}) => {
  const { 
    currentOrg, 
    organizations,
    products, 
    services, 
    categories, 
    businessHours,
    galleryItems,
    cart, 
    addToCart, 
    updateCartQuantity,
    removeFromCart, 
    clearCart,
    createOrder,
    createAppointment,
    setActiveView 
  } = useApp();

  // Find business by slug if provided, otherwise default to currentOrg
  const targetOrg = businessSlug 
    ? organizations.find(o => o.slug === businessSlug || o.id === businessSlug) 
    : currentOrg;

  // Selected Photo for Lightbox Modal
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Product for Details Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Filter state
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'booking' | 'gallery' | 'hours' | 'cart'>('products');

  // Checkout states for Phase 8 Flow (Items -> Customer Info -> Summary -> Confirmation)
  const [cartStep, setCartStep] = useState<'ITEMS' | 'CUSTOMER_INFO' | 'SUMMARY' | 'CONFIRMATION'>('ITEMS');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'YAPE_PLIN' | 'CASH' | 'CARD'>('YAPE_PLIN');
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  // Booking Flow states
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('15:00');
  const [bookingCompleted, setBookingCompleted] = useState<any | null>(null);

  // If business does NOT exist
  if (!targetOrg) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs">
            😕
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Negocio no encontrado</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              La página o enlace <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-[11px]">/r/{businessSlug}</code> que estás buscando no existe o ya no está disponible.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onBackToAdmin) onBackToAdmin();
                else setActiveView('dashboard');
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If business is deactivated (is_active = false)
  if (targetOrg.is_active === false) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs">
            🔒
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Página Temporalmente No Disponible</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              El negocio <strong>{targetOrg.name}</strong> se encuentra temporalmente fuera de servicio o en mantenimiento.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onBackToAdmin) onBackToAdmin();
                else setActiveView('dashboard');
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              Regresar al Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const settings = targetOrg.settings || {
    organization_id: targetOrg.id,
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    primary_color: '#B91C1C',
    secondary_color: '#DC2626',
    text_color: '#111827',
    accent_color: '#F59E0B',
    address: 'Av. Principal 123',
    phone: '+51 987 654 321',
    whatsapp_number: '51987654321',
    whatsapp_message: '¡Hola! Quisiera realizar una consulta.',
    email: 'contacto@negocio.com',
    currency: 'S/',
    active_modules: {
      products: true,
      services: false,
      categories: true,
      orders: true,
      appointments: false,
      delivery: true,
      promotions: true,
      gallery: true,
      whatsapp: true,
      hours: true,
      location: true,
      testimonials: false,
      social: true,
      notifications: true,
      analytics: true
    }
  };

  const modules = settings.active_modules;
  const currency = settings.currency || 'S/';

  const orgProducts = products.filter(p => p.organization_id === targetOrg.id && p.is_active);
  const orgServices = services.filter(s => s.organization_id === targetOrg.id && s.is_active);
  const orgCategories = categories.filter(c => c.organization_id === targetOrg.id && c.is_active);
  const orgHours = businessHours.filter(h => h.organization_id === targetOrg.id);
  const orgGallery = galleryItems.filter(g => g.organization_id === targetOrg.id);

  // Set default tab on load based on active modules
  useEffect(() => {
    if (modules.products) setActiveTab('products');
    else if (modules.services) setActiveTab('services');
    else if (modules.gallery) setActiveTab('gallery');
    else setActiveTab('hours');
  }, [targetOrg.id]);

  useEffect(() => {
    if (orgServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(orgServices[0].id);
    }
  }, [orgServices]);

  // Status de abierto/cerrado en tiempo real
  const openStatus = isBusinessOpenNow(orgHours);

  // Cart calculations (Phase 8)
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.promo_price || item.product.price) * item.quantity, 0);
  const totalCartUnits = cart.reduce((acc, item) => acc + item.quantity, 0);
  const deliveryFee = (deliveryType === 'DELIVERY' && modules.delivery) ? 7.00 : 0.00;
  const finalTotal = cartTotal + deliveryFee;

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/r/${targetOrg.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Step 2 -> Step 3: Valida datos del cliente
  const handleProceedToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) return;
    setCartStep('SUMMARY');
  };

  // Step 3 -> Enviar Pedido (Supabase PRIMERO, luego WhatsApp y Confirmación)
  const handleFinalOrderSubmit = () => {
    if (cart.length === 0 || !customerName.trim() || !customerPhone.trim()) return;

    // 1. Guardar primero en Supabase / Context con snapshot de precios y nombres
    const newOrder = createOrder({
      organization_id: targetOrg.id,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      status: 'PENDING',
      subtotal: cartTotal,
      discount: 0,
      delivery_fee: deliveryFee,
      total: finalTotal,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      customer_reference: deliveryType === 'DELIVERY' && customerReference.trim() ? customerReference.trim() : undefined,
      payment_method: paymentMethod,
      notes: notes.trim() ? notes.trim() : undefined,
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

    // 2. Construir mensaje de WhatsApp formateado con emojis
    const itemsFormatted = cart.map(i => {
      const icon = i.product.name.toLowerCase().includes('pollo') ? '🍗' : 
                   i.product.name.toLowerCase().includes('pizza') ? '🍕' :
                   i.product.name.toLowerCase().includes('bebida') || i.product.name.toLowerCase().includes('cola') || i.product.name.toLowerCase().includes('agua') ? '🥤' :
                   i.product.name.toLowerCase().includes('postre') || i.product.name.toLowerCase().includes('torta') ? '🍰' : '🛍️';
      return `${icon} *${i.product.name}* x${i.quantity}\n${currency} ${((i.product.promo_price || i.product.price) * i.quantity).toFixed(2)}`;
    }).join('\n\n');

    const whatsappMessage = 
`Hola, quiero realizar un pedido en *${targetOrg.name}*:

${itemsFormatted}

---------------------------------
Subtotal: ${currency} ${cartTotal.toFixed(2)}
${deliveryType === 'DELIVERY' ? `🚚 Delivery: ${currency} ${deliveryFee.toFixed(2)}` : `🏪 Recojo en local: Gratis`}
*TOTAL: ${currency} ${finalTotal.toFixed(2)}*

👤 *Cliente:* ${customerName.trim()}
📞 *Teléfono:* ${customerPhone.trim()}
${deliveryType === 'DELIVERY' ? `📍 *Dirección:* ${deliveryAddress.trim()}` : `🏪 *Método:* Recojo en local`}
${deliveryType === 'DELIVERY' && customerReference.trim() ? `📝 *Referencia:* ${customerReference.trim()}\n` : ''}${deliveryType === 'DELIVERY' ? `🚚 *Modalidad:* Delivery\n` : `🏪 *Modalidad:* Recojo en tienda\n`}${notes.trim() ? `💬 *Observaciones:* ${notes.trim()}\n` : ''}🏷️ *Pedido:* ${newOrder.order_number}`;

    // 3. Abrir WhatsApp automáticamente al número del negocio
    if (settings.whatsapp_number) {
      const waUrl = generateWhatsAppLink(settings.whatsapp_number, whatsappMessage);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    // 4. Celebración y avance a pantalla de confirmación
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 }
    });

    clearCart();
    setOrderCompleted(newOrder);
    setCartStep('CONFIRMATION');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedServiceId) return;

    const serv = orgServices.find(s => s.id === selectedServiceId);
    if (!serv) return;

    const newApt = createAppointment({
      organization_id: targetOrg.id,
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
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-20 selection:bg-slate-900 selection:text-white">
      
      {/* 1. TOP ADMIN BAR (Only for preview / admin navigation) */}
      <header className="bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5 max-w-xl truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-300">Página Pública Activa:</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
            /r/{targetOrg.slug}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            title="Instalar tienda en pantalla de inicio de tu celular"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-all border border-emerald-500/30"
            title="¿Cómo comprar? Guía paso a paso"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">¿Cómo comprar?</span>
          </button>

          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            title="Copiar enlace para compartir"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar URL'}</span>
          </button>

          <button
            onClick={() => {
              if (onBackToAdmin) onBackToAdmin();
              else setActiveView('dashboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver al Panel</span>
          </button>
        </div>
      </header>

      {/* 2. COVER HEADER & BRAND BANNER */}
      <div className="relative">
        {/* Cover Photo */}
        <div 
          className="h-56 sm:h-72 w-full bg-slate-900 relative overflow-hidden bg-center bg-cover"
          style={{
            backgroundImage: `url(${settings.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        {/* Brand Card / Profile Overlap */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-20 sm:-mt-24 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            
            {/* Logo & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="relative shrink-0">
                <img
                  src={settings.logo_url}
                  alt={targetOrg.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                />
                <span 
                  className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1`}
                  style={{ backgroundColor: openStatus.isOpen ? '#10B981' : '#EF4444' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {openStatus.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {targetOrg.business_type}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {openStatus.text} {openStatus.details && `• ${openStatus.details}`}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {targetOrg.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  {settings.slogan || targetOrg.description}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-500">
                  {settings.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {settings.address}
                    </span>
                  )}
                  {settings.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {settings.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (WhatsApp & Llamar) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto shrink-0">
              {modules.whatsapp && settings.whatsapp_number && (
                <a
                  href={generateWhatsAppLink(
                    settings.whatsapp_number,
                    `¡Hola! Estoy viendo la página web de ${targetOrg.name} y quisiera hacer una consulta.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir por WhatsApp</span>
                </a>
              )}

              {settings.phone && (
                <a
                  href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>Llamar</span>
                </a>
              )}

              <button
                onClick={handleCopyShareLink}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Compartir enlace"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS BAR */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
          {modules.products && (
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'products'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'products' ? { backgroundColor: settings.primary_color } : {}}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Menú / Productos</span>
            </button>
          )}

          {modules.services && (
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'services'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'services' ? { backgroundColor: settings.primary_color } : {}}
            >
              <Sparkles className="w-4 h-4" />
              <span>Servicios</span>
            </button>
          )}

          {modules.appointments && (
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'booking'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'booking' ? { backgroundColor: settings.primary_color } : {}}
            >
              <Calendar className="w-4 h-4" />
              <span>Reservar Cita</span>
            </button>
          )}

          {modules.gallery && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'gallery'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'gallery' ? { backgroundColor: settings.primary_color } : {}}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Galería</span>
            </button>
          )}

          {modules.hours && (
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'hours'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'hours' ? { backgroundColor: settings.primary_color } : {}}
            >
              <Clock className="w-4 h-4" />
              <span>Horarios & Mapa</span>
            </button>
          )}

          {modules.orders && (
            <button
              onClick={() => setActiveTab('cart')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
                activeTab === 'cart'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cart.length > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-black text-slate-900"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT TABS */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        
        {/* ======================= TAB: PRODUCTS & MENU ======================= */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            
            {/* Search & Category Filter */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en la carta o catálogo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕ Limpiar
                  </button>
                )}
              </div>

              {/* Dynamic Category Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCat('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={isSelected ? { backgroundColor: settings.primary_color } : {}}
                    >
                      <span>{c.icon || '📂'}</span>
                      <span>{c.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ⭐ FEATURED PRODUCTS HIGHLIGHT */}
            {selectedCat === 'ALL' && !search && orgProducts.some(p => p.is_featured) && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-lg">⭐</span>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Especialidades Destacadas</h2>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Recomendados de la casa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {orgProducts.filter(p => p.is_featured).map(p => (
                    <div 
                      key={`feat-${p.id}`}
                      className="bg-gradient-to-br from-amber-500/10 via-white to-white p-4 sm:p-5 rounded-3xl border-2 border-amber-300 shadow-sm flex gap-4 items-center group relative overflow-hidden"
                    >
                      <div 
                        onClick={() => setSelectedProduct(p)}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative cursor-pointer"
                      >
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-1 left-1 text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md shadow-2xs">
                          ⭐ TOP
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          {p.category_name || 'Especial'}
                        </span>
                        <h3 
                          onClick={() => setSelectedProduct(p)}
                          className="font-bold text-sm sm:text-base text-slate-900 truncate cursor-pointer hover:text-indigo-600"
                        >
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                              {formatCurrency(p.promo_price || p.price, currency)}
                            </span>
                            {p.promo_price && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                {formatCurrency(p.price, currency)}
                              </span>
                            )}
                          </div>

                          {modules.orders ? (
                            <button
                              onClick={() => addToCart(p, 1)}
                              className="px-3.5 py-2 rounded-xl font-bold text-xs text-white shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                              style={{ backgroundColor: settings.primary_color }}
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar
                            </button>
                          ) : (
                            <a
                              href={generateWhatsAppLink(
                                settings.whatsapp_number,
                                `Hola, quiero pedir "${p.name}" (${formatCurrency(p.promo_price || p.price, currency)}) en ${targetOrg.name}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl font-bold text-xs text-white flex items-center gap-1"
                              style={{ backgroundColor: '#25D366' }}
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Pedir
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FULL CATALOG GRID */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-black text-slate-900">
                  {selectedCat === 'ALL' ? 'Nuestra Carta / Catálogo Completo' : 'Platos y Productos de la Categoría'}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {orgProducts
                    .filter(p => (selectedCat === 'ALL' || p.category_id === selectedCat) && 
                                 (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())))
                    .length} ítems disponibles
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
                  <div 
                    key={p.id} 
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image & Badges */}
                      <div 
                        onClick={() => setSelectedProduct(p)}
                        className="h-44 sm:h-48 bg-slate-100 relative overflow-hidden cursor-pointer"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {p.category_name && (
                          <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl">
                            {p.category_name}
                          </span>
                        )}
                        {p.is_featured && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                            ⭐ Destacado
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5 space-y-2">
                        <h3 
                          onClick={() => setSelectedProduct(p)}
                          className="font-bold text-sm text-slate-900 leading-snug cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                        
                        <div className="flex items-baseline gap-2 pt-2">
                          <span className="text-lg font-black text-slate-900 font-mono">
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

                    {/* Bottom Action */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
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
                            `Hola, estoy interesado en comprar "${p.name}" (${formatCurrency(p.promo_price || p.price, currency)}) en ${targetOrg.name}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-xs"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ======================= TAB: SERVICES ======================= */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {orgServices.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex gap-4 items-start">
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-100"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {s.category_name || 'Servicio'}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{s.description}</p>
                    
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {formatCurrency(s.price, currency)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {s.duration_minutes} min
                      </span>
                    </div>

                    {modules.appointments ? (
                      <button
                        onClick={() => {
                          setSelectedServiceId(s.id);
                          setActiveTab('booking');
                        }}
                        className="mt-2 text-xs font-bold flex items-center gap-1 hover:underline"
                        style={{ color: settings.primary_color }}
                      >
                        Agendar cita para este servicio <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <a
                        href={generateWhatsAppLink(
                          settings.whatsapp_number,
                          `Hola, deseo consultar por el servicio "${s.name}" (${formatCurrency(s.price, currency)}) en ${targetOrg.name}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB: BOOKING ======================= */}
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
                  <h2 className="text-lg font-bold text-slate-900">Reservar Cita en {targetOrg.name}</h2>
                  <p className="text-xs text-slate-500">Selecciona el servicio y fecha de tu preferencia.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio a Reservar</label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 font-medium"
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
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Deseada</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300"
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
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300"
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
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 mt-4"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  Confirmar y Solicitar Cita
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================= TAB: CART & CHECKOUT (FASE 8) ======================= */}
        {activeTab === 'cart' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
            
            {/* WIZARD STEPPER */}
            {cartStep !== 'CONFIRMATION' && cart.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 text-center text-xs">
                <div className={`p-2 rounded-xl font-bold transition-all ${cartStep === 'ITEMS' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'}`}>
                  1. Mi Pedido
                </div>
                <div className={`p-2 rounded-xl font-bold transition-all ${cartStep === 'CUSTOMER_INFO' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'}`}>
                  2. Tus Datos
                </div>
                <div className={`p-2 rounded-xl font-bold transition-all ${cartStep === 'SUMMARY' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'}`}>
                  3. Resumen
                </div>
              </div>
            )}

            {/* STEP 4 / CONFIRMATION: PEDIDO RECIBIDO */}
            {cartStep === 'CONFIRMATION' && orderCompleted ? (
              <div className="text-center py-8 space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs animate-bounce-short">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">¡Excelente!</span>
                  <h2 className="text-2xl font-black text-slate-900">PEDIDO RECIBIDO</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tu pedido ya ha sido registrado en el sistema. Nos comunicaremos contigo para confirmar los detalles y la preparación.
                  </p>
                </div>

                {/* Order Summary Pill */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-md mx-auto space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <span className="text-xs font-bold text-slate-500">Número de pedido:</span>
                    <span className="font-mono text-sm bg-slate-900 text-white px-3 py-0.5 rounded-lg font-black">
                      {orderCompleted.order_number}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Cliente:</span>
                    <span className="font-bold text-slate-800">{orderCompleted.customer_name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Modalidad:</span>
                    <span className="font-bold text-slate-800">
                      {orderCompleted.delivery_type === 'DELIVERY' ? '🚚 Delivery' : '🏪 Recojo en local'}
                    </span>
                  </div>

                  {orderCompleted.delivery_address && (
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Dirección:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{orderCompleted.delivery_address}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-extrabold text-slate-900 text-base">
                    <span>Total a pagar:</span>
                    <span className="font-mono">{formatCurrency(orderCompleted.total, currency)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2 max-w-md mx-auto">
                  {settings.whatsapp_number && (
                    <a
                      href={generateWhatsAppLink(
                        settings.whatsapp_number,
                        `¡Hola ${targetOrg.name}! Acabo de enviar el pedido ${orderCompleted.order_number} por un total de ${currency} ${orderCompleted.total.toFixed(2)}. Mi nombre es ${orderCompleted.customer_name}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle className="w-5 h-5" /> Abrir WhatsApp nuevamente
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setCartStep('ITEMS');
                      setOrderCompleted(null);
                      setActiveTab('products');
                    }}
                    className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    🛍️ Realizar otro pedido / Volver al catálogo
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Tu carrito está vacío</h3>
                  <p className="text-xs text-slate-400 mt-1">Selecciona productos de la carta para comenzar tu pedido.</p>
                </div>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800"
                >
                  Ver Menú y Productos
                </button>
              </div>
            ) : (
              <>
                {/* STEP 1: ITEMS IN CART */}
                {cartStep === 'ITEMS' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-black text-slate-900">1. Revisa tu Pedido</h2>
                        <p className="text-xs text-slate-400">Modifica cantidades o elimina ítems antes de continuar.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowClearCartModal(true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Vaciar carrito
                      </button>
                    </div>

                    {/* Items List with Stepper and Individual Line Total */}
                    <div className="divide-y divide-slate-100">
                      {cart.map(item => {
                        const unitPrice = item.product.promo_price || item.product.price;
                        const lineTotal = unitPrice * item.quantity;
                        return (
                          <div key={item.product.id} className="py-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {formatCurrency(unitPrice, currency)} c/u
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                                  title="Disminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="text-xs font-black text-slate-900 w-16 text-right font-mono">
                                {formatCurrency(lineTotal, currency)}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Delivery or Pickup Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                        Modalidad de Pedido
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('DELIVERY')}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                            deliveryType === 'DELIVERY'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">🚚</span>
                          <span>Envío a Domicilio</span>
                          <span className={`text-[10px] font-normal ${deliveryType === 'DELIVERY' ? 'text-slate-300' : 'text-slate-500'}`}>
                            {modules.delivery ? `+${formatCurrency(7.00, currency)}` : 'Tarifa standard'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryType('PICKUP')}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                            deliveryType === 'PICKUP'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">🏪</span>
                          <span>Recojo en Local</span>
                          <span className={`text-[10px] font-normal ${deliveryType === 'PICKUP' ? 'text-slate-300' : 'text-emerald-600 font-bold'}`}>
                            Gratis (S/ 0.00)
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Totals Breakdown */}
                    <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal ({totalCartUnits} unidades):</span>
                        <span className="font-mono font-bold">{formatCurrency(cartTotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{deliveryType === 'DELIVERY' ? 'Costo de Delivery:' : 'Recojo en tienda:'}</span>
                        <span className="font-mono font-bold">
                          {deliveryType === 'DELIVERY' ? formatCurrency(deliveryFee, currency) : 'Gratis'}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-200">
                        <span>TOTAL A PAGAR:</span>
                        <span className="font-mono">{formatCurrency(finalTotal, currency)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCartStep('CUSTOMER_INFO')}
                      className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      <span>CONTINUAR PEDIDO</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: CUSTOMER INFORMATION FORM */}
                {cartStep === 'CUSTOMER_INFO' && (
                  <form onSubmit={handleProceedToSummary} className="space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-black text-slate-900">2. Datos del Cliente</h2>
                        <p className="text-xs text-slate-400">Ingresa tus datos para coordinar la entrega o recojo.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCartStep('ITEMS')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Volver al carrito
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre Completo <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Teléfono / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="Ej: 987654321"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Delivery Address (required if DELIVERY) */}
                    {deliveryType === 'DELIVERY' ? (
                      <div className="space-y-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            📍 Dirección de Entrega <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            placeholder="Ej: Av. Principal 123, Dpto 402"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            📝 Referencia de Ubicación
                          </label>
                          <input
                            type="text"
                            value={customerReference}
                            onChange={e => setCustomerReference(e.target.value)}
                            placeholder="Ej: Frente al parque, reja blanca, timbre 402"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Recogerás tu pedido en el local: <strong>{settings.address || targetOrg.name}</strong></span>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        💬 Observaciones o Instrucciones Especiales
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej: Sin cebolla, cremas y salsas picantes por separado, enviar cubiertos..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                      />
                    </div>

                    {/* Método de Pago */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        💳 Método de Pago Preferido
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'YAPE_PLIN', label: '📱 Yape / Plin' },
                          { key: 'CASH', label: '💵 Efectivo' },
                          { key: 'CARD', label: '💳 Tarjeta' },
                        ].map(pm => (
                          <button
                            key={pm.key}
                            type="button"
                            onClick={() => setPaymentMethod(pm.key as any)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                              paymentMethod === pm.key
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCartStep('ITEMS')}
                        className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                      >
                        ← Volver
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: settings.primary_color }}
                      >
                        <span>CONTINUAR AL RESUMEN</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: SUMMARY BEFORE SENDING */}
                {cartStep === 'SUMMARY' && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-black text-slate-900">3. Resumen del Pedido</h2>
                        <p className="text-xs text-slate-400">Verifica que todos los datos sean correctos antes de enviar.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCartStep('CUSTOMER_INFO')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        ✏️ Modificar
                      </button>
                    </div>

                    {/* Products list snapshot */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Productos</span>
                      <div className="divide-y divide-slate-200 text-xs">
                        {cart.map(item => {
                          const unitPrice = item.product.promo_price || item.product.price;
                          return (
                            <div key={item.product.id} className="py-2 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">
                                {item.product.name} <strong className="text-slate-500 font-normal">x{item.quantity}</strong>
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatCurrency(unitPrice * item.quantity, currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-mono">{formatCurrency(cartTotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>{deliveryType === 'DELIVERY' ? 'Envío a Domicilio:' : 'Recojo en local:'}</span>
                          <span className="font-mono">{deliveryType === 'DELIVERY' ? formatCurrency(deliveryFee, currency) : 'Gratis'}</span>
                        </div>
                        <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                          <span>TOTAL:</span>
                          <span className="font-mono text-base">{formatCurrency(finalTotal, currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer verification card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Datos de Entrega</span>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Cliente:</span>
                          <strong className="text-slate-900">{customerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Teléfono:</span>
                          <strong className="text-slate-900">{customerPhone}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Modalidad:</span>
                          <strong className="text-slate-900">{deliveryType === 'DELIVERY' ? '🚚 Delivery' : '🏪 Recojo en local'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Pago:</span>
                          <strong className="text-slate-900">
                            {paymentMethod === 'YAPE_PLIN' ? 'Yape / Plin' : paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                          </strong>
                        </div>
                      </div>

                      {deliveryType === 'DELIVERY' && deliveryAddress && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block text-[11px]">Dirección:</span>
                          <p className="text-slate-800 font-medium">{deliveryAddress}</p>
                          {customerReference && (
                            <p className="text-slate-500 text-[11px] mt-0.5">Ref: {customerReference}</p>
                          )}
                        </div>
                      )}

                      {notes && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block text-[11px]">Observaciones:</span>
                          <p className="text-slate-600 italic">"{notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Submit via WhatsApp */}
                    <button
                      type="button"
                      onClick={handleFinalOrderSubmit}
                      className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>📱 ENVIAR PEDIDO POR WHATSAPP ({formatCurrency(finalTotal, currency)})</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ======================= TAB: GALLERY (LIGHTBOX) ======================= */}
        {activeTab === 'gallery' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" style={{ color: settings.primary_color }} />
                <span>Galería Fotográfica de {targetOrg.name}</span>
              </h2>
              <p className="text-xs text-slate-500">Toca cualquier fotografía para ampliarla y verla en detalle.</p>
            </div>

            {orgGallery.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No hay fotos publicadas actualmente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {orgGallery.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className="group relative rounded-2xl overflow-hidden shadow-2xs border border-slate-100 bg-slate-100 h-56 cursor-pointer"
                  >
                    <img
                      src={item.image_url}
                      alt={item.title || 'Foto de galería'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                      <span className="text-white text-xs font-bold drop-shadow-sm">{item.title || 'Ver imagen ampliada'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: HOURS & LOCATION ======================= */}
        {activeTab === 'hours' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Horarios de Atención */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: settings.primary_color }} />
                    <span>Horarios de Atención</span>
                  </h2>
                  <p className="text-xs text-slate-500">Días y horas de servicio del local.</p>
                </div>
                <span 
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full text-white`}
                  style={{ backgroundColor: openStatus.isOpen ? '#10B981' : '#EF4444' }}
                >
                  {openStatus.text}
                </span>
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

            {/* Ubicación y Mapa */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: settings.primary_color }} />
                  <span>¿Dónde Estamos?</span>
                </h2>
                <p className="text-xs text-slate-500">Ven a visitarnos o solicita delivery directo.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-700 block">Dirección</span>
                  <p className="text-slate-600 font-medium flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{settings.address || 'Consultar dirección por WhatsApp'}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${targetOrg.name} ${settings.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Cómo llegar con Google Maps</span>
                  </a>
                </div>

                {modules.whatsapp && (
                  <a
                    href={generateWhatsAppLink(settings.whatsapp_number, `Hola, me gustaría saber cómo llegar al local de ${targetOrg.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4" /> Consultar ubicación por WhatsApp
                  </a>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* 5. SOCIAL MEDIA & FOOTER */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-slate-200 text-center space-y-4">
        
        {/* Redes Sociales */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Síguenos en Redes Sociales</span>
          
          <div className="flex items-center justify-center gap-3">
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white border border-slate-200 text-pink-600 hover:bg-pink-50 hover:scale-105 transition-all shadow-2xs"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all shadow-2xs"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {settings.tiktok_url && (
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:scale-105 transition-all shadow-2xs"
                title="TikTok"
              >
                <Share2 className="w-5 h-5" />
              </a>
            )}
            {settings.youtube_url && (
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:scale-105 transition-all shadow-2xs"
                title="YouTube"
              >
                <Video className="w-5 h-5" />
              </a>
            )}
            {settings.website_url && (
              <a
                href={settings.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:scale-105 transition-all shadow-2xs"
                title="Sitio Web Oficial"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-100">
          <p>© {new Date().getFullYear()} <strong>{targetOrg.name}</strong>. Todos los derechos reservados.</p>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-[11px] text-slate-600 font-medium">
            <span>Impulsado por</span>
            <BrandLogo variant="compact" size="xs" />
          </div>
        </div>
      </footer>

      {/* 6. FLOATING WHATSAPP BUTTON */}
      {modules.whatsapp && settings.whatsapp_number && (
        <a
          href={generateWhatsAppLink(
            settings.whatsapp_number,
            settings.whatsapp_message || `¡Hola ${targetOrg.name}! Me gustaría recibir información.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-bounce-short"
          style={{ backgroundColor: '#25D366' }}
          title="Pedir por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      )}

      {/* 7. LIGHTBOX MODAL FOR GALLERY */}
      {selectedPhotoIndex !== null && orgGallery[selectedPhotoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={orgGallery[selectedPhotoIndex].image_url}
              alt={orgGallery[selectedPhotoIndex].title || 'Foto ampliada'}
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {orgGallery[selectedPhotoIndex].title && (
              <p className="text-white text-sm font-bold mt-3 text-center">
                {orgGallery[selectedPhotoIndex].title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 8. PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 space-y-4">
            <div className="h-64 bg-slate-100 relative">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedProduct.category_name && (
                <span className="absolute bottom-3 left-3 text-xs font-bold bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-xl">
                  {selectedProduct.category_name}
                </span>
              )}
            </div>

            <div className="p-6 pt-2 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(selectedProduct.promo_price || selectedProduct.price, currency)}
                </span>
                {selectedProduct.promo_price && (
                  <span className="text-sm text-slate-400 line-through font-mono">
                    {formatCurrency(selectedProduct.price, currency)}
                  </span>
                )}
              </div>

              <div className="pt-2">
                {modules.orders ? (
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, 1);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    <Plus className="w-4 h-4" /> Agregar al Pedido
                  </button>
                ) : (
                  <a
                    href={generateWhatsAppLink(
                      settings.whatsapp_number,
                      `Hola, deseo comprar "${selectedProduct.name}" (${formatCurrency(selectedProduct.promo_price || selectedProduct.price, currency)}) en ${targetOrg.name}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4" /> Pedir por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING BOTTOM CART BAR (When active items exist and not on cart tab) */}
      {modules.orders && cart.length > 0 && activeTab !== 'cart' && (
        <aside 
          aria-label="Resumen flotante del carrito"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 animate-slide-up"
        >
          <div className="flex items-center gap-3 pl-1 min-w-0">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-xs text-slate-900 shadow-xs"
              style={{ backgroundColor: settings.accent_color || '#F59E0B' }}
            >
              {totalCartUnits}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Tu Pedido</span>
              <span className="text-sm font-black text-white font-mono truncate block">
                {formatCurrency(finalTotal, currency)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('cart');
              setCartStep('ITEMS');
            }}
            className="px-5 py-2.5 rounded-2xl font-bold text-xs text-white flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0"
            style={{ backgroundColor: settings.primary_color }}
          >
            <span>Ver Carrito</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* 10. MODAL: CONFIRMACIÓN VACIAR CARRITO */}
      {showClearCartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">¿Vaciar carrito?</h3>
              <p className="text-xs text-slate-500">
                ¿Seguro que deseas eliminar todos los productos de tu carrito? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCartModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearCartModal(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: GUÍA DE COMPRA */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialRole="CUSTOMER"
      />

      {/* 12. MODAL: INSTALAR APP MÓVIL PWA */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        businessName={targetOrg?.name || 'Tienda'}
        businessSlug={targetOrg?.slug}
        targetRole="CUSTOMER"
      />

    </div>
  );
};
