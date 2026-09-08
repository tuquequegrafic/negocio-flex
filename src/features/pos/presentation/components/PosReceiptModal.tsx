import React from 'react';
import { SalesReceiptEntity } from '../../domain/entities/sales_receipt_entity';
import { Printer, CheckCircle, X } from 'lucide-react';

interface PosReceiptModalProps {
  receipt: SalesReceiptEntity | null;
  isOpen: boolean;
  onClose: () => void;
  organizationName?: string;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  organizationName = 'Negocio Flex',
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'BOLETA':
        return 'BOLETA DE VENTA ELECTRÓNICA';
      case 'FACTURA':
        return 'FACTURA ELECTRÓNICA';
      default:
        return 'TICKET DE VENTA';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta Débito/Crédito';
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'TRANSFER':
        return 'Transferencia Bancaria';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Venta Completada</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Receipt */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4 bg-amber-50/20 border-b border-slate-200 print:m-0 print:p-2">
          <div className="text-center space-y-1">
            <h2 className="font-bold text-base tracking-wider uppercase">{organizationName}</h2>
            <p className="text-[11px] text-slate-500">{getDocTypeLabel(receipt.documentType)}</p>
            <p className="font-bold text-sm tracking-widest text-slate-900">{receipt.fullNumber}</p>
            <p className="text-[10px] text-slate-400">
              {new Date(receipt.issuedAt).toLocaleString('es-PE')}
            </p>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-semibold text-slate-900">{receipt.customerName}</span>
            </div>
            {receipt.customerDocument && (
              <div className="flex justify-between">
                <span className="text-slate-500">Doc / RUC:</span>
                <span className="font-semibold text-slate-900">{receipt.customerDocument}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Forma de Pago:</span>
              <span className="font-semibold text-slate-900">{getPaymentMethodLabel(receipt.paymentMethod)}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>S/ {receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Descuento:</span>
                <span>- S/ {receipt.discount.toFixed(2)}</span>
              </div>
            )}
            {receipt.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>IGV ({((receipt.taxRate || 0.18) * 100).toFixed(0)}%):</span>
                <span>S/ {receipt.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-400 pt-1.5 flex justify-between text-base font-black text-slate-900">
              <span>TOTAL:</span>
              <span>S/ {receipt.total.toFixed(2)}</span>
            </div>

            {receipt.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Efectivo Recibido:</span>
                  <span>S/ {receipt.cashReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Vuelto / Cambio:</span>
                  <span>S/ {receipt.cashChange.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <p>¡Gracias por su compra!</p>
            <p className="font-mono text-[9px] text-slate-400 tracking-tighter">
              ID: {receipt.id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-900 rounded-xl text-xs font-bold text-white hover:bg-slate-800 shadow-md transition-colors"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};
