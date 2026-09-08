import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import { CashShiftEntity } from '../../domain/entities/cash_shift_entity';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: CashShiftEntity | null;
  onSubmit: (type: 'CASH_IN' | 'CASH_OUT', amount: number, reason: string) => Promise<void>;
  isProcessing: boolean;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  onSubmit,
  isProcessing,
}) => {
  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [amountInput, setAmountInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountInput) || 0;
  const availableCash = activeShift?.expectedCash ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount <= 0) {
      setError('El monto debe ser estrictamente mayor a cero.');
      return;
    }

    if (!reasonInput.trim()) {
      setError('El motivo del movimiento es obligatorio para auditoría.');
      return;
    }

    if (movementType === 'CASH_OUT' && numericAmount > availableCash) {
      setError(`Fondos insuficientes en gaveta. Disponible: S/ ${availableCash.toFixed(2)}`);
      return;
    }

    try {
      await onSubmit(movementType, numericAmount, reasonInput.trim());
      setAmountInput('');
      setReasonInput('');
    } catch (err: any) {
      setError(err.message || 'Error al registrar el movimiento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Movimiento de Caja</h3>
            <p className="text-xs text-slate-500">
              Disponible en gaveta: <span className="font-semibold text-emerald-600">S/ {availableCash.toFixed(2)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMovementType('CASH_IN')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                movementType === 'CASH_IN'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Entrada (CASH_IN)</span>
            </button>
            <button
              type="button"
              onClick={() => setMovementType('CASH_OUT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                movementType === 'CASH_OUT'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Salida (CASH_OUT)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monto a {movementType === 'CASH_IN' ? 'Ingresar' : 'Retirar'} (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.10"
                min="0.10"
                required
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo o Justificación Obligatoria
            </label>
            <textarea
              rows={2}
              required
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder={
                movementType === 'CASH_IN'
                  ? 'Ej: Aporte de sencillo por administración'
                  : 'Ej: Compra de insumos urgentes / pago de delivery'
              }
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 ${
                movementType === 'CASH_IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isProcessing && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{movementType === 'CASH_IN' ? 'Registrar Entrada' : 'Registrar Salida'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
