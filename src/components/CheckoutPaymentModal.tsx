import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  X, 
  Loader2, 
  QrCode, 
  Zap, 
  Building,
  Check
} from 'lucide-react';

export const CheckoutPaymentModal: React.FC = () => {
  const { 
    checkoutModalOpen, 
    closeCheckoutModal, 
    selectedPlanForCheckout, 
    selectedBillingPeriod,
    currentOrg,
    processPayment,
    currentUser
  } = useApp();

  const [paymentGateway, setPaymentGateway] = useState<'Culqi' | 'Mercado Pago' | 'Niubiz' | 'Izipay' | 'Yape / Plin'>('Culqi');
  const [paymentType, setPaymentType] = useState<'CARD' | 'QR'>('CARD');

  // Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(currentUser.full_name || 'Enrique Bauza');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [email, setEmail] = useState(currentUser.email || 'enrique@negocio.pe');

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedTxnId, setCompletedTxnId] = useState<string>('');

  if (!checkoutModalOpen || !selectedPlanForCheckout) return null;

  const price = selectedBillingPeriod === 'ANNUAL'
    ? (selectedPlanForCheckout.price_annual || selectedPlanForCheckout.price_monthly * 10)
    : selectedPlanForCheckout.price_monthly;

  const handleFillDemoCard = () => {
    setCardNumber('4557 8890 1234 4242');
    setCardHolder(currentUser.full_name || 'Enrique Bauza');
    setExpiry('08/29');
    setCvv('789');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate real gateway processing time
      await new Promise(resolve => setTimeout(resolve, 1600));

      const cardLast4 = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
      const txn = await processPayment({
        orgId: currentOrg.id,
        planId: selectedPlanForCheckout.id,
        amount: price,
        gateway: paymentGateway,
        paymentMethodType: paymentType,
        billingPeriod: selectedBillingPeriod,
        cardLast4,
        cardBrand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'
      });

      setCompletedTxnId(txn.transaction_id);
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    closeCheckoutModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Pasarela de Pago Segura</h2>
              <p className="text-xs text-slate-400">
                Encriptación SSL de 256-bits • Certificado PCI-DSS Nivel 1
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={closeCheckoutModal}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {isSuccess ? (
            /* Success screen */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">¡Pago Procesado con Éxito!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Tu suscripción al <strong>Plan {selectedPlanForCheckout.name}</strong> para <strong>{currentOrg.name}</strong> ha sido activada y verificada vía Webhook.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">N° Transacción:</span>
                  <span className="font-mono font-bold text-slate-800">{completedTxnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pasarela Utilizada:</span>
                  <span className="font-bold text-indigo-600">{paymentGateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto Total Cobrado:</span>
                  <span className="font-bold text-emerald-600">S/ {price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Período:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBillingPeriod === 'ANNUAL' ? '1 Año (Renovación automática)' : '1 Mes (Renovación automática)'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Webhook Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PROCESSED & VERIFIED
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg active:scale-98 transition-all"
                >
                  Continuar al Panel Administrativo
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              
              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Resumen de Compra
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    Plan {selectedPlanForCheckout.name} ({selectedBillingPeriod === 'ANNUAL' ? 'Anual' : 'Mensual'})
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Para: {currentOrg.name}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    S/ {price.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedBillingPeriod === 'ANNUAL' ? 'pago anual' : 'facturado al mes'}
                  </div>
                </div>
              </div>

              {/* Gateway Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Selecciona tu Pasarela de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Culqi', 'Mercado Pago', 'Niubiz', 'Yape / Plin'] as const).map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => {
                        setPaymentGateway(gw);
                        if (gw === 'Yape / Plin') setPaymentType('QR');
                        else setPaymentType('CARD');
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentGateway === gw
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-black'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {gw === 'Yape / Plin' ? (
                        <QrCode className="w-4 h-4 text-purple-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      )}
                      <span>{gw}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              {paymentType === 'QR' ? (
                /* Yape / Plin QR Simulator */
                <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 text-center space-y-4">
                  <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-purple-200">
                    <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-mono font-bold">
                      [ CÓDIGO QR YAPE ]
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-purple-950">
                      Escanea con Yape o Plin desde tu celular
                    </div>
                    <p className="text-xs text-purple-700">
                      Monto a transferir: <strong>S/ {price.toFixed(2)}</strong>. Al hacer clic en "Confirmar Pago", nuestro webhook validará la transacción en tiempo real.
                    </p>
                  </div>
                </div>
              ) : (
                /* Card Input Form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Datos de la Tarjeta (Débito o Crédito)
                    </label>
                    <button
                      type="button"
                      onClick={handleFillDemoCard}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Tarjeta Demo
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 block mb-1">
                        Número de Tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 block mb-1">
                          Titular de la Tarjeta
                        </label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Nombre como figura en la tarjeta"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 block mb-1">
                            Vencimiento
                          </label>
                          <input
                            type="text"
                            required
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-center text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 block mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-center text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 block mb-1">
                        Email para envío de Factura / Boleta Electrónica
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando pago con {paymentGateway}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pagar S/ {price.toFixed(2)} y Activar Plan</span>
                    </>
                  )}
                </button>

                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Al completar el pago, aceptas los términos del servicio. Puedes cancelar la renovación automática en cualquier momento desde tu panel.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
