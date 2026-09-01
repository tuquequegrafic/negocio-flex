import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Cookie, HelpCircle, X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'cookies' | 'refunds';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cookies' | 'refunds'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Centro Legal y Políticas de Seguridad</h3>
              <p className="text-xs text-slate-500 font-medium">Plataforma SaaS Negocio Flex • Cumplimiento Normativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/40 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Términos y Condiciones
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Política de Privacidad
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'cookies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            Política de Cookies
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'refunds'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Cancelación y Reembolsos
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">1. Aceptación del Servicio</h4>
              <p>
                Al registrarse y utilizar la plataforma <strong>Negocio Flex</strong>, el usuario acepta estos Términos y Condiciones. 
                Negocio Flex provee software como servicio (SaaS) para la digitalización de catálogos, recepción de pedidos vía WhatsApp y administración comercial multi-inquilino.
              </p>
              
              <h4 className="font-bold text-slate-900 text-sm">2. Uso Permitido y Responsabilidad del Contenido</h4>
              <p>
                Cada negocio es el único responsable de la exactitud de los precios, descripción de productos, licencias comerciales y cumplimiento de pedidos realizados por sus clientes finales.
                Queda estrictamente prohibido el comercio de artículos ilícitos, piratería o contenido fraudulento.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">3. Disponibilidad y Niveles de Servicio (SLA)</h4>
              <p>
                Nos esforzamos por garantizar una disponibilidad del 99.9% anual respaldada por infraestructura en la nube segura con replicación en tiempo real y copias de seguridad continuas.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">1. Protección y Privacidad de Datos</h4>
              <p>
                En Negocio Flex respetamos la privacidad de los propietarios de negocios y sus clientes finales. Los datos recolectados (nombres, números de teléfono para delivery, historial de pedidos) son procesados exclusivamente para el funcionamiento de la tienda y no son vendidos a terceros bajo ninguna circunstancia.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">2. Aislamiento de Seguridad (Row Level Security)</h4>
              <p>
                Cada base de datos e inquilino opera bajo políticas estrictas de seguridad por fila (RLS). Los administradores de un negocio no tienen acceso bajo ningún concepto a la información de otros negocios registrados.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">3. Derechos ARCO</h4>
              <p>
                Los usuarios pueden solicitar el acceso, rectificación, cancelación u oposición al tratamiento de sus datos personales en cualquier momento desde su panel o escribiendo al canal oficial de soporte.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">1. Uso de Almacenamiento Local y Cookies</h4>
              <p>
                Negocio Flex utiliza cookies técnicas y almacenamiento local esencial para mantener la sesión de usuario activa, recordar el carrito de compras del cliente y garantizar el funcionamiento sin conexión (modo offline resiliente).
              </p>
              <p>
                No utilizamos cookies invasivas de rastreo de terceros con fines de publicidad no deseada.
              </p>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">1. Prueba Gratuita y Período de Gracia</h4>
              <p>
                Todos los nuevos negocios disfrutan de <strong>14 días de prueba gratuita completa</strong> sin necesidad de ingresar tarjeta de crédito.
              </p>
              
              <h4 className="font-bold text-slate-900 text-sm">2. Cancelación en Cualquier Momento</h4>
              <p>
                Puedes cancelar tu suscripción en cualquier momento desde la sección <em>"Mi Plan y Facturación"</em>. Al cancelar, no se realizarán cobros adicionales y tus datos permanecerán resguardados de forma segura si decides reactivarla en el futuro.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">3. Política de Reembolso</h4>
              <p>
                Ofrecemos garantía de satisfacción de 7 días posteriores al primer cobro en planes mensuales si el servicio no cumple con tus expectativas comerciales.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Última actualización: Agosto 2026</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Entendido y Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
