import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowDownRight, 
  ArrowUpRight, 
  RotateCcw, 
  Sliders, 
  Package, 
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../core/utils/formatters';
import { InventoryMovement, Product } from '../../../../types';

interface InventoryLedgerTableProps {
  movements: InventoryMovement[];
  products: Product[];
  currency: string;
  onOpenAdjustmentModal: (product?: Product) => void;
  isLoading?: boolean;
}

export const InventoryLedgerTable: React.FC<InventoryLedgerTableProps> = ({
  movements,
  products,
  currency,
  onOpenAdjustmentModal,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Filter movements
  const filteredMovements = movements.filter(m => {
    const matchesProduct = selectedProduct === 'ALL' || m.productId === selectedProduct;
    const matchesType = selectedType === 'ALL' || m.movementType === selectedType;
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (m.productName && m.productName.toLowerCase().includes(term)) ||
      (m.reason && m.reason.toLowerCase().includes(term)) ||
      (m.referenceId && m.referenceId.toLowerCase().includes(term)) ||
      (m.referenceType && m.referenceType.toLowerCase().includes(term));

    return matchesProduct && matchesType && matchesSearch;
  });

  const getMovementBadge = (type: string, quantity: number) => {
    switch (type) {
      case 'SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/60">
            <ArrowUpRight className="w-3 h-3" />
            Venta (Salida)
          </span>
        );
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            <ArrowDownRight className="w-3 h-3" />
            Compra (Ingreso)
          </span>
        );
      case 'CANCELLATION':
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <RotateCcw className="w-3 h-3" />
            Restauración / Devolución
          </span>
        );
      case 'INITIAL_LOAD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60">
            <Package className="w-3 h-3" />
            Carga Inicial
          </span>
        );
      case 'ADJUSTMENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            <Sliders className="w-3 h-3" />
            {quantity < 0 ? 'Merma / Salida' : 'Ajuste Físico'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Libro Mayor de Inventario (Kardex Inmutable)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro secuencial y auditable de cada alteración de stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAdjustmentModal()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Nuevo Ajuste / Compra
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por producto, motivo o ref..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Product Filter */}
        <div>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todos los productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.sku ? `[${p.sku}] ` : ''}{p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todos los tipos de movimiento</option>
            <option value="PURCHASE">Compras a Proveedores (Ingreso)</option>
            <option value="SALE">Ventas en Órdenes (Salida)</option>
            <option value="CANCELLATION">Cancelaciones / Restauraciones</option>
            <option value="ADJUSTMENT">Ajustes / Mermas de Almacén</option>
            <option value="INITIAL_LOAD">Cargas Iniciales</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100/75 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Fecha / Hora</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Producto</th>
              <th className="py-3 px-4 text-center">Variación</th>
              <th className="py-3 px-4 text-center">Stock Antes &rarr; Después</th>
              <th className="py-3 px-4 text-right">Costo Unit.</th>
              <th className="py-3 px-4 text-right">Costo Total</th>
              <th className="py-3 px-4">Motivo / Ref.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Cargando libro mayor de inventario...
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No hay movimientos registrados
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || selectedProduct !== 'ALL' || selectedType !== 'ALL'
                        ? 'No se encontraron resultados con los filtros actuales.'
                        : 'Las ventas, compras y ajustes registrarán aquí cada cambio de stock de forma inmutable.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovements.map(m => {
                const isPositive = m.quantity > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getMovementBadge(m.movementType, m.quantity)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {m.productName || 'Producto'}
                      </div>
                      {m.referenceId && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {m.referenceId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`font-bold font-mono ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">{m.stockBefore}</span>
                      <span className="mx-1 text-slate-300">&rarr;</span>
                      <span className="font-bold">{m.stockAfter}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                      {m.unitCost ? formatCurrency(m.unitCost, currency) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-medium text-slate-900 dark:text-white">
                      {m.totalCost ? formatCurrency(m.totalCost, currency) : '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400" title={m.reason}>
                      {m.reason || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Mostrando {filteredMovements.length} de {movements.length} asientos del Libro Mayor</span>
        <span className="italic">Garantía de inmutabilidad: ningún movimiento puede ser modificado o eliminado</span>
      </div>
    </div>
  );
};
