/**
 * Negocio Flex - BillingScreen Component (Fase 10: Presentación / Screens)
 * Pantalla de historial de facturación, transacciones e información de pago.
 */

import React from 'react';
import { PaymentTransactionEntity } from '../../domain/entities/payment_transaction_entity';
import { SubscriptionEntity } from '../../domain/entities/subscription_entity';
import { PlanEntity } from '../../domain/entities/plan_entity';
import { Receipt, CreditCard, CheckCircle2, AlertCircle, Download, Calendar } from 'lucide-react';

interface BillingScreenProps {
  subscription?: SubscriptionEntity | null;
  plan?: PlanEntity | null;
  transactions: readonly PaymentTransactionEntity[];
  onUpgradeClick?: () => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  subscription,
  plan,
  transactions,
  onUpgradeClick,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="billing-screen-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-indigo-600" />
            Facturación e Historial de Pagos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulta comprobantes de pago, renovaciones y transacciones de tu organización.
          </p>
        </div>
        {onUpgradeClick && (
          <button
            id="billing-upgrade-btn"
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition"
          >
            Cambiar Plan / Intervalo
          </button>
        )}
      </div>

      {/* Tarjeta de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Activo</p>
          <h3 className="text-xl font-black text-slate-900">{plan?.name || subscription?.plan_name || 'Inicial'}</h3>
          <p className="text-xs text-indigo-600 font-semibold">
            {subscription?.billing_interval === 'ANNUAL' ? 'Facturación Anual' : 'Facturación Mensual'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Próxima Renovación</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'No programada'}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {subscription?.auto_renew ? 'Renovación automática activa' : 'Cancelación al fin de ciclo'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasarela Oficial</p>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">
              {subscription?.provider || 'Culqi'}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Idempotencia y verificación criptográfica activada
          </p>
        </div>
      </div>

      {/* Tabla de Transacciones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="billing-history-card">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Comprobantes y Transacciones</h3>
          <span className="text-xs text-slate-500 font-medium">
            {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No se registran transacciones previas para esta organización.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Fecha</th>
                  <th className="py-3 px-6">ID Transacción</th>
                  <th className="py-3 px-6">Concepto / Plan</th>
                  <th className="py-3 px-6">Monto</th>
                  <th className="py-3 px-6">Estado</th>
                  <th className="py-3 px-6 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map(tx => {
                  const isApproved = tx.status === 'APPROVED';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {new Date(tx.created_at).toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        {tx.transaction_id || tx.id.slice(0, 12)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {tx.plan_name}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        S/ {tx.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{isApproved ? 'Aprobado' : tx.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            // Descarga o visualización de recibo seguro
                            alert(`Recibo #${tx.transaction_id || tx.id.slice(0, 8)} - Monto: S/ ${tx.amount.toFixed(2)} (${tx.plan_name})`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Descargar Recibo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
