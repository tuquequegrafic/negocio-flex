import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../core/utils/formatters';
import { Product, Category } from '../types';
import { CategoriesModal } from './CategoriesModal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag, 
  Check, 
  Image as ImageIcon, 
  AlertCircle,
  Star,
  Layers,
  Eye,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Upload,
  Sparkles,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Filter,
  ExternalLink,
  ShoppingBag,
  SlidersHorizontal,
  X
} from 'lucide-react';

const PRESET_SAMPLE_IMAGES = [
  { label: 'Pollo a la Brasa', url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&auto=format&fit=crop&q=80', cat: 'Comida' },
  { label: 'Lomo Saltado', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80', cat: 'Comida' },
  { label: 'Pizza Artesanal', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80', cat: 'Comida' },
  { label: 'Pasta Fettuccine', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80', cat: 'Comida' },
  { label: 'Hamburguesa Gourmet', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', cat: 'Comida' },
  { label: 'Bebida / Refresco', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', cat: 'Bebidas' },
  { label: 'Postre de Chocolate', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', cat: 'Postres' },
  { label: 'Prenda / Ropa', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80', cat: 'Tienda' },
  { label: 'Zapatillas / Calzado', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', cat: 'Tienda' },
  { label: 'Suplemento / Proteína', url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80', cat: 'Fitness' }
];

export const ProductsScreen: React.FC = () => {
  const { 
    currentOrg, 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductActive, 
    toggleProductFeatured,
    reorderProducts,
    setActiveView,
    canAddProduct,
    openUpgradeModal,
    getCurrentPlan
  } = useApp();

  const currentPlan = getCurrentPlan();
  const productLimit = canAddProduct(currentOrg.id);
  const orgProducts = products.filter(p => p.organization_id === currentOrg.id);
  const orgCategories = categories.filter(c => c.organization_id === currentOrg.id && c.type === 'PRODUCT');
  const currency = currentOrg.settings?.currency || 'S/';


  // Filters and state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK'>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'ORDER' | 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'FEATURED'>('ORDER');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [promoPrice, setPromoPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('20');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [showPresets, setShowPresets] = useState(false);

  // Filter and sort products
  const filteredProducts = orgProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCat === 'ALL' || p.category_id === selectedCat;
    
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'AVAILABLE' ? p.is_active :
      !p.is_active;

    const matchesFeatured = 
      featuredFilter === 'ALL' ? true :
      featuredFilter === true ? !!p.is_featured :
      !p.is_featured;

    return matchesSearch && matchesCat && matchesStatus && matchesFeatured;
  }).sort((a, b) => {
    if (sortBy === 'NAME_ASC') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'PRICE_ASC') {
      const pA = a.promo_price || a.price;
      const pB = b.promo_price || b.price;
      return pA - pB;
    }
    if (sortBy === 'PRICE_DESC') {
      const pA = a.promo_price || a.price;
      const pB = b.promo_price || b.price;
      return pB - pA;
    }
    if (sortBy === 'FEATURED') {
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
    // Default: display_order or creation
    return (a.display_order || 999) - (b.display_order || 999);
  });

  // Stats calculation
  const totalProducts = orgProducts.length;
  const availableCount = orgProducts.filter(p => p.is_active).length;
  const outOfStockCount = orgProducts.filter(p => !p.is_active).length;
  const featuredCount = orgProducts.filter(p => p.is_featured).length;

  const openCreateModal = () => {
    const limit = canAddProduct(currentOrg.id);
    if (!limit.allowed) {
      openUpgradeModal(limit.message);
      return;
    }

    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setPromoPrice('');
    setStock('25');
    setCategoryId(orgCategories[0]?.id || '');
    setImageUrl('https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&auto=format&fit=crop&q=80');
    setIsActive(true);
    setIsFeatured(false);
    setDisplayOrder(orgProducts.length + 1);
    setShowPresets(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(String(p.price));
    setPromoPrice(p.promo_price ? String(p.promo_price) : '');
    setStock(String(p.stock));
    setCategoryId(p.category_id || orgCategories[0]?.id || '');
    setImageUrl(p.images[0] || '');
    setIsActive(p.is_active);
    setIsFeatured(!!p.is_featured);
    setDisplayOrder(p.display_order || 1);
    setShowPresets(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const parsedPrice = parseFloat(price);
    const parsedPromo = promoPrice ? parseFloat(promoPrice) : undefined;
    const catObj = orgCategories.find(c => c.id === categoryId);

    const productPayload = {
      organization_id: currentOrg.id,
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      promo_price: parsedPromo,
      stock: parseInt(stock, 10) || 0,
      category_id: categoryId || undefined,
      category_name: catObj?.name,
      images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'],
      is_active: isActive,
      is_featured: isFeatured,
      display_order: displayOrder || 1
    };

    if (editingId) {
      updateProduct(editingId, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoveProduct = (index: number, direction: 'UP' | 'DOWN') => {
    const newItems = [...filteredProducts];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    reorderProducts(updated);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catálogo de Productos</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gestiona los artículos, precios, categorías y disponibilidad de <strong>{currentOrg.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCategoriesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 shadow-2xs"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Categorías ({orgCategories.length})</span>
            </button>

            <button
              onClick={() => setActiveView('client_portal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Catálogo Público</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Productos</span>
              <span className="text-lg font-black text-slate-900">{totalProducts}</span>
            </div>
            <Package className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Disponibles</span>
              <span className="text-lg font-black text-emerald-800">{availableCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Agotados</span>
              <span className="text-lg font-black text-rose-800">{outOfStockCount}</span>
            </div>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Destacados</span>
              <span className="text-lg font-black text-amber-800">{featuredCount}</span>
            </div>
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* 2. Search, Filter and Ordering Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, ingrediente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Estado Selector */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">📦 Estado: Todos los productos</option>
              <option value="AVAILABLE">🟢 Solo Disponibles / Activos</option>
              <option value="OUT_OF_STOCK">🔴 Solo Agotados / Pausados</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ORDER">🔢 Orden: Posición manual</option>
              <option value="FEATURED">⭐ Orden: Destacados primero</option>
              <option value="NAME_ASC">🔤 Orden: Nombre (A-Z)</option>
              <option value="PRICE_ASC">💰 Orden: Precio (Menor a Mayor)</option>
              <option value="PRICE_DESC">💎 Orden: Precio (Mayor a Menor)</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCat === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todas las categorías</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
              {orgProducts.length}
            </span>
          </button>

          {orgCategories.map(c => {
            const count = orgProducts.filter(p => p.category_id === c.id).length;
            const isSelected = selectedCat === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{c.icon || '🏷️'}</span>
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Products List / Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No hay artículos que coincidan con los filtros seleccionados o aún no has creado productos para {currentOrg.name}.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Crear Primer Producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p, idx) => (
            <div 
              key={p.id} 
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:shadow-lg ${
                p.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              <div>
                {/* Photo Header with Badges */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={p.images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Left: Category badge */}
                  {p.category_name && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-xs">
                      {p.category_name}
                    </span>
                  )}

                  {/* Top Right: Featured Star Toggle */}
                  <button
                    onClick={() => toggleProductFeatured(p.id)}
                    title={p.is_featured ? 'Producto Destacado (Quitar)' : 'Marcar como Destacado'}
                    className={`absolute top-3 right-3 p-1.5 rounded-xl backdrop-blur-md transition-all ${
                      p.is_featured 
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105' 
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${p.is_featured ? 'fill-slate-950' : ''}`} />
                  </button>

                  {/* Bottom Left: Availability Indicator & Quick Toggle */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <button
                      onClick={() => toggleProductActive(p.id)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-1.5 transition-all shadow-xs ${
                        p.is_active
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                      title="Clic para alternar disponibilidad"
                    >
                      <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-white animate-pulse' : 'bg-white/80'}`} />
                      <span>{p.is_active ? '🟢 DISPONIBLE' : '🔴 AGOTADO'}</span>
                    </button>

                    <button
                      onClick={() => setPreviewProduct(p)}
                      className="p-1.5 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                      title="Ver vista previa de cliente"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Product Content Details */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {p.description || 'Sin descripción detallada.'}
                    </p>
                  </div>

                  {/* Pricing and Stock */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(p.promo_price || p.price, currency)}
                      </span>
                      {p.promo_price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatCurrency(p.price, currency)}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Stock: <strong className="text-slate-700">{p.stock}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                {/* Reorder Arrows */}
                <div className="flex items-center gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveProduct(idx, 'UP')}
                    className={`p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors ${
                      idx === 0 ? 'opacity-20 cursor-not-allowed' : ''
                    }`}
                    title="Subir posición"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === filteredProducts.length - 1}
                    onClick={() => handleMoveProduct(idx, 'DOWN')}
                    className={`p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors ${
                      idx === filteredProducts.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                    }`}
                    title="Bajar posición"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => setDeleteProductCandidate(p)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL: Create / Edit Product Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                  <p className="text-xs text-slate-500">Configura la ficha del artículo para tu tienda</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Producto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Pollo a la Brasa Tradicional, Pizza Familiar..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Category & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      + Gestionar
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">Sin Categoría</option>
                    {orgCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🏷️'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock / Unidades</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Price & Promo Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Regular ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="35.00"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Promocional (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={promoPrice}
                      onChange={e => setPromoPrice(e.target.value)}
                      placeholder="29.90"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Producto</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe los ingredientes, porciones, detalles o especificaciones..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Product Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Fotografía del Producto</label>
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{showPresets ? 'Ocultar fotos de muestra' : 'Ver fotos de muestra'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="Pegar URL de la imagen o subir archivo..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />

                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subir desde dispositivo</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Preset sample photos */}
                {showPresets && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Seleccionar fotografía sugerida:
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 hover:ring-2 hover:ring-indigo-600"
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 text-center text-[9px] font-bold text-white transition-opacity">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles: Available & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  isActive ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">🟢 Producto Disponible</span>
                    <span className="text-[10px] text-slate-500">Activo para compras de clientes</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  isFeatured ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">⭐ Destacar Producto</span>
                    <span className="text-[10px] text-slate-500">Aparecer en Más Vendidos</span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all active:scale-95"
                >
                  {editingId ? '💾 Actualizar Producto' : '➕ Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Delete Confirmation */}
      {deleteProductCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">⚠️ ¿Eliminar producto?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <strong>"{deleteProductCandidate.name}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductCandidate(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(deleteProductCandidate.id);
                  setDeleteProductCandidate(null);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Public Product Client Preview */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4">
            <div className="relative h-56 bg-slate-100">
              <img
                src={previewProduct.images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                alt={previewProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              {previewProduct.is_featured && (
                <span className="absolute top-3 left-3 text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  ⭐ Destacado
                </span>
              )}
            </div>

            <div className="p-6 pt-2 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {previewProduct.category_name || 'General'}
                </span>
                <h3 className="text-lg font-black text-slate-900">{previewProduct.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{previewProduct.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(previewProduct.promo_price || previewProduct.price, currency)}
                </span>
                {previewProduct.promo_price && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatCurrency(previewProduct.price, currency)}
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 text-center">
                👁️ Esta es una simulación de cómo tus clientes verán este artículo en el catálogo web móvil.
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Categories Manager Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        typeFilter="PRODUCT"
      />
    </div>
  );
};
