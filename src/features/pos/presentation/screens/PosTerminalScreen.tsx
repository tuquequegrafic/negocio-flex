import React, { useState, useMemo } from 'react';
import { usePosTerminal } from '../hooks/usePosTerminal';
import { useApp } from '../../../../context/AppContext';
import { useOrganization } from '../../../organizations/presentation/providers/OrganizationContext';
import { CashShiftControlModal } from '../components/CashShiftControlModal';
import { CashMovementModal } from '../components/CashMovementModal';
import { PosReceiptModal } from '../components/PosReceiptModal';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Lock,
  Unlock,
  Coins,
  Receipt,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  History,
  Tag,
  User,
} from 'lucide-react';
import { ReceiptDocumentType } from '../../domain/entities/sales_receipt_entity';

export const PosTerminalScreen: React.FC = () => {
  const { activeOrganization } = useOrganization();
  const { products = [], categories = [] } = useApp();
  const pos = usePosTerminal();

  // Filtros de catálogo local
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'POS' | 'AUDIT'>('POS');

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      if (prod.status === 'archived') return false;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat =
        selectedCategoryId === 'ALL' || prod.category_id === selectedCategoryId;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const selectedRegister = pos.registers.find(r => r.id === pos.selectedRegisterId);

  // Denominaciones rápidas para efectivo
  const addCashAmount = (amount: number) => {
    pos.setCashReceived(prev => (prev || 0) + amount);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 overflow-hidden font-sans">
      {/* 1. Header de Control de Caja */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Terminal de Punto de Venta</h1>
              {pos.activeShift ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Turno Abierto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                  <Lock className="w-3 h-3" />
                  Caja Cerrada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {activeOrganization?.name || 'Mi Negocio'} — {selectedRegister?.name || 'Caja Principal'}
            </p>
          </div>
        </div>

        {/* Indicadores Financieros & Acciones de Caja */}
        <div className="flex items-center gap-2 sm:gap-3">
          {pos.activeShift && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">En Gaveta</span>
                <span className="font-bold text-emerald-700 text-sm">
                  S/ {pos.activeShift.expectedCash.toFixed(2)}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ventas Turno</span>
                <span className="font-semibold text-slate-800">
                  S/ {(pos.activeShift.salesCashTotal + pos.activeShift.salesDigitalTotal).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Toggle Turno Abierto / Cerrado */}
          {pos.activeShift ? (
            <>
              <button
                type="button"
                onClick={() => pos.setShowMovementModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Registrar entrada o retiro manual de caja"
              >
                <Coins className="w-4 h-4 text-slate-600" />
                <span className="hidden md:inline">Movimiento (+/-)</span>
              </button>

              {pos.canCloseShift && (
                <button
                  type="button"
                  onClick={() => pos.setShowCloseShiftModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cerrar Caja</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => pos.setShowOpenShiftModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Turno de Caja</span>
            </button>
          )}

          {/* Selector de Vista: POS vs Historial */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('POS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'POS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Vender
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'AUDIT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auditoría</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alertas Globales de Venta */}
      {pos.saleError && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{pos.saleError}</span>
          </div>
          <button onClick={() => pos.refreshTerminal()} className="underline hover:opacity-80">
            Reintentar
          </button>
        </div>
      )}

      {pos.saleSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pos.saleSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* 2. Cuerpo Principal */}
      {activeTab === 'POS' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LADO IZQUIERDO: Catálogo de Productos y Filtros */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
            {/* Barra de búsqueda y categorías */}
            <div className="p-3.5 bg-white border-b border-slate-200 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre de producto o código SKU..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Categorías en chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({products.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 p-3.5 overflow-y-auto">
              {!pos.activeShift && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Turno de caja cerrado</p>
                      <p className="text-amber-700">Debes abrir el turno para registrar ventas y cobrar comprobantes.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => pos.setShowOpenShiftModal(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 shadow-xs"
                  >
                    Abrir Caja
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map(product => {
                  const stock = product.stock ?? 0;
                  const isOutOfStock = product.track_inventory && stock <= 0;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isOutOfStock || !pos.activeShift}
                      onClick={() => pos.addToCart(product)}
                      className={`text-left bg-white border rounded-xl p-3 flex flex-col justify-between transition-all duration-150 ${
                        isOutOfStock || !pos.activeShift
                          ? 'opacity-60 cursor-not-allowed border-slate-200'
                          : 'hover:border-slate-400 hover:shadow-md active:scale-95 border-slate-200'
                      }`}
                    >
                      <div>
                        {product.image_url ? (
                          <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-slate-100">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-20 rounded-lg mb-2 bg-slate-100 flex items-center justify-center text-slate-400">
                            <Tag className="w-6 h-6" />
                          </div>
                        )}
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        {product.sku && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {product.sku}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          S/ {Number(product.price).toFixed(2)}
                        </span>
                        {product.track_inventory ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              stock > 5
                                ? 'bg-emerald-50 text-emerald-700'
                                : stock > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {stock > 0 ? `${stock} disp.` : 'Agotado'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Ilimitado</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No se encontraron productos</p>
                  <p className="text-xs">Prueba ajustando el filtro de búsqueda o categoría.</p>
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: Terminal de Cobro y Carrito */}
          <div className="w-full lg:w-[420px] bg-white flex flex-col justify-between shrink-0 shadow-lg border-l border-slate-200">
            {/* Lista de Ítems en Carrito */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-xs text-slate-900">
                    Orden de Venta ({pos.cart.reduce((s, it) => s + it.quantity, 0)} ítems)
                  </h3>
                </div>
                {pos.cart.length > 0 && (
                  <button
                    type="button"
                    onClick={pos.clearCart}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {pos.cart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        S/ {item.unitPrice.toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => pos.updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => pos.updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-xs text-slate-900 w-16 text-right">
                        S/ {(item.quantity * item.unitPrice).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => pos.removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {pos.cart.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-semibold">El carrito está vacío</p>
                    <p className="text-[11px] mt-0.5">Haz clic en los productos para agregarlos.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Configuración de Cobro */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-3 shrink-0">
              {/* Tipo de Comprobante */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Comprobante
                </label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/70 rounded-xl text-xs font-bold">
                  {(['TICKET', 'BOLETA', 'FACTURA'] as ReceiptDocumentType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => pos.setDocumentType(type)}
                      className={`py-1.5 rounded-lg transition-all ${
                        pos.documentType === type
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente Rápido */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Cliente (opcional)"
                  value={pos.customer.name}
                  onChange={e => pos.setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <input
                  type="text"
                  placeholder={pos.documentType === 'FACTURA' ? 'RUC del cliente' : 'DNI (opcional)'}
                  value={pos.customer.document}
                  onChange={e => pos.setCustomer(prev => ({ ...prev, document: e.target.value }))}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Método de Pago
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                  {[
                    { id: 'CASH', label: 'Efectivo', icon: Banknote },
                    { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
                    { id: 'YAPE', label: 'Yape', icon: QrCode },
                    { id: 'PLIN', label: 'Plin', icon: QrCode },
                    { id: 'TRANSFER', label: 'Transf.', icon: ArrowRightLeft },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          pos.setPaymentMethod(m.id as any);
                          if (m.id === 'CASH' && pos.cashReceived === 0) {
                            pos.setCashReceived(pos.total);
                          }
                        }}
                        className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                          pos.paymentMethod === m.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Si es efectivo: Monto Recibido y Vuelto */}
              {pos.paymentMethod === 'CASH' && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-emerald-900">Efectivo Recibido:</span>
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={pos.cashReceived || ''}
                        onChange={e => pos.setCashReceived(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Atajos de billetes */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => pos.setCashReceived(pos.total)}
                      className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      Exacto
                    </button>
                    {[10, 20, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => addCashAmount(val)}
                        className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200">
                    <span className="font-semibold text-emerald-900">Vuelto / Cambio:</span>
                    <span className="font-black text-sm text-emerald-800">
                      S/ {pos.cashChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Resumen de Totales */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-800">S/ {pos.subtotal.toFixed(2)}</span>
                </div>
                {pos.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Descuento:</span>
                    <span>- S/ {pos.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-900">TOTAL:</span>
                  <span className="text-xl font-black text-slate-900">
                    S/ {pos.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botón Principal de Cobro */}
              <button
                type="button"
                disabled={!pos.canSubmitSale || !pos.activeShift}
                onClick={pos.handleProcessSale}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {pos.isProcessingSale ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {!pos.activeShift
                    ? 'Turno de Caja Cerrado'
                    : pos.cart.length === 0
                    ? 'Agrega productos'
                    : `Cobrar S/ ${pos.total.toFixed(2)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA: AUDITORÍA Y HISTORIAL DEL TURNO */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Arqueo del Turno Actual</h3>
                <p className="text-xs text-slate-500">
                  {pos.activeShift ? `Iniciado el ${new Date(pos.activeShift.openedAt).toLocaleString('es-PE')}` : 'Sin turno activo'}
                </p>
              </div>
              <button
                onClick={pos.refreshTerminal}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {pos.activeShift && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fondo Inicial</span>
                  <span className="text-base font-bold text-slate-900">S/ {pos.activeShift.initialCash.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Ventas en Efectivo</span>
                  <span className="text-base font-bold text-emerald-800">+ S/ {pos.activeShift.salesCashTotal.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase block">Ventas Digitales</span>
                  <span className="text-base font-bold text-blue-800">S/ {pos.activeShift.salesDigitalTotal.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo en Gaveta</span>
                  <span className="text-base font-black text-emerald-400">S/ {pos.activeShift.expectedCash.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Movimientos de Caja (Libro Mayor) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Movimientos de Caja del Turno</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Motivo</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pos.shiftMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleTimeString('es-PE')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            m.movementType === 'CASH_IN' || m.movementType === 'SALE_CASH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movementType === 'CASH_OUT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{m.reason}</td>
                      <td className="py-2.5 px-3 font-mono">{m.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        S/ {m.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {pos.shiftMovements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No hay movimientos registrados en este turno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comprobantes Emitidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Comprobantes Emitidos Recientemente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Comprobante</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pos.recentReceipts.map(rc => (
                    <tr
                      key={rc.id}
                      onClick={() => {
                        pos.setLastReceipt(rc);
                        pos.setShowReceiptModal(true);
                      }}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                        {rc.fullNumber}
                      </td>
                      <td className="py-2.5 px-3">{rc.customerName}</td>
                      <td className="py-2.5 px-3 font-mono">{rc.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {new Date(rc.issuedAt).toLocaleString('es-PE')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        S/ {rc.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {pos.recentReceipts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No hay comprobantes emitidos en este turno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modales del Terminal */}
      <CashShiftControlModal
        mode={pos.showOpenShiftModal ? 'OPEN' : 'CLOSE'}
        register={selectedRegister}
        activeShift={pos.activeShift}
        isOpen={pos.showOpenShiftModal || pos.showCloseShiftModal}
        onClose={() => {
          pos.setShowOpenShiftModal(false);
          pos.setShowCloseShiftModal(false);
        }}
        onSubmitOpen={pos.handleOpenShift}
        onSubmitClose={pos.handleCloseShift}
        isProcessing={pos.isProcessingSale}
      />

      <CashMovementModal
        isOpen={pos.showMovementModal}
        onClose={() => pos.setShowMovementModal(false)}
        activeShift={pos.activeShift}
        onSubmit={pos.handleRecordMovement}
        isProcessing={pos.isProcessingSale}
      />

      <PosReceiptModal
        receipt={pos.lastReceipt}
        isOpen={pos.showReceiptModal}
        onClose={() => pos.setShowReceiptModal(false)}
        organizationName={activeOrganization?.name}
      />
    </div>
  );
};
