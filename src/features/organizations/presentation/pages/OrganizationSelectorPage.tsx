/**
 * Negocio Flex - Selector de Organización / Empresa
 * Permite cambiar de negocio o registrar una nueva tienda/empresa.
 */

import React, { useState } from 'react';
import { useOrganization } from '../providers/OrganizationContext';
import { BusinessType } from '../../domain/entities/organization_entity';
import { M3Card, M3Button, M3TextField, M3Badge } from '../../../../core/widgets/M3Components';
import { Building2, Plus, ArrowRight, Store, Scissors, Wrench, Check } from 'lucide-react';

export interface OrganizationSelectorPageProps {
  onSelect: () => void;
}

export const OrganizationSelectorPage: React.FC<OrganizationSelectorPageProps> = ({ onSelect }) => {
  const { organizations, activeOrganization, selectOrganization, createNewOrganization } = useOrganization();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('pasteleria');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSelect = (orgId: string) => {
    selectOrganization(orgId);
    onSelect();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createNewOrganization(name, businessType, description, phone);
      setShowModal(false);
      setName('');
      setDescription('');
      setPhone('');
      onSelect();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tus Negocios y Empresas
            </h1>
            <p className="text-sm text-slate-500">
              Selecciona la organización activa o registra un nuevo punto de venta
            </p>
          </div>

          <M3Button
            variant="filled"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nuevo Negocio
          </M3Button>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => {
            const isSelected = activeOrganization?.id === org.id;

            return (
              <M3Card
                key={org.id}
                variant={isSelected ? 'elevated' : 'outlined'}
                className={`cursor-pointer transition-all hover:border-indigo-400 relative p-5 ${
                  isSelected ? 'ring-2 ring-indigo-600 bg-white' : 'bg-white'
                }`}
                onClick={() => handleSelect(org.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: org.branding.primaryColor }}
                    >
                      {org.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{org.name}</h3>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-indigo-600 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{org.description || 'Sin descripción'}</p>
                    </div>
                  </div>

                  <M3Badge label={org.businessType} variant="neutral" size="sm" />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Moneda: <strong>{org.currency}</strong></span>
                  <span className="flex items-center gap-1 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Gestionar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </M3Card>
            );
          })}
        </div>

        {/* Modal: Nuevo Negocio */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Negocio</h2>
                <p className="text-xs text-slate-500">Configura tu nueva empresa o sucursal</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5">
                <M3TextField
                  label="Nombre del Negocio"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Sabores del Perú"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Rubro del Negocio</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value as BusinessType)}
                    className="w-full text-sm rounded-xl border border-slate-300 bg-white py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="pasteleria">🎂 Pastelería / Repostería</option>
                    <option value="restaurante">🍽️ Restaurante / Cafetería</option>
                    <option value="barberia">💈 Barbería / Salón de Belleza</option>
                    <option value="ferreteria">🔧 Ferretería / Materiales</option>
                    <option value="veterinaria">🐾 Veterinaria / Pet Shop</option>
                    <option value="boutique">👗 Boutique / Ropa</option>
                    <option value="servicios_generales">💼 Servicios Generales</option>
                    <option value="personalizado">✨ Personalizado</option>
                  </select>
                </div>

                <M3TextField
                  label="Teléfono / WhatsApp"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                />

                <M3TextField
                  label="Descripción breve"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Especialistas en..."
                />

                <div className="flex gap-2 justify-end pt-3">
                  <M3Button
                    type="button"
                    variant="outlined"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </M3Button>
                  <M3Button
                    type="submit"
                    variant="filled"
                    isLoading={isCreating}
                  >
                    Crear Empresa
                  </M3Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
