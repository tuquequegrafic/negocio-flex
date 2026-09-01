import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateWhatsAppLink } from '../core/utils/formatters';
import { 
  Palette, 
  Store, 
  Upload, 
  Trash2, 
  Eye, 
  Check, 
  Sparkles, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Globe, 
  Plus, 
  Layers, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  ArrowLeft, 
  ArrowRight, 
  Image as ImageIcon, 
  Video, 
  Share2, 
  Smartphone, 
  CheckSquare, 
  Sliders, 
  X,
  Calendar,
  ShoppingBag,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BusinessHour, GalleryItem } from '../types';

interface PresetTheme {
  name: string;
  category: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

const PRESET_PALETTES: PresetTheme[] = [
  { name: 'Rojo Trattoria', category: 'Restaurante', primary: '#B91C1C', secondary: '#DC2626', accent: '#F59E0B', text: '#111827' },
  { name: 'Púrpura Glamour', category: 'Salón & Belleza', primary: '#7C3AED', secondary: '#8B5CF6', accent: '#EC4899', text: '#111827' },
  { name: 'Verde Titan Fitness', category: 'Gimnasio & Salud', primary: '#047857', secondary: '#10B981', accent: '#F59E0B', text: '#111827' },
  { name: 'Azul Ejecutivo', category: 'Profesional & Tienda', primary: '#1D4ED8', secondary: '#3B82F6', accent: '#06B6D4', text: '#111827' },
  { name: 'Ámbar & Café', category: 'Cafetería & Panadería', primary: '#B45309', secondary: '#D97706', accent: '#FBBF24', text: '#111827' },
  { name: 'Obsidiana & Oro', category: 'Lujo & Boutique', primary: '#18181B', secondary: '#27272A', accent: '#EAB308', text: '#09090B' },
];

const DAYS_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const CustomizerScreen: React.FC = () => {
  const { 
    currentOrg, 
    updateOrganizationSettings, 
    updateBusinessInfo,
    businessHours, 
    updateBusinessHours,
    galleryItems,
    addGalleryItem,
    removeGalleryItem,
    reorderGalleryItems,
    products, 
    services, 
    setActiveView 
  } = useApp();

  const settings = currentOrg.settings!;
  
  // Navigation tabs inside Customizer
  const [activeSection, setActiveSection] = useState<
    'basic' | 'branding' | 'gallery' | 'colors' | 'whatsapp' | 'hours' | 'social' | 'modules'
  >('basic');

  // Form State - Basic Info
  const [name, setName] = useState(currentOrg.name);
  const [description, setDescription] = useState(currentOrg.description || '');
  const [businessType, setBusinessType] = useState(currentOrg.business_type || 'restaurant');
  const [slogan, setSlogan] = useState(settings.slogan || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [email, setEmail] = useState(settings.email || '');

  // Form State - Branding & Media
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [coverUrl, setCoverUrl] = useState(settings.cover_url);

  // Form State - Colors
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color);
  const [textColor, setTextColor] = useState(settings.text_color || '#111827');
  const [accentColor, setAccentColor] = useState(settings.accent_color);

  // Form State - WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number);
  const [whatsappMessage, setWhatsappMessage] = useState(
    settings.whatsapp_message || `¡Hola ${currentOrg.name}! Me gustaría consultar sobre sus productos y promociones.`
  );

  // Form State - Social Media
  const [instagramUrl, setInstagramUrl] = useState(settings.instagram_url || '');
  const [facebookUrl, setFacebookUrl] = useState(settings.facebook_url || '');
  const [tiktokUrl, setTiktokUrl] = useState(settings.tiktok_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(settings.youtube_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(settings.website_url || '');

  // Form State - Modules
  const [activeModules, setActiveModules] = useState({
    products: settings.active_modules.products ?? true,
    services: settings.active_modules.services ?? false,
    categories: settings.active_modules.categories ?? true,
    orders: settings.active_modules.orders ?? true,
    appointments: settings.active_modules.appointments ?? false,
    delivery: settings.active_modules.delivery ?? true,
    promotions: settings.active_modules.promotions ?? true,
    gallery: settings.active_modules.gallery ?? true,
    whatsapp: settings.active_modules.whatsapp ?? true,
    hours: settings.active_modules.hours ?? true,
    location: settings.active_modules.location ?? true,
    testimonials: settings.active_modules.testimonials ?? true,
    social: settings.active_modules.social ?? true,
    notifications: settings.active_modules.notifications ?? true,
    analytics: settings.active_modules.analytics ?? true,
  });

  // Business Hours State
  const orgHours = businessHours.filter(h => h.organization_id === currentOrg.id);
  const [localHours, setLocalHours] = useState<BusinessHour[]>(() => {
    if (orgHours.length === 7) return orgHours;
    // Default 7 days if not present
    return [
      { id: `bh-${currentOrg.id}-1`, organization_id: currentOrg.id, day_of_week: 1, day_name: 'Lunes', open_time: '09:00', close_time: '20:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-2`, organization_id: currentOrg.id, day_of_week: 2, day_name: 'Martes', open_time: '09:00', close_time: '20:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-3`, organization_id: currentOrg.id, day_of_week: 3, day_name: 'Miércoles', open_time: '09:00', close_time: '20:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-4`, organization_id: currentOrg.id, day_of_week: 4, day_name: 'Jueves', open_time: '09:00', close_time: '20:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-5`, organization_id: currentOrg.id, day_of_week: 5, day_name: 'Viernes', open_time: '09:00', close_time: '21:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-6`, organization_id: currentOrg.id, day_of_week: 6, day_name: 'Sábado', open_time: '09:00', close_time: '21:00', is_closed: false, is_open: true },
      { id: `bh-${currentOrg.id}-0`, organization_id: currentOrg.id, day_of_week: 0, day_name: 'Domingo', open_time: '10:00', close_time: '18:00', is_closed: false, is_open: true },
    ];
  });

  // Gallery State
  const orgGallery = galleryItems.filter(g => g.organization_id === currentOrg.id);
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isAddingImageModal, setIsAddingImageModal] = useState(false);

  // Status & Feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewTab, setPreviewTab] = useState<'catalog' | 'services' | 'booking' | 'gallery' | 'hours' | 'about'>('catalog');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Sync state when currentOrg changes
  useEffect(() => {
    setName(currentOrg.name);
    setDescription(currentOrg.description || '');
    setBusinessType(currentOrg.business_type || 'restaurant');
    setSlogan(settings.slogan || '');
    setPhone(settings.phone || '');
    setAddress(settings.address || '');
    setEmail(settings.email || '');
    setLogoUrl(settings.logo_url);
    setCoverUrl(settings.cover_url);
    setPrimaryColor(settings.primary_color);
    setSecondaryColor(settings.secondary_color);
    setTextColor(settings.text_color || '#111827');
    setAccentColor(settings.accent_color);
    setWhatsappNumber(settings.whatsapp_number);
    setWhatsappMessage(settings.whatsapp_message || `¡Hola ${currentOrg.name}! Me gustaría consultar sobre sus productos y promociones.`);
    setInstagramUrl(settings.instagram_url || '');
    setFacebookUrl(settings.facebook_url || '');
    setTiktokUrl(settings.tiktok_url || '');
    setYoutubeUrl(settings.youtube_url || '');
    setWebsiteUrl(settings.website_url || '');
    setActiveModules({
      products: settings.active_modules.products ?? true,
      services: settings.active_modules.services ?? false,
      categories: settings.active_modules.categories ?? true,
      orders: settings.active_modules.orders ?? true,
      appointments: settings.active_modules.appointments ?? false,
      delivery: settings.active_modules.delivery ?? true,
      promotions: settings.active_modules.promotions ?? true,
      gallery: settings.active_modules.gallery ?? true,
      whatsapp: settings.active_modules.whatsapp ?? true,
      hours: settings.active_modules.hours ?? true,
      location: settings.active_modules.location ?? true,
      testimonials: settings.active_modules.testimonials ?? true,
      social: settings.active_modules.social ?? true,
      notifications: settings.active_modules.notifications ?? true,
      analytics: settings.active_modules.analytics ?? true,
    });
  }, [currentOrg.id]);

  // File Upload Handlers (converts image file to data URL for instant local preview and Supabase storage upload)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addGalleryItem({
            organization_id: currentOrg.id,
            title: newGalleryTitle || 'Fotografía de local',
            image_url: event.target.result as string,
            display_order: orgGallery.length + 1
          });
          setNewGalleryTitle('');
          setIsAddingImageModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl) return;
    addGalleryItem({
      organization_id: currentOrg.id,
      title: newGalleryTitle || 'Fotografía de local',
      image_url: newGalleryUrl,
      display_order: orgGallery.length + 1
    });
    setNewGalleryTitle('');
    setNewGalleryUrl('');
    setIsAddingImageModal(false);
  };

  const handleMoveGallery = (index: number, direction: 'left' | 'right') => {
    const items = [...orgGallery];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // re-assign display orders
    items.forEach((item, idx) => {
      item.display_order = idx + 1;
    });

    reorderGalleryItems(items);
  };

  // Business Hours Update Helpers
  const handleHourToggle = (dayOfWeek: number) => {
    setLocalHours(prev => prev.map(h => {
      if (h.day_of_week === dayOfWeek) {
        const nextClosed = !h.is_closed;
        return { ...h, is_closed: nextClosed, is_open: !nextClosed };
      }
      return h;
    }));
  };

  const handleHourChange = (dayOfWeek: number, field: 'open_time' | 'close_time', value: string) => {
    setLocalHours(prev => prev.map(h => {
      if (h.day_of_week === dayOfWeek) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const copyMondayToWeekdays = () => {
    const monday = localHours.find(h => h.day_of_week === 1);
    if (!monday) return;
    setLocalHours(prev => prev.map(h => {
      // Days 1 (Mon) to 5 (Fri)
      if (h.day_of_week >= 1 && h.day_of_week <= 5) {
        return {
          ...h,
          open_time: monday.open_time,
          close_time: monday.close_time,
          is_closed: monday.is_closed,
          is_open: !monday.is_closed
        };
      }
      return h;
    }));
  };

  // Module toggle helper
  const handleModuleToggle = (moduleKey: keyof typeof activeModules) => {
    setActiveModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  // Apply Quick Preset by Category
  const applyPresetTheme = (preset: PresetTheme) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    setTextColor(preset.text);
  };

  // Save all settings to global store & local persistence
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus('saving');

    try {
      // 1. Update basic org info
      updateBusinessInfo({
        name,
        description,
        business_type: businessType as any,
      });

      // 2. Update settings & branding & modules & socials
      updateOrganizationSettings({
        slogan,
        phone,
        address,
        email,
        logo_url: logoUrl,
        cover_url: coverUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        text_color: textColor,
        accent_color: accentColor,
        whatsapp_number: whatsappNumber,
        whatsapp_message: whatsappMessage,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        tiktok_url: tiktokUrl,
        youtube_url: youtubeUrl,
        website_url: websiteUrl,
        active_modules: activeModules,
      });

      // 3. Update hours
      updateBusinessHours(localHours);

      setSaveStatus('saved');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const sampleProducts = products.filter(p => p.organization_id === currentOrg.id);
  const sampleServices = services.filter(s => s.organization_id === currentOrg.id);
  const generatedWhatsAppUrl = generateWhatsAppLink(whatsappNumber, whatsappMessage);

  return (
    <div className="space-y-6 pb-20 font-sans">
      
      {/* Header & Quick Action Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Store className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/60 px-2.5 py-0.5 rounded-full">
              Fase 5 • Personalización Total
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Configuración del Negocio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza la identidad visual, datos comerciales, horarios, módulos y canales de atención de <strong>{currentOrg.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('client_portal')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Ver Tienda Pública</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold"
          >
            <Smartphone className="w-4 h-4" />
            <span>{showMobilePreview ? 'Ocultar Preview' : 'Ver Simulador'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveStatus === 'saved' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-xs font-bold">¡Cambios guardados correctamente!</h4>
              <p className="text-[11px] text-emerald-700">La configuración de tu negocio se ha actualizado y sincronizado en tiempo real con la tienda pública.</p>
            </div>
          </div>
          <button onClick={() => setSaveStatus('idle')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        {[
          { key: 'basic', label: '🏪 Información Básica' },
          { key: 'branding', label: '🖼️ Logo & Portada' },
          { key: 'gallery', label: '📸 Galería de Fotos' },
          { key: 'colors', label: '🎨 Colores & Marca' },
          { key: 'whatsapp', label: '💬 WhatsApp' },
          { key: 'hours', label: '🕐 Horarios' },
          { key: 'social', label: '🌐 Redes Sociales' },
          { key: 'modules', label: '🧩 Módulos Activos' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeSection === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Form Sections on Left + Real-time Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Content */}
        <div className={`lg:col-span-7 space-y-6 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          
          {/* ======================================================== */}
          {/* SECCIÓN 1: INFORMACIÓN BÁSICA DEL NEGOCIO */}
          {/* ======================================================== */}
          {activeSection === 'basic' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-600" />
                  <span>1. Información del Negocio</span>
                </h2>
                <p className="text-xs text-slate-500">Datos comerciales y de contacto visibles para tus clientes.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nombre del negocio *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej: La Trattoria & Pizzería Don Corleone"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Enlace / Slug de URL Pública (/r/)</label>
                    <div className="flex items-center">
                      <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 text-xs px-2.5 py-2.5 rounded-l-xl font-mono">
                        /r/
                      </span>
                      <input
                        type="text"
                        disabled
                        value={currentOrg.slug}
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Eslogan o Frase Destacada</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    placeholder="Ej: El verdadero sabor italiano en tu mesa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Descripción del Negocio</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe los productos, especialidades o experiencia de tu negocio..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Categoría / Rubro</label>
                    <select
                      value={businessType}
                      onChange={e => setBusinessType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900"
                    >
                      <option value="restaurant">Restaurante / Bar / Cafetería</option>
                      <option value="salon">Peluquería / Barbería / Spa</option>
                      <option value="gym">Gimnasio / Fitness / Crossfit</option>
                      <option value="store">Tienda de Ropa / Minimarket / Retail</option>
                      <option value="professional">Servicios Profesionales / Consultoría</option>
                      <option value="other">Otro Rubro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Teléfono Fijo / Central</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Correo Electrónico Comercial</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="contacto@minegocio.pe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Dirección Física del Local</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Av. Principal 123, Distrito, Ciudad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 2 & 3: LOGO & IMAGEN DE PORTADA */}
          {/* ======================================================== */}
          {activeSection === 'branding' && (
            <div className="space-y-6">
              
              {/* Logo Upload Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    <span>2. Logo del Negocio</span>
                  </h2>
                  <p className="text-xs text-slate-500">Se mostrará en la cabecera, comprobantes y catálogo.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-xs shrink-0 relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full text-xs">
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5" /> Subir desde equipo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Quitar logo
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="O ingresa enlace directo (URL)..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Formato recomendado: PNG con fondo transparente o JPG cuadrado (500x500 px).
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Banner Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <span>3. Imagen de Portada (Banner)</span>
                  </h2>
                  <p className="text-xs text-slate-500">Cabecera panorámica para la página principal del negocio.</p>
                </div>

                <div className="space-y-3">
                  <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        Sin imagen de portada
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <div className="text-white text-xs">
                        <strong className="block text-sm">{name}</strong>
                        <span>{slogan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5" /> Subir Portada
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={e => setCoverUrl(e.target.value)}
                      placeholder="O pega la URL de tu banner panorámico..."
                      className="flex-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Tamaño ideal: 1920 x 800 px (panorámica de alta resolución).
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 4: GALERÍA DE IMÁGENES */}
          {/* ======================================================== */}
          {activeSection === 'gallery' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    <span>4. Galería de Imágenes</span>
                  </h2>
                  <p className="text-xs text-slate-500">Muestra fotos de tus platos, instalaciones, trabajos o eventos.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingImageModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs"
                >
                  <Plus className="w-4 h-4" /> Agregar Imagen
                </button>
              </div>

              {/* Add Image Modal / Form */}
              {isAddingImageModal && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-indigo-900">Nueva Fotografía para la Galería</h4>
                    <button onClick={() => setIsAddingImageModal(false)} className="text-indigo-600 hover:text-indigo-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-indigo-950 mb-1">Título o Pie de Foto</label>
                      <input
                        type="text"
                        value={newGalleryTitle}
                        onChange={e => setNewGalleryTitle(e.target.value)}
                        placeholder="Ej: Salón principal o Balayage"
                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-indigo-950 mb-1">URL de la Imagen</label>
                      <input
                        type="url"
                        value={newGalleryUrl}
                        onChange={e => setNewGalleryUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-800 font-bold hover:bg-indigo-100">
                      <Upload className="w-3.5 h-3.5" /> Subir archivo directo
                      <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingImageModal(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddGalleryByUrl}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-2xs"
                      >
                        Insertar Imagen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {orgGallery.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No hay fotos en la galería aún</p>
                  <p className="text-[11px] text-slate-400">Agrega imágenes para cautivar a tus visitantes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {orgGallery.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="h-32 bg-slate-200 relative overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.title || 'Foto'} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="p-2.5 space-y-2">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{item.title || 'Sin título'}</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveGallery(index, 'left')}
                              className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              title="Mover a la izquierda"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === orgGallery.length - 1}
                              onClick={() => handleMoveGallery(index, 'right')}
                              className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              title="Mover a la derecha"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGalleryItem(item.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 5: COLORES & PERSONALIZACIÓN VISUAL */}
          {/* ======================================================== */}
          {activeSection === 'colors' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <span>5. Personalización Visual y Colores</span>
                </h2>
                <p className="text-xs text-slate-500">Configura la paleta de tu marca para botones, encabezados y destacados.</p>
              </div>

              {/* Color Pickers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Primary Color */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Color Principal</label>
                    <span className="font-mono font-bold text-[11px] text-slate-500">{primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase text-xs bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Utilizado en cabeceras, botones clave y títulos.</span>
                </div>

                {/* Secondary Color */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Color Secundario</label>
                    <span className="font-mono font-bold text-[11px] text-slate-500">{secondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase text-xs bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Utilizado en tarjetas, badges y degradados secundarios.</span>
                </div>

                {/* Text Color */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Color de Texto Principal</label>
                    <span className="font-mono font-bold text-[11px] text-slate-500">{textColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className="w-12 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase text-xs bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Para títulos y textos sobre fondo claro.</span>
                </div>

                {/* Accent Color */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Color de Acento (Destacados)</label>
                    <span className="font-mono font-bold text-[11px] text-slate-500">{accentColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase text-xs bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Para promociones, ofertas especiales y badges de oferta.</span>
                </div>

              </div>

              {/* Recommended Industry Palettes */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Paletas Recomendadas por Rubro
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_PALETTES.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPresetTheme(p)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-white hover:shadow-xs transition-all text-left group"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 6: WHATSAPP COMERCIAL */}
          {/* ======================================================== */}
          {activeSection === 'whatsapp' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                  <span>6. Configuración de WhatsApp</span>
                </h2>
                <p className="text-xs text-slate-500">Recibe pedidos y consultas directamente en el chat de tu negocio.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Número de WhatsApp (con código de país sin +) *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono">
                      +
                    </span>
                    <input
                      type="text"
                      required
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="51987654321"
                      className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Ejemplo para Perú: 51987654321 (51 = Código Perú, seguido de los 9 dígitos).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Mensaje de Bienvenida Automático
                  </label>
                  <textarea
                    rows={3}
                    value={whatsappMessage}
                    onChange={e => setWhatsappMessage(e.target.value)}
                    placeholder="Escribe el mensaje con el que se iniciará la conversación..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 leading-relaxed"
                  />
                </div>

                {/* Generated Link Preview & Test Button */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs">Enlace Directo Generado</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedWhatsAppUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? '¡Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>

                  <p className="font-mono text-[11px] text-emerald-800 break-all bg-white p-2.5 rounded-xl border border-emerald-200">
                    {generatedWhatsAppUrl}
                  </p>

                  <a
                    href={generatedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" /> Probar WhatsApp en Vivo
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 7: HORARIOS DE ATENCIÓN */}
          {/* ======================================================== */}
          {activeSection === 'hours' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>7. Horarios de Atención</span>
                  </h2>
                  <p className="text-xs text-slate-500">Configura tus días y horarios de apertura y cierre.</p>
                </div>

                <button
                  type="button"
                  onClick={copyMondayToWeekdays}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Lunes a Lun-Vie
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {localHours.map(hour => {
                  const isOpen = !hour.is_closed;
                  return (
                    <div key={hour.day_of_week} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-36">
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={() => handleHourToggle(hour.day_of_week)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`font-bold ${isOpen ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                          {hour.day_name}
                        </span>
                      </div>

                      {isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={hour.open_time}
                            onChange={e => handleHourChange(hour.day_of_week, 'open_time', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                          <span className="text-slate-400">a</span>
                          <input
                            type="time"
                            value={hour.close_time}
                            onChange={e => handleHourChange(hour.day_of_week, 'close_time', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                          Cerrado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 8: REDES SOCIALES */}
          {/* ======================================================== */}
          {activeSection === 'social' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>8. Redes Sociales & Web</span>
                </h2>
                <p className="text-xs text-slate-500">Conecta tus perfiles oficiales para que tus clientes te sigan.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-600" /> Instagram URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={e => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/minegocio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={e => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/minegocio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-slate-800" /> TikTok URL
                  </label>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={e => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@minegocio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-600" /> YouTube URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@minegocio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" /> Sitio Web Oficial / Enlace Externo
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://minegocio.pe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 9: MÓDULOS DEL NEGOCIO */}
          {/* ======================================================== */}
          {activeSection === 'modules' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>9. Módulos y Funcionalidades Activas</span>
                </h2>
                <p className="text-xs text-slate-500">Activa o desactiva secciones que se mostrarán en la tienda de tu cliente.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'products', label: 'Catálogo de Productos', desc: 'Muestra fotos, precios y stock de productos.' },
                  { key: 'services', label: 'Servicios & Tarifas', desc: 'Muestra servicios ofrecidos con precios y duraciones.' },
                  { key: 'gallery', label: 'Galería de Fotos', desc: 'Fotografías del local, trabajos y platos.' },
                  { key: 'whatsapp', label: 'Botón WhatsApp', desc: 'Botón flotante directo para contacto inmediato.' },
                  { key: 'hours', label: 'Horarios de Atención', desc: 'Sección informativa con días y horas de apertura.' },
                  { key: 'location', label: 'Ubicación & Dirección', desc: 'Mapa y dirección física del local.' },
                  { key: 'testimonials', label: 'Testimonios & Reseñas', desc: 'Opiniones y calificaciones de clientes.' },
                  { key: 'appointments', label: 'Reservas y Citas Online', desc: 'Permite a clientes reservar fecha y hora.' },
                  { key: 'orders', label: 'Pedidos y Carrito', desc: 'Permite armar pedidos con carrito y checkout.' },
                  { key: 'social', label: 'Redes Sociales', desc: 'Enlaces a Instagram, Facebook y TikTok.' },
                  { key: 'delivery', label: 'Cálculo de Delivery', desc: 'Añade tarifa de despacho a domicilio.' },
                ].map(mod => {
                  const isEnabled = (activeModules as any)[mod.key];
                  return (
                    <div
                      key={mod.key}
                      onClick={() => handleModuleToggle(mod.key as any)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isEnabled
                          ? 'border-indigo-300 bg-indigo-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{mod.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Save Action Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <span className="text-xs text-slate-500">
              ¿Listo para publicar tus cambios en la app?
            </span>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Todos los Cambios
                </>
              )}
            </button>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: SIMULADOR DE SMARTPHONE EN VIVO */}
        {/* ======================================================== */}
        <div className={`lg:col-span-5 ${showMobilePreview ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-6">
            
            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-3xl flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">Simulador en Tiempo Real</span>
              </div>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                LIVE PREVIEW
              </span>
            </div>

            {/* Smartphone Device Frame */}
            <div className="bg-slate-900 p-3 rounded-b-3xl shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
              
              {/* Inner Smartphone Screen */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-inner flex flex-col min-h-[580px] max-h-[640px] text-slate-800 text-xs">
                
                {/* Header Banner */}
                <div 
                  className="p-4 text-white relative min-h-[140px] flex flex-col justify-end"
                  style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${coverUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'}) center/cover no-repeat`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-white/50 shadow-md overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 font-black text-lg">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        {businessType}
                      </span>
                      <h3 className="font-black text-sm text-white truncate leading-tight mt-0.5">{name}</h3>
                      <p className="text-[10px] text-slate-200 truncate">{slogan || description}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Navigation in Preview */}
                <div 
                  className="px-2 flex border-b border-slate-100 text-[11px] font-bold overflow-x-auto"
                  style={{ backgroundColor: '#F8FAFC' }}
                >
                  {activeModules.products && (
                    <button 
                      onClick={() => setPreviewTab('catalog')}
                      className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${previewTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                      Productos
                    </button>
                  )}
                  {activeModules.services && (
                    <button 
                      onClick={() => setPreviewTab('services')}
                      className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${previewTab === 'services' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                      Servicios
                    </button>
                  )}
                  {activeModules.gallery && (
                    <button 
                      onClick={() => setPreviewTab('gallery')}
                      className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${previewTab === 'gallery' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                      Fotos
                    </button>
                  )}
                  {activeModules.hours && (
                    <button 
                      onClick={() => setPreviewTab('hours')}
                      className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${previewTab === 'hours' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                      Horarios
                    </button>
                  )}
                  <button 
                    onClick={() => setPreviewTab('about')}
                    className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${previewTab === 'about' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                  >
                    Contacto
                  </button>
                </div>

                {/* Dynamic Content in Device */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  
                  {/* Products view */}
                  {previewTab === 'catalog' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Catálogo Destacado
                      </span>
                      {sampleProducts.slice(0, 3).map(p => (
                        <div key={p.id} className="bg-white p-2 rounded-xl border border-slate-200/80 flex gap-2.5 items-center shadow-2xs">
                          <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate" style={{ color: textColor }}>{p.name}</h4>
                            <span className="text-[10px] text-slate-400 block truncate">{p.category_name}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-extrabold text-slate-900">
                                {formatCurrency(p.promo_price || p.price, settings.currency)}
                              </span>
                              <button 
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: primaryColor }}
                              >
                                + Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Services view */}
                  {previewTab === 'services' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Servicios Disponibles
                      </span>
                      {sampleServices.map(s => (
                        <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800" style={{ color: textColor }}>{s.name}</h4>
                            <span className="font-extrabold text-xs text-slate-900">{formatCurrency(s.price, settings.currency)}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{s.duration_minutes} minutos</p>
                          <button 
                            className="w-full py-1 rounded-md text-[10px] font-bold text-white mt-1"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Reservar Turno
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gallery view in simulator */}
                  {previewTab === 'gallery' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Galería de Fotos ({orgGallery.length})
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {orgGallery.map(g => (
                          <div key={g.id} className="h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hours view in simulator */}
                  {previewTab === 'hours' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Horarios de Atención
                      </span>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                        {localHours.map(h => (
                          <div key={h.day_of_week} className="flex justify-between py-0.5">
                            <span className="font-medium text-slate-600">{h.day_name}:</span>
                            <span className="font-bold text-slate-800">
                              {h.is_closed ? 'Cerrado' : `${h.open_time} - ${h.close_time}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact / About view */}
                  {previewTab === 'about' && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                      <span className="font-bold text-slate-800 block text-xs" style={{ color: textColor }}>Ubicación y Contacto</span>
                      <p className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {address}</p>
                      <p className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}</p>
                      {activeModules.social && (
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          {instagramUrl && <span className="p-1 rounded bg-pink-100 text-pink-600"><Instagram className="w-3.5 h-3.5" /></span>}
                          {facebookUrl && <span className="p-1 rounded bg-blue-100 text-blue-600"><Facebook className="w-3.5 h-3.5" /></span>}
                          {websiteUrl && <span className="p-1 rounded bg-emerald-100 text-emerald-600"><Globe className="w-3.5 h-3.5" /></span>}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom WhatsApp Float in Simulator */}
                {activeModules.whatsapp && (
                  <div className="p-2.5 bg-white border-t border-slate-100">
                    <a
                      href={generatedWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                    </a>
                  </div>
                )}

              </div>
            </div>

            <div className="text-center mt-3">
              <span className="text-[11px] text-slate-400 font-medium">
                Sincronización en vivo con {currentOrg.name}
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
