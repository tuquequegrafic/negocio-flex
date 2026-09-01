import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../core/utils/formatters';
import { ServiceItem } from '../types';
import { CategoriesModal } from './CategoriesModal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Clock, 
  Sparkles, 
  Layers,
  Star,
  CheckCircle2,
  XCircle,
  MoveUp,
  MoveDown,
  Upload,
  X,
  Eye,
  Scissors
} from 'lucide-react';

export const ServicesScreen: React.FC = () => {
  const { 
    currentOrg, 
    services, 
    categories, 
    addService, 
    updateService, 
    deleteService, 
    toggleServiceActive, 
    toggleServiceFeatured,
    reorderServices,
    setActiveView 
  } = useApp();

  const orgServices = services.filter(s => s.organization_id === currentOrg.id);
  const orgCategories = categories.filter(c => c.organization_id === currentOrg.id && c.type === 'SERVICE');
  const currency = currentOrg.settings?.currency || 'S/';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ServiceItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [promoPrice, setPromoPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('45');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  const filteredServices = orgServices.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'ALL' || s.category_id === selectedCat;
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'AVAILABLE' ? s.is_active :
      !s.is_active;

    return matchesSearch && matchesCat && matchesStatus;
  }).sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  const totalServices = orgServices.length;
  const availableCount = orgServices.filter(s => s.is_active).length;
  const featuredCount = orgServices.filter(s => s.is_featured).length;

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setPromoPrice('');
    setDuration('45');
    setCategoryId(orgCategories[0]?.id || '');
    setImageUrl('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80');
    setIsActive(true);
    setIsFeatured(false);
    setDisplayOrder(orgServices.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingId(s.id);
    setName(s.name);
    setDescription(s.description);
    setPrice(String(s.price));
    setPromoPrice(s.promo_price ? String(s.promo_price) : '');
    setDuration(String(s.duration_minutes));
    setCategoryId(s.category_id || orgCategories[0]?.id || '');
    setImageUrl(s.image_url || '');
    setIsActive(s.is_active);
    setIsFeatured(!!s.is_featured);
    setDisplayOrder(s.display_order || 1);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const catObj = orgCategories.find(c => c.id === categoryId);
    const servicePayload = {
      organization_id: currentOrg.id,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      promo_price: promoPrice ? parseFloat(promoPrice) : undefined,
      duration_minutes: parseInt(duration, 10) || 30,
      category_id: categoryId || undefined,
      category_name: catObj?.name,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      is_active: isActive,
      is_featured: isFeatured,
      display_order: displayOrder || 1
    };

    if (editingId) {
      updateService(editingId, servicePayload);
    } else {
      addService(servicePayload);
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

  const handleMoveService = (index: number, direction: 'UP' | 'DOWN') => {
    const newItems = [...filteredServices];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    reorderServices(updated);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
                <Scissors className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Servicios & Tarifas Profesionales</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configura los servicios ofrecidos por <strong>{currentOrg.name}</strong> para agendamiento o venta directa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCategoriesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs"
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Categorías ({orgCategories.length})</span>
            </button>

            <button
              onClick={() => setActiveView('client_portal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Portal Público</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Servicios</span>
              <span className="text-lg font-black text-slate-900">{totalServices}</span>
            </div>
            <Scissors className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Disponibles</span>
              <span className="text-lg font-black text-emerald-800">{availableCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
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

      {/* 2. Filters & Search */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Buscar servicio por nombre o detalle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="ALL">📋 Estado: Todos</option>
              <option value="AVAILABLE">🟢 Solo Disponibles</option>
              <option value="UNAVAILABLE">🔴 No Disponibles</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCat === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todos los servicios</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
              {orgServices.length}
            </span>
          </button>

          {orgCategories.map(c => {
            const count = orgServices.filter(s => s.category_id === c.id).length;
            const isSelected = selectedCat === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white'
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

      {/* 3. Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto text-purple-400">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron servicios</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Crea los servicios profesionales que ofrece tu negocio para habilitar reservas.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" /> Crear Primer Servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((s, idx) => (
            <div 
              key={s.id} 
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:shadow-lg ${
                s.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              <div>
                {/* Photo header */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={s.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80'}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {s.category_name && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl">
                      {s.category_name}
                    </span>
                  )}

                  <button
                    onClick={() => toggleServiceFeatured(s.id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-xl backdrop-blur-md transition-all ${
                      s.is_featured ? 'bg-amber-400 text-slate-950 scale-105' : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                    title="Destacar servicio"
                  >
                    <Star className={`w-4 h-4 ${s.is_featured ? 'fill-slate-950' : ''}`} />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <button
                      onClick={() => toggleServiceActive(s.id)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-1.5 transition-all shadow-xs ${
                        s.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      <span>{s.is_active ? '🟢 ACTIVO' : '🔴 PAUSADO'}</span>
                    </button>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-300" />
                      <span>{s.duration_minutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-purple-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{s.description || 'Sin descripción.'}</p>

                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(s.promo_price || s.price, currency)}
                      </span>
                      {s.promo_price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {formatCurrency(s.price, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveService(idx, 'UP')}
                    className={`p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                    title="Subir"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === filteredServices.length - 1}
                    onClick={() => handleMoveService(idx, 'DOWN')}
                    className={`p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg ${idx === filteredServices.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                    title="Bajar"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(s)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-purple-600 px-2.5 py-1.5 rounded-xl hover:bg-purple-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => setDeleteCandidate(s)}
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

      {/* 4. MODAL: Create/Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </h2>
                  <p className="text-xs text-slate-500">Configura tarifa, duración y categoría</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Corte & Barba Clásico, Masaje Relajante..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">Sin Categoría</option>
                    {orgCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon || '🏷️'} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="45"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio ({currency}) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="45.00"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Promo (Opcional)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={promoPrice}
                    onChange={e => setPromoPrice(e.target.value)}
                    placeholder="39.90"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Servicio</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explica qué incluye el servicio, beneficios, recomendaciones..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto del Servicio</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img src={imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="URL de la imagen..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subir archivo</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="p-3 rounded-2xl border bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">🟢 Servicio Activo</span>
                </label>

                <label className="p-3 rounded-2xl border bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">⭐ Destacar</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">⚠️ ¿Eliminar servicio?</h3>
              <p className="text-xs text-slate-500">¿Deseas eliminar "{deleteCandidate.name}" permanentemente?</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteService(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        typeFilter="SERVICE"
      />
    </div>
  );
};
