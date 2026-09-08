import React, { useState } from 'react';
import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';
import { CashRegisterEntity } from '../../domain/entities/cash_register_entity';
import { Lock, Unlock, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

interface CashShiftControlModalProps {
  mode: 'OPEN' | 'CLOSE';
  register?: CashRegisterEntity;
  activeShift?: CashShiftEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOpen: (initialCash: number, notes?: string) => Promise<void>;
  onSubmitClose: (actualCash: number, notes?: string) => Promise<void>;
  isProcessing: boolean;
}

export const CashShiftControlModal: React.FC<CashShiftControlModalProps> = ({
  mode,
  register,
  activeShift,
  isOpen,
  onClose,
  onSubmitOpen,
  onSubmitClose,
  isProcessing,
}) => {
  const [amountInput, setAmountInput] = useState<string>(mode === 'OPEN' ? '100.00' : '');
  const [notesInput, setNotesInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountInput) || 0;
  const expectedCash = activeShift?.expectedCash ?? 0;
  const difference = mode === 'CLOSE' ? numericAmount - expectedCash : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount < 0) {
      setError('El monto no puede ser negativo.');
      return;
    }

    try {
      if (mode === 'OPEN') {
        await onSubmitOpen(numericAmount, notesInput.trim() || undefined);
      } else {
        await onSubmitClose(numericAmount, notesInput.trim() || undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el turno.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-6 text-white ${mode === 'OPEN' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
              {mode === 'OPEN' ? <Unlock className="w-6 h-6 text-emerald-200" /> : <Lock className="w-6 h-6 text-amber-300" />}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {mode === 'OPEN' ? 'Apertura de Turno' : 'Cierre y Arqueo de Caja'}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {register?.name || 'Caja Registradora'} ({register?.code || 'CAJA-01'})
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'CLOSE' && activeShift && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fondo Inicial:</span>
                <span className="font-semibold text-slate-900">S/ {activeShift.initialCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ventas en Efectivo:</span>
                <span className="font-semibold text-emerald-600">+ S/ {activeShift.salesCashTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Entradas / Sencillo (CASH_IN):</span>
                <span className="font-semibold text-teal-600">+ S/ {activeShift.cashInTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Salidas de Caja (CASH_OUT):</span>
                <span className="font-semibold text-rose-600">- S/ {activeShift.cashOutTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Saldo Esperado en Gaveta:</span>
                <span className="text-emerald-700">S/ {expectedCash.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {mode === 'OPEN' ? 'Fondo Inicial de Apertura (S/)' : 'Monto Real Contado en Gaveta (S/)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.10"
                min="0"
                required
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {mode === 'CLOSE' && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              Math.abs(difference) < 0.01
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : difference > 0
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {Math.abs(difference) < 0.01 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {Math.abs(difference) < 0.01
                    ? 'Cuadre Perfecto (Sin diferencia)'
                    : difference > 0
                    ? 'Sobrante de Caja'
                    : 'Faltante de Caja'}
                </span>
              </div>
              <span className="text-sm font-bold">
                {difference >= 0 ? `+ S/ ${difference.toFixed(2)}` : `- S/ ${Math.abs(difference).toFixed(2)}`}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observaciones / Justificación
            </label>
            <textarea
              rows={2}
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              placeholder={mode === 'OPEN' ? 'Ej: Turno mañana, billetes de baja denominación' : 'Ej: Arqueo sin novedades'}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                mode === 'OPEN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600'
              }`}
            >
              {isProcessing && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{mode === 'OPEN' ? 'Confirmar Apertura' : 'Proceder al Cierre'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
