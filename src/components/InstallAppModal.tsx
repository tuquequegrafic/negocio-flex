import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  QrCode, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop,
  Apple,
  Store,
  ShoppingBag,
  Layers,
  ArrowRight,
  Bell
} from 'lucide-react';
import QRCode from 'qrcode';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  businessSlug?: string;
  targetRole?: 'ADMIN' | 'CUSTOMER';
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  businessName = 'Negocio Flex',
  businessSlug,
  targetRole = 'ADMIN'
}) => {
  const [deviceType, setDeviceType] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('ANDROID');
  const [activeTab, setActiveTab] = useState<'AUTO' | 'ANDROID' | 'IOS' | 'QR'>('AUTO');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Determine current app URL for installation
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://negocioflex.com';
  const installUrl = businessSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${businessSlug}`
    : currentAppUrl;

  useEffect(() => {
    // Detect OS / Device
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setDeviceType('IOS');
      } else if (/android/i.test(userAgent)) {
        setDeviceType('ANDROID');
      } else {
        setDeviceType('DESKTOP');
      }

      // Check if already running in standalone mode (installed PWA)
      if (
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true);
      }
    }

    // Capture PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Generate QR Code for mobile scanning
  useEffect(() => {
    QRCode.toDataURL(installUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [installUrl]);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // If native prompt is not available, show specific step instructions
      if (deviceType === 'IOS') {
        setActiveTab('IOS');
      } else if (deviceType === 'ANDROID') {
        setActiveTab('ANDROID');
      } else {
        setActiveTab('QR');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(installUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Instalar App en el Teléfono</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PWA Nativa
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                {targetRole === 'CUSTOMER' 
                  ? `Tienda Móvil de ${businessName}` 
                  : 'Panel de Control y Notificaciones en Tiempo Real'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits bar */}
        <div className="bg-indigo-50/80 px-6 py-3 border-b border-indigo-100/70 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-indigo-900">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sin ocupar espacio (1.2 MB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Acceso directo con 1 toque</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
            <span>Sin pasar por Play Store</span>
          </div>
        </div>

        {/* Device Selection Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('AUTO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'AUTO'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recomendado ({deviceType === 'IOS' ? 'iPhone' : deviceType === 'ANDROID' ? 'Android' : 'PC'})</span>
          </button>

          <button
            onClick={() => setActiveTab('ANDROID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ANDROID'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('IOS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'IOS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-slate-800" />
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => setActiveTab('QR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'QR'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Escanear QR</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-emerald-950">¡La aplicación ya está instalada en este dispositivo!</p>
                <p className="text-emerald-800">Estás disfrutando de la versión optimizada en pantalla completa.</p>
              </div>
            </div>
          )}

          {/* TAB: AUTO (DETECTED DEVICE) */}
          {activeTab === 'AUTO' && (
            <div className="space-y-5">
              
              {/* DESKTOP CASE -> SHOW QR CODE & LINK */}
              {deviceType === 'DESKTOP' && (
                <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="bg-white p-3 rounded-2xl border-2 border-indigo-100 shadow-md shrink-0 flex flex-col items-center">
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="Código QR para instalar" 
                        className="w-44 h-44 rounded-xl"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-xl">
                        <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                      </div>
                    )}
                    <span className="text-[11px] font-black text-slate-700 mt-2 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-indigo-600" />
                      Apunta tu cámara
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        Paso Rápido
                      </span>
                      <h4 className="font-black text-slate-900 text-base">Descarga en tu Celular en 5 Segundos</h4>
                    </div>

                    <ol className="space-y-2 font-medium list-decimal list-inside text-slate-700">
                      <li>Abre la aplicación de <strong>Cámara</strong> o escáner QR de tu teléfono.</li>
                      <li>Apunta al código QR que ves en pantalla.</li>
                      <li>Toca el enlace para abrir e instalar la app directamente.</li>
                    </ol>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                        <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                      </button>

                      {deferredPrompt && (
                        <button
                          onClick={handleNativeInstall}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                        >
                          <Download className="w-4 h-4" />
                          <span>Instalar en esta PC</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ANDROID AUTO CASE */}
              {deviceType === 'ANDROID' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-950 text-sm">Dispositivo Android Detectado</h4>
                        <p className="text-xs text-emerald-800">Instala la aplicación con 1 solo clic</p>
                      </div>
                    </div>

                    <button
                      onClick={handleNativeInstall}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                    >
                      <Download className="w-5 h-5" />
                      <span>Instalar en mi Celular Ahora</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-900 block">¿No apareció el botón automático?</span>
                    <p className="text-slate-600">
                      En Google Chrome, toca los <strong>3 puntos (⋮)</strong> en la esquina superior derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* IOS AUTO CASE */}
              {deviceType === 'IOS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Apple className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm">Instalación en iPhone / iPad (Safari)</h4>
                        <p className="text-xs text-slate-300">Sigue estos 3 pasos rápidos:</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900">1. Toca "Compartir"</span>
                      <p className="text-slate-500 text-[11px]">En la barra inferior de Safari presiona el botón con el ícono de compartir.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900">2. "Agregar a Inicio"</span>
                      <p className="text-slate-500 text-[11px]">Desliza hacia abajo y presiona <strong>"Agregar a pantalla de inicio"</strong>.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900">3. ¡Listo!</span>
                      <p className="text-slate-500 text-[11px]">El ícono de la app aparecerá en tu iPhone lista para abrirse sin barra de navegador.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: ANDROID MANUAL GUIDE */}
          {activeTab === 'ANDROID' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-emerald-950 text-sm">Guía Paso a Paso para Android</h4>
                  <p className="text-emerald-800">Compatible con Chrome, Samsung Internet, Edge y Brave</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Abre el menú de opciones</span>
                    <p className="text-slate-500 mt-0.5">En la esquina superior derecha de tu navegador toca los 3 puntos (⋮).</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Selecciona "Instalar Aplicación"</span>
                    <p className="text-slate-500 mt-0.5">O "Agregar a la pantalla principal" según el navegador.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Presiona "Instalar"</span>
                    <p className="text-slate-500 mt-0.5">La app se descargará instantáneamente en tu cajón de aplicaciones con el logo del negocio.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Intentar Instalación Directa</span>
              </button>
            </div>
          )}

          {/* TAB: IOS MANUAL GUIDE */}
          {activeTab === 'IOS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Apple className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-white text-sm">Guía Paso a Paso para iPhone y iPad</h4>
                  <p className="text-indigo-200">Requiere abrir la página en el navegador Safari</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">1. Presiona el botón "Compartir"</span>
                    <p className="text-slate-500 mt-0.5">Ubicado en la parte inferior central de la pantalla de Safari.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">2. Selecciona "Agregar a pantalla de inicio"</span>
                    <p className="text-slate-500 mt-0.5">Desliza el menú de opciones hacia abajo hasta encontrar el ícono del cuadrado con el signo más (+).</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">3. Presiona "Agregar" (Arriba a la derecha)</span>
                    <p className="text-slate-500 mt-0.5">¡Listo! La app se abrirá en pantalla completa como una app descargada de la App Store.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: QR CODE */}
          {activeTab === 'QR' && (
            <div className="flex flex-col items-center text-center space-y-4 p-4">
              <div className="bg-white p-3 rounded-2xl border-2 border-indigo-100 shadow-xl">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Código QR para celular" 
                    className="w-52 h-52 rounded-xl"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-slate-100 rounded-xl">
                    <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="space-y-1 max-w-sm">
                <h4 className="font-black text-slate-900 text-sm">Escanea este código con tu teléfono</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apunta la cámara de tu smartphone para abrir la tienda o panel móvil e instalarlo al instante.
                </p>
              </div>

              <div className="w-full max-w-sm flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={installUrl} 
                  className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security & Features footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conexión segura cifrada SSL / HTTPS</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Actualizaciones automáticas en tiempo real</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Tecnología PWA Multiplataforma • Negocio Flex</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
