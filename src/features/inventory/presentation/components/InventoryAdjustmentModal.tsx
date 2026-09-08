import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, InventoryMovementType } from '../../../../types';

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  preselectedProduct?: Product | null;
  currency: string;
  onAdjust: (params: {
    productId: string;
    movementType: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL_LOAD' | 'REVERSAL';
    quantity: number;
    direction?: 'IN' | 'OUT';
    unitCost?: number;
    reason: string;
    referenceType?: any;
    referenceId?: string;
  }) => Promise<any>;
}

export const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({
  isOpen,
  onClose,
  products,
  preselectedProduct,
  currency,
  onAdjust,
}) => {
  const [productId, setProductId] = useState<string>(preselectedProduct?.id || products[0]?.id || '');
  const [movementCategory, setMovementCategory] = useState<'IN' | 'OUT' | 'AUDIT'>('IN');
  const [movementType, setMovementType] = useState<InventoryMovementType>('PURCHASE');
  const [quantity, setQuantity] = useState<string>('10');
  const [unitCost, setUnitCost] = useState<string>(
    preselectedProduct?.cost_price ? String(preselectedProduct.cost_price) : ''
  );
  const [reason, setReason] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProd = products.find(p => p.id === productId);

  const handleCategoryChange = (cat: 'IN' | 'OUT' | 'AUDIT') => {
    setMovementCategory(cat);
    if (cat === 'IN') {
      setMovementType('PURCHASE');
    } else if (cat === 'OUT') {
      setMovementType('ADJUSTMENT');
    } else {
      setMovementType('INITIAL_LOAD');
    }
  };

  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const p = products.find(prod => prod.id === newProdId);
    if (p && p.cost_price) {
      setUnitCost(String(p.cost_price));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedQty = parseInt(quantity, 10);
    if (!productId) {
      setErrorMessage('Debe seleccionar un producto.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Debe ingresar un motivo para registrar el movimiento en el Libro Mayor.');
      return;
    }

    const parsedCost = unitCost ? parseFloat(unitCost) : undefined;
    if (parsedCost !== undefined && (isNaN(parsedCost) || parsedCost < 0)) {
      setErrorMessage('El costo unitario no puede ser negativo.');
      return;
    }

    // HIGH-02: La cantidad del movimiento debe ser SIEMPRE un entero positivo (> 0).
    // La semántica de salida o merma se comunica mediante el parámetro direction: 'OUT'.
    const finalQty = parsedQty;
    let finalMovementType = movementType;
    const direction: 'IN' | 'OUT' = movementCategory === 'OUT' ? 'OUT' : 'IN';

    if (movementCategory === 'OUT') {
      finalMovementType = 'ADJUSTMENT';
    }

    setIsSubmitting(true);
    try {
      await onAdjust({
        productId,
        movementType: finalMovementType as any,
        quantity: finalQty,
        direction,
        unitCost: parsedCost,
        reason: reason.trim(),
        referenceType: movementCategory === 'IN' ? 'PURCHASE_ORDER' : 'MANUAL_ADJUSTMENT',
        referenceId: referenceId.trim() || undefined,
      });

      setSuccessMessage('Movimiento registrado con éxito en el Libro Mayor de Inventario.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar el ajuste de inventario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ajuste de Inventario (Kardex)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra un movimiento inmutable en el Libro Mayor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipo de Operación Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('IN')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                  movementCategory === 'IN'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Entrada / Compra</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('OUT')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                  movementCategory === 'OUT'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                <span>Salida / Merma</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('AUDIT')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                  movementCategory === 'AUDIT'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Carga Inicial</span>
              </button>
            </div>
          </div>

          {/* Selector de Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Producto Destino
            </label>
            <select
              value={productId}
              onChange={e => handleProductChange(e.target.value)}
              disabled={isSubmitting || !!preselectedProduct}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku ? `[${p.sku}] ` : ''}{p.name} (Stock Actual: {p.stock})
                </option>
              ))}
            </select>
            {selectedProd && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Stock actual: <strong className="text-slate-800 dark:text-slate-200">{selectedProd.stock} unidades</strong>
                {selectedProd.cost_price ? ` · Costo actual: ${currency} ${selectedProd.cost_price.toFixed(2)}` : ''}
              </p>
            )}
          </div>

          {/* Cantidad & Costo Unitario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {movementCategory === 'OUT' ? 'Unidades a Descontar' : 'Unidades a Ingresar'}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="10"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Costo Unitario ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                placeholder="Opcional"
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Motivo Justificado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo del Ajuste (Auditoría) *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={
                movementCategory === 'IN' 
                  ? 'Ej: Recepción Factura F001-4902 de Distribuidora Lima' 
                  : movementCategory === 'OUT'
                  ? 'Ej: Merma por vencimiento o rotura en almacén'
                  : 'Ej: Inventario físico de apertura de periodo'
              }
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Referencia Externa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Referencia / N° Documento (Opcional)
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder="Ej: F001-4902 / GR-889"
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
