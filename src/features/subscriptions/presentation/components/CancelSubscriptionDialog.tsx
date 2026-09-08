/**
 * Negocio Flex - CancelSubscriptionDialog Component (Fase 10: Presentación)
 * Diálogo seguro de confirmación de cancelación de suscripción.
 */

import React, { useState } from 'react';
import { AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason?: string) => Promise<void>;
  planName: string;
  periodEnd?: string;
  loading?: boolean;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  planName,
  periodEnd,
  loading = false,
}) => {
  const [reason, setReason] = useState('Cambio temporal en la operativa del negocio');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirmCancel(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="cancel-subscription-dialog-content"
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Cancelar Suscripción
            </h3>
          </div>
          <button
            id="close-cancel-dialog-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            ¿Estás seguro de que deseas cancelar tu suscripción al <strong className="text-slate-900">{planName}</strong>?
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tus datos históricos están protegidos</span>
            </div>
            <p>
              Tus productos, clientes, pedidos y catálogos permanecerán guardados. No se eliminará ningún registro.
            </p>
            {periodEnd && (
              <p className="font-semibold text-indigo-700">
                Mantendrás acceso operativo hasta el fin de tu ciclo actual: {new Date(periodEnd).toLocaleDateString('es-PE')}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Motivo de cancelación (opcional)
            </label>
            <select
              id="cancel-reason-select"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="Cambio temporal en la operativa del negocio">Cambio temporal en la operativa del negocio</option>
              <option value="No utilizo todas las funcionalidades">No utilizo todas las funcionalidades</option>
              <option value="Costos del servicio">Costos del servicio</option>
              <option value="Cierre de actividades comerciales">Cierre de actividades comerciales</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            id="keep-plan-btn"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            Mantener mi Plan
          </button>
          <button
            id="confirm-cancel-subscription-btn"
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
          </button>
        </div>
      </div>
    </div>
  );
};
