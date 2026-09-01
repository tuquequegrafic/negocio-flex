import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { 
  BookOpen, 
  Store, 
  ShoppingBag, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  Zap, 
  X, 
  ShieldCheck,
  Search,
  Bell,
  Clock,
  Sparkles,
  Layers,
  FileDown
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'ADMIN' | 'CUSTOMER';
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'ADMIN'
}) => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CUSTOMER'>(initialRole);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="icon-only" size="sm" />
            <div>
              <h3 className="font-black text-base text-white">Manual y Guía de Uso Oficial</h3>
              <p className="text-xs text-indigo-300 font-medium">Plataforma SaaS Negocio Flex • Tutoriales Paso a Paso</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs & Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setSelectedRole('ADMIN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedRole === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Manual para Administradores</span>
            </button>

            <button
              onClick={() => setSelectedRole('CUSTOMER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedRole === 'CUSTOMER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Guía para Clientes / Compradores</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tema o paso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">

          {/* ========================================================================= */}
          {/* GUÍA PARA ADMINISTRADORES */}
          {/* ========================================================================= */}
          {selectedRole === 'ADMIN' && (
            <div className="space-y-6">
              
              {/* Intro Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-indigo-950 text-sm">Bienvenido al Panel de Control de tu Negocio</h4>
                  <p className="text-indigo-800/90 mt-0.5 leading-relaxed">
                    Aprende cómo configurar tu tienda, publicar productos, recibir pedidos directos a tu WhatsApp y escalar tus ventas sin comisiones.
                  </p>
                </div>
              </div>

              {/* Paso 1: Configuración Inicial y WhatsApp */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-black text-slate-900 text-sm">Configuración de tu Negocio y WhatsApp Receptor</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Es el paso fundamental para recibir los pedidos de tus clientes:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pl-8.5 list-disc list-inside font-medium">
                  <li>Ve a <strong>"Personalizar Tienda"</strong> en el menú lateral.</li>
                  <li>Ingresa el <strong>Nombre de tu Negocio</strong>, eslogan, logo y portada.</li>
                  <li><strong>Número de WhatsApp:</strong> Ingresa el número con el código de país (ejemplo: <code>51999888777</code> en Perú). A este número llegarán todos los pedidos estructurados.</li>
                  <li>Configura tu dirección física, horarios de atención y costos de delivery.</li>
                </ul>
              </div>

              {/* Paso 2: Crear Categorías y Productos */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-black text-slate-900 text-sm">Carga de Catálogo (Categorías, Productos y Precios)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Organiza tu menú o catálogo de productos para facilitar la compra a tus clientes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">📂 Categorías</span>
                    <p className="text-slate-500">Crea secciones como <em>Bebidas</em>, <em>Platos Fuertes</em>, <em>Postres</em>, <em>Pizzas</em> o <em>Servicios</em>.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900 block">📦 Productos y Promos</span>
                    <p className="text-slate-500">Agrega nombre, foto atractiva, precio normal, precio promocional (oferta) y marca con la estrella ⭐ si es <em>Destacado</em>.</p>
                  </div>
                </div>
              </div>

              {/* Paso 3: Gestión de Pedidos en Tiempo Real */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-black text-slate-900 text-sm">Recepción y Estados de Pedidos</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Cuando un cliente pide desde la tienda web, suceden 2 cosas en simultáneo:
                </p>
                <div className="space-y-2 pl-8.5 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Notificación en Pantalla:</strong> Aparece una alerta sonora y visual en tu panel en tiempo real.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Mensaje en WhatsApp:</strong> El cliente te escribe con el número de pedido (ej: <code>#000125</code>) y el resumen listo para atender.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Cambio de Estados:</strong> En la sección <em>"Pedidos"</em> puedes actualizar el estado: <code>Pendiente ➔ Confirmado ➔ En Preparación ➔ Listo ➔ Enviado ➔ Entregado</code>.</span>
                  </div>
                </div>
              </div>

              {/* Paso 4: Clientes (CRM) y Métricas */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-black text-slate-900 text-sm">CRM de Clientes & Estadísticas de Ventas</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 pl-8.5 list-disc list-inside font-medium">
                  <li>El sistema registra automáticamente el teléfono, nombre y dirección de cada cliente para futuras recompras.</li>
                  <li>En el <strong>Dashboard</strong> revisa tus ingresos del día, ticket promedio y los productos más vendidos.</li>
                </ul>
              </div>

              {/* Paso 5: Planes, Facturación y Dominio Propio */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">5</span>
                  <h4 className="font-black text-slate-900 text-sm">Suscripción SaaS, Pagos y Dominio Propio</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 pl-8.5 list-disc list-inside font-medium">
                  <li>En <strong>"Mi Plan y Facturación"</strong> puedes ver los días restantes de tu prueba o cambiar de plan (Inicial S/29, Profesional S/49, Premium S/79).</li>
                  <li>Acepta pagos de suscripción con <strong>Culqi</strong>, <strong>Mercado Pago</strong> o <strong>Yape / Plin</strong>.</li>
                  <li>Si cuentas con el Plan Premium, puedes vincular tu propio dominio web (ej: <code>www.tutienda.com</code>).</li>
                </ul>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* GUÍA PARA CLIENTES / COMPRADORES */}
          {/* ========================================================================= */}
          {selectedRole === 'CUSTOMER' && (
            <div className="space-y-6">
              
              {/* Intro Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-emerald-950 text-sm">Cómo Comprar en la Tienda Online</h4>
                  <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                    Es muy fácil, rápido y no necesitas descargar ninguna aplicación ni crear contraseñas complicadas.
                  </p>
                </div>
              </div>

              {/* Paso 1: Explorar Catálogo */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-black text-slate-900 text-sm">Explora los Productos o Servicios</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Ingresa al enlace de la tienda desde tu celular o computadora:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pl-8.5 list-disc list-inside font-medium">
                  <li>Usa el <strong>buscador</strong> o presiona las <strong>categorías</strong> para encontrar lo que deseas.</li>
                  <li>Haz clic sobre cualquier producto para ver su foto ampliada, descripción e ingredientes.</li>
                  <li>Presiona el botón <strong>"+ Agregar al Carrito"</strong> para añadir los productos que quieras.</li>
                </ul>
              </div>

              {/* Paso 2: Revisar Carrito */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-black text-slate-900 text-sm">Revisa tu Carrito de Compras</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Presiona el botón flotante del carrito en la esquina inferior:
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pl-8.5 list-disc list-inside font-medium">
                  <li>Aumenta o disminuye cantidades con los botones <strong>+</strong> y <strong>-</strong>.</li>
                  <li>Revisa el subtotal, costo de envío y total exacto a pagar.</li>
                  <li>Presiona <strong>"Continuar con el Pedido"</strong>.</li>
                </ul>
              </div>

              {/* Paso 3: Datos de Envío y Método de Pago */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-black text-slate-900 text-sm">Ingresa tus Datos de Entrega</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Completa el formulario en segundos:
                </p>
                <div className="space-y-2 pl-8.5 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Tipo de Entrega:</strong> Elige entre <em>Delivery a domicilio</em> o <em>Recojo en el local</em>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Tus Datos:</strong> Escribe tu nombre, número de celular y dirección con referencias de entrega.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Método de Pago Preferido:</strong> Yape / Plin, Efectivo, Tarjeta o Transferencia bancaria.</span>
                  </div>
                </div>
              </div>

              {/* Paso 4: Enviar Pedido a WhatsApp */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-black text-slate-900 text-sm">Confirmación Instantánea en WhatsApp</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                  Al presionar <strong>"Enviar Pedido a WhatsApp"</strong>:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs ml-8.5 space-y-1">
                  <div>🍗 *¡HOLA! DESEO REALIZAR UN PEDIDO:*</div>
                  <div className="text-slate-300">📋 *Pedido:* #000125</div>
                  <div className="text-slate-300">---------------------------------</div>
                  <div className="text-white">▪ 1x 1/4 Pollo a la Brasa - S/ 21.90</div>
                  <div className="text-white">▪ 1x Inca Kola 1.5L - S/ 10.00</div>
                  <div className="text-slate-300">---------------------------------</div>
                  <div className="text-emerald-300 font-bold">💰 *TOTAL A PAGAR:* S/ 31.90</div>
                  <div className="text-slate-300">🛵 *Entrega:* Delivery (Av. Principal 123)</div>
                  <div className="text-slate-300">👤 *Cliente:* Juan Pérez (987654321)</div>
                </div>
                <p className="text-xs text-slate-500 pl-8.5">
                  El WhatsApp del negocio se abrirá automáticamente con este mensaje listo para enviar. ¡Y listo! El negocio te confirmará el tiempo de entrega de inmediato.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Soporte y Ayuda en Línea • Negocio Flex</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Cerrar Manual
          </button>
        </div>

      </div>
    </div>
  );
};
