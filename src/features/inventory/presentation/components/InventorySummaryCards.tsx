import React from 'react';
import { Package, DollarSign, AlertTriangle, History } from 'lucide-react';
import { formatCurrency } from '../../../../core/utils/formatters';
import { Product, InventoryMovement } from '../../../../types';

interface InventorySummaryCardsProps {
  products: Product[];
  movements: InventoryMovement[];
  currency: string;
}

export const InventorySummaryCards: React.FC<InventorySummaryCardsProps> = ({
  products,
  movements,
  currency,
}) => {
  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  
  // Valuación con precio de costo (o precio base si costo no fue registrado)
  const totalValuation = products.reduce((acc, p) => {
    const cost = p.cost_price !== undefined && p.cost_price > 0 ? p.cost_price : p.price * 0.7;
    return acc + (p.stock || 0) * cost;
  }, 0);

  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.min_stock_alert ?? 5)).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Unidades en Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalUnits.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            En {products.length} productos catalogados
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Valuación Total (Costo)
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalValuation, currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capital inmovilizado en mercadería
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Alertas de Stock
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            lowStockCount > 0 
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {lowStockCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {outOfStockCount > 0 ? `${outOfStockCount} agotados` : 'Ninguno agotado'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Libro Mayor Inmutable
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {movements.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Asientos auditables registrados
          </p>
        </div>
      </div>
    </div>
  );
};
