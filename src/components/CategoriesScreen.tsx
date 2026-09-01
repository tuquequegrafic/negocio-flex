import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  AlertTriangle, 
  Layers, 
  MoveUp, 
  MoveDown,
  X,
  Tag,
  Package,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

const COMMON_EMOJIS = [
  '🍗', '🥩', '🍝', '🍕', '🍔', '🥤', '🍰', '☕', '🍷', '🍣', '🥗', 
  '💇', '💅', '💄', '🧖', '✂️', '👕', '👟', '🎒', '📱', '🏋️', '⚡', 
  '💊', '✨', '🏷️', '🥪', '🍜', '🍦', '🍩', '🥑', '🌮', '🍹', '🪴'
];

export const CategoriesScreen: React.FC = () => {
  const { currentOrg, categories, products, services, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp();

  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [catType, setCatType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const orgCategories = categories
    .filter(c => c.organization_id === currentOrg.id && c.type === activeTab)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const openCreateForm = () => {
    setEditingCatId(null);
    setName('');
    setDescription('');
    setIcon('🏷️');
    setCatType(activeTab);
    setIsFormOpen(true);
  };

  const openEditForm = (c: Category) => {
    setEditingCatId(c.id);
    setName(c.name);
    setDescription(c.description || '');
    setIcon(c.icon || '🏷️');
    setCatType(c.type);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCatId) {
      updateCategory(editingCatId, {
        name: name.trim(),
        description: description.trim(),
        icon,
        type: catType
      });
    } else {
      addCategory({
        organization_id: currentOrg.id,
        name: name.trim(),
        description: description.trim(),
        icon,
        type: catType,
        display_order: orgCategories.length + 1,
        is_active: true
      });
    }

    setIsFormOpen(false);
    setEditingCatId(null);
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newItems = [...orgCategories];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    reorderCategories(updated);
  };

  const getAssociatedCount = (categoryName: string, type: 'PRODUCT' | 'SERVICE') => {
    if (type === 'PRODUCT') {
      return products.filter(p => p.organization_id === currentOrg.id && p.category === categoryName).length;
    } else {
      return services.filter(s => s.organization_id === currentOrg.id && s.category === categoryName).length;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📂</span>
            <h1 className="text-2xl font-black text-slate-900">Gestión de Categorías</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organiza tus productos y servicios en grupos para facilitar la navegación a tus clientes.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* 2. Tabs: Productos vs Servicios */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab('PRODUCT'); setIsFormOpen(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'PRODUCT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Categorías de Productos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'PRODUCT' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {categories.filter(c => c.organization_id === currentOrg.id && c.type === 'PRODUCT').length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('SERVICE'); setIsFormOpen(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'SERVICE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Categorías de Servicios</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'SERVICE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {categories.filter(c => c.organization_id === currentOrg.id && c.type === 'SERVICE').length}
          </span>
        </button>
      </div>

      {/* 3. Form Modal / Panel */}
      {isFormOpen && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-indigo-200 shadow-xs animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              {editingCatId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Icon / Emoji */}
              <div className="sm:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">Emoji / Ícono</label>
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-xl shadow-2xs shrink-0">
                    {icon}
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-bold text-sm"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="sm:col-span-9">
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pastas Frescas, Postres, Bebidas, Cortes de Cabello..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

            </div>

            {/* Quick Emoji Picker */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Emojis sugeridos (haz clic para elegir):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all ${
                      icon === e ? 'bg-indigo-600 text-white scale-110 shadow-xs' : 'bg-white hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Descripción corta (Opcional)</label>
              <input
                type="text"
                placeholder="Breve detalle sobre lo que incluye esta categoría..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs"
              >
                {editingCatId ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 4. Categories List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {orgCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No hay categorías registradas</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Crea tu primera categoría para organizar los elementos en la tienda online.
            </p>
            <button
              onClick={openCreateForm}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Crear Primera Categoría
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orgCategories.map((cat, index) => {
              const count = getAssociatedCount(cat.name, cat.type);

              return (
                <div 
                  key={cat.id} 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handleMove(index, 'UP')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Mover arriba"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'DOWN')}
                        disabled={index === orgCategories.length - 1}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Mover abajo"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Icon & Details */}
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                      {cat.icon || '🏷️'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {count} {count === 1 ? (cat.type === 'PRODUCT' ? 'producto' : 'servicio') : (cat.type === 'PRODUCT' ? 'productos' : 'servicios')}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditForm(cat)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {deleteConfirmId === cat.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                        <span className="text-[10px] text-rose-700 font-bold px-1">¿Eliminar?</span>
                        <button
                          onClick={() => {
                            deleteCategory(cat.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white font-bold rounded-lg text-[10px]"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar Categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
