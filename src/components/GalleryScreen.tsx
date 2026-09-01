import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GalleryItem } from '../types';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  X, 
  Sparkles, 
  Eye, 
  ExternalLink,
  Tag,
  Check,
  Layers
} from 'lucide-react';

const SUGGESTED_PHOTOS_BY_TYPE: Record<string, Array<{ title: string; url: string; category: string }>> = {
  restaurant: [
    { title: 'Horno de Leña Tradicional', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', category: 'Ambiente' },
    { title: 'Salón Principal y Cava de Vinos', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80', category: 'Instalaciones' },
    { title: 'Nuestra Pasta Fresca Hecha a Mano', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80', category: 'Cocina' },
    { title: 'Mesa Servida para Grupos', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80', category: 'Eventos' }
  ],
  beauty: [
    { title: 'Estación de Colorimetría y Peinado', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', category: 'Salón' },
    { title: 'Área Spa de Manicure y Pedicure', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80', category: 'Spa' },
    { title: 'Productos Profesionales de Belleza', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', category: 'Productos' }
  ],
  gym: [
    { title: 'Zona de Pesas Libres y Fuerza', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80', category: 'Pesas' },
    { title: 'Box de Crossfit & Funcional', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80', category: 'Crossfit' },
    { title: 'Área de Cardio y Cintas', url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80', category: 'Cardio' }
  ],
  other: [
    { title: 'Vitrina y Exhibición Principal', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80', category: 'Local' },
    { title: 'Atención Personalizada', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80', category: 'Servicio' }
  ]
};

export const GalleryScreen: React.FC = () => {
  const { 
    currentOrg, 
    galleryItems, 
    addGalleryItem, 
    removeGalleryItem, 
    reorderGalleryItems, 
    setActiveView,
    canAddGalleryImage,
    openUpgradeModal,
    getCurrentPlan
  } = useApp();

  const currentPlan = getCurrentPlan();
  const galleryLimit = canAddGalleryImage(currentOrg.id);

  const orgGallery = galleryItems
    .filter(g => g.organization_id === currentOrg.id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);

  const openAddPhotoModal = () => {
    const limit = canAddGalleryImage(currentOrg.id);
    if (!limit.allowed) {
      openUpgradeModal(limit.message);
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl.trim()) return;

    const limit = canAddGalleryImage(currentOrg.id);
    if (!limit.allowed) {
      openUpgradeModal(limit.message);
      return;
    }

    addGalleryItem({
      organization_id: currentOrg.id,
      title: formTitle.trim() || undefined,
      caption: formCaption.trim() || undefined,
      image_url: formImageUrl.trim(),
      display_order: orgGallery.length + 1
    });

    setFormTitle('');
    setFormCaption('');
    setFormImageUrl('');
    setIsModalOpen(false);
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newItems = [...orgGallery];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    reorderGalleryItems(updated);
  };

  const handleAddSuggested = (item: { title: string; url: string; category: string }) => {
    const limit = canAddGalleryImage(currentOrg.id);
    if (!limit.allowed) {
      openUpgradeModal(limit.message);
      return;
    }

    addGalleryItem({
      organization_id: currentOrg.id,
      title: item.title,
      caption: item.category,
      image_url: item.url,
      display_order: orgGallery.length + 1
    });
  };

  const suggestedList = SUGGESTED_PHOTOS_BY_TYPE[currentOrg.business_type] || SUGGESTED_PHOTOS_BY_TYPE.other;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <h1 className="text-2xl font-black text-slate-900">Galería de Fotos</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {orgGallery.length} / {currentPlan?.max_images >= 9999 ? '∞' : currentPlan?.max_images} fotos ({currentPlan?.name})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Muestra tus instalaciones, platos, ambiente o trabajos realizados en la página web pública.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddPhotoModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Foto</span>
          </button>
        </div>
      </div>

      {/* 2. Gallery Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Fotos Publicadas ({orgGallery.length})
          </h3>
          <button
            onClick={() => setActiveView('client_catalog')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver cómo se ve en la web</span>
          </button>
        </div>

        {orgGallery.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Tu galería está vacía</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Agrega fotografías de tu local, platillos o equipo para generar confianza en tus clientes.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Subir Primera Foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {orgGallery.map((item, index) => (
              <div 
                key={item.id}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-slate-200 cursor-pointer" onClick={() => setPreviewImage(item)}>
                  <img 
                    src={item.image_url} 
                    alt={item.title || 'Foto de galería'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="p-2 rounded-xl bg-white/90 text-slate-900 text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> Ampliar
                    </span>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
                    #{index + 1}
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2 bg-white">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate">
                      {item.title || 'Sin título'}
                    </h4>
                    {item.caption && (
                      <p className="text-[11px] text-slate-400 truncate">{item.caption}</p>
                    )}
                  </div>

                  {/* Reorder and Delete Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(index, 'UP')}
                        disabled={index === 0}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Mover antes"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'DOWN')}
                        disabled={index === orgGallery.length - 1}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Mover después"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar esta foto de la galería?')) {
                          removeGalleryItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Suggested Photos Section */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fotos sugeridas para tu tipo de negocio:
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {suggestedList.map((sug, i) => (
              <div 
                key={i} 
                className="p-2 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
              >
                <img src={sug.url} alt={sug.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                <div className="truncate flex-1">
                  <span className="text-[11px] font-bold text-slate-800 truncate block">{sug.title}</span>
                  <span className="text-[9px] text-slate-400 block">{sug.category}</span>
                </div>
                <button
                  onClick={() => handleAddSuggested(sug)}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  title="Agregar a mi galería"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Agregar Foto a la Galería
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">URL de la Imagen *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              {formImageUrl && (
                <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-slate-100">
                  <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Fotografía</label>
                <input
                  type="text"
                  placeholder="Ej. Nuestro Horno de Leña, Terraza Exterior..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Etiqueta o Categoría (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Ambiente, Platos, Eventos..."
                  value={formCaption}
                  onChange={e => setFormCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs"
                >
                  Publicar Foto
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. Fullscreen Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden p-2 text-white" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage.image_url} alt={previewImage.title} className="w-full max-h-[70vh] object-contain rounded-2xl" />
            <div className="p-4">
              <h4 className="text-base font-bold">{previewImage.title || 'Foto de Galería'}</h4>
              {previewImage.caption && <p className="text-xs text-slate-400 mt-0.5">{previewImage.caption}</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
