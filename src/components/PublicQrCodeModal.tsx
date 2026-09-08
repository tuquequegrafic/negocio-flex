/**
 * Negocio Flex - Modal de Código QR y Compartir (Fase 7)
 * Permite a clientes y administradores visualizar, descargar y compartir el código QR
 * oficial del catálogo web del negocio.
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Share2, QrCode } from 'lucide-react';
import { buildPublicBusinessUrl } from '../core/utils/public_url_helper';

interface PublicQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
}

export const PublicQrCodeModal: React.FC<PublicQrCodeModalProps> = ({
  isOpen,
  onClose,
  businessName,
  slug,
  logoUrl,
  primaryColor = '#4F46E5',
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const publicUrl = buildPublicBusinessUrl(slug);

  useEffect(() => {
    if (!isOpen || !slug) return;

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error al generar código QR:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, slug, publicUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrUrl;
    downloadLink.download = `qr-${slug}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Visita el catálogo digital oficial de ${businessName}`,
          url: publicUrl,
        });
      } catch {
        // Compartir cancelado por el usuario
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex flex-col items-center mb-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="w-14 h-14 rounded-2xl object-cover shadow-sm mb-3 border border-slate-100"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <QrCode className="w-6 h-6" />
            </div>
          )}
          <h3 className="font-extrabold text-slate-900 text-lg">{businessName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Escanea para abrir el catálogo digital</p>
        </div>

        {/* Contenedor del código QR */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner mb-4">
          {isGenerating ? (
            <div className="w-56 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR ${businessName}`}
              className="w-56 h-56 rounded-xl mx-auto block"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-rose-500">
              No se pudo generar el código QR
            </div>
          )}
        </div>

        {/* URL visible */}
        <div className="bg-slate-100/80 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 truncate mb-5 border border-slate-200/60">
          {publicUrl}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownload}
            disabled={!qrUrl}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar QR</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir por otras aplicaciones</span>
          </button>
        )}
      </div>
    </div>
  );
};
