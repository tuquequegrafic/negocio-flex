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
  Tag
} from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeFilter?: 'PRODUCT' | 'SERVICE';
}

const COMMON_EMOJIS = ['🍗', '🥩', '🍝', '🍕', '🍔', '🥤', '🍰', '☕', '🍷', '🍣', '🥗', '💇', '💅', '💄', '🧖', '✂️', '👕', '👟', '🎒', '📱', '🏋️', '⚡', '💊', '✨', '🏷️'];

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose, typeFilter = 'PRODUCT' }) => {
  const { currentOrg, categories, products, services, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp();

  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'SERVICE'>(typeFilter);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [catType, setCatType] = useState<'PRODUCT' | 'SERVICE'>(typeFilter);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const getItemCount = (catId: string, type: 'PRODUCT' | 'SERVICE') => {
    if (type === 'PRODUCT') {
      return products.filter(p => p.organization_id === currentOrg.id && p.category_id === catId).length;
    }
    return services.filter(s => s.organization_id === currentOrg.id && s.category_id === catId).length;
  };

  const executeDelete = (id: string) => {
    deleteCategory(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrador de Categorías</h2>
              <p className="text-xs text-slate-500">Organiza el catálogo de {currentOrg.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch for Products vs Services */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('PRODUCT'); setIsFormOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'PRODUCT' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Categorías de Productos ({categories.filter(c => c.organization_id === currentOrg.id && c.type === 'PRODUCT').length})
            </button>
            <button
              onClick={() => { setActiveTab('SERVICE'); setIsFormOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'SERVICE' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Categorías de Servicios ({categories.filter(c => c.organization_id === currentOrg.id && c.type === 'SERVICE').length})
            </button>
          </div>

          {!isFormOpen && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" /> Nueva Categoría
            </button>
          )}
        </div>

        {/* Dynamic Category Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-xs font-bold text-slate-800">
                {editingCatId ? '✏️ Modificar Categoría' : '➕ Crear Nueva Categoría'}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre de la categoría</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Pollos a la Brasa, Pastas, Ropa..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ícono / Emoji</label>
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                >
                  {COMMON_EMOJIS.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Descripción breve (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Especialidades tradicionales de la casa"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
              >
                {editingCatId ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
          {orgCategories.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Tag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No hay categorías configuradas</p>
              <p className="text-[11px] text-slate-400">Crea categorías para organizar tus productos o servicios.</p>
            </div>
          ) : (
            orgCategories.map((c, idx) => {
              const count = getItemCount(c.id, c.type);
              const isDeleting = deleteConfirmId === c.id;

              return (
                <div key={c.id} className="pt-2 pb-2 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl p-2 rounded-xl bg-slate-100 shrink-0">
                      {c.icon || '🏷️'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {count} {c.type === 'PRODUCT' ? 'productos' : 'servicios'}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-slate-400 truncate">{c.description}</p>
                      )}
                    </div>
                  </div>

                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-200 animate-fadeIn">
                      <span className="text-[10px] font-bold text-rose-700">¿Eliminar?</span>
                      <button
                        onClick={() => executeDelete(c.id)}
                        className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Order buttons */}
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'UP')}
                        className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Subir posición"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === orgCategories.length - 1}
                        onClick={() => handleMove(idx, 'DOWN')}
                        className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${idx === orgCategories.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Bajar posición"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditForm(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Editar categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
