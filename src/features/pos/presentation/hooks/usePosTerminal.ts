import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrganization } from '../../../organizations/presentation/providers/OrganizationContext';
import { useAuth } from '../../../auth/presentation/providers/AuthContext';
import { useApp } from '../../../../context/AppContext';
import {
  PosDataSource,
  CashShiftRepositoryImpl,
  PosRepositoryImpl,
  OpenCashShiftUseCase,
  CloseCashShiftUseCase,
  RecordCashMovementUseCase,
  GetActiveCashShiftUseCase,
  GetCashRegistersUseCase,
  ProcessPosSaleUseCase,
  CashRegisterEntity,
  CashShiftEntity,
  CashMovementEntity,
  SalesReceiptEntity,
  PosPermissions,
  ReceiptDocumentType,
} from '../../index';
import { Product } from '../../../../types';

export interface PosCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export function usePosTerminal() {
  const { activeOrganization, userRole } = useOrganization();
  const { user } = useAuth();
  const { products, updateProduct } = useApp();

  const orgId = activeOrganization?.id || '';
  const userId = user?.id || 'usr-default';

  // Repositorios & Casos de Uso
  const services = useMemo(() => {
    const dataSource = new PosDataSource({
      deductStockFn: async ({ items }) => {
        // Actualizar stock de productos en memoria/app
        for (const it of items) {
          const prod = products.find(p => p.id === it.productId);
          if (prod && prod.track_inventory) {
            const current = prod.stock ?? 0;
            if (current < it.quantity) {
              return {
                success: false,
                message: `Stock insuficiente para "${prod.name}". (Disponible: ${current}, Solicitado: ${it.quantity})`,
              };
            }
            if (updateProduct) {
              updateProduct(prod.id, { stock: current - it.quantity });
            }
          }
        }
        return { success: true };
      },
    });

    const shiftRepo = new CashShiftRepositoryImpl(dataSource);
    const posRepo = new PosRepositoryImpl(dataSource);

    return {
      dataSource,
      shiftRepo,
      posRepo,
      openShiftUseCase: new OpenCashShiftUseCase(shiftRepo),
      closeShiftUseCase: new CloseCashShiftUseCase(shiftRepo),
      recordMovementUseCase: new RecordCashMovementUseCase(shiftRepo),
      getActiveShiftUseCase: new GetActiveCashShiftUseCase(shiftRepo),
      getRegistersUseCase: new GetCashRegistersUseCase(shiftRepo),
      processSaleUseCase: new ProcessPosSaleUseCase(posRepo),
    };
  }, [products, updateProduct]);

  // Estados Principales
  const [registers, setRegisters] = useState<CashRegisterEntity[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('');
  const [activeShift, setActiveShift] = useState<CashShiftEntity | null>(null);
  const [shiftMovements, setShiftMovements] = useState<CashMovementEntity[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<SalesReceiptEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados de Carrito y Venta
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER'>('CASH');
  const [documentType, setDocumentType] = useState<ReceiptDocumentType>('TICKET');
  const [customer, setCustomer] = useState<{ name: string; document: string; phone: string }>({
    name: '',
    document: '',
    phone: '',
  });
  const [discount, setDiscount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Modales
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<SalesReceiptEntity | null>(null);

  // Procesamiento y Feedback
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Permisos RBAC
  const canOperatePos = useMemo(() => PosPermissions.canOperatePos(userRole), [userRole]);
  const canCloseShift = useMemo(() => PosPermissions.canCloseShift(userRole), [userRole]);
  const canManageRegisters = useMemo(() => PosPermissions.canManageRegisters(userRole), [userRole]);

  // Cargar Cajas y Turno Activo
  const refreshTerminal = useCallback(async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const regs = await services.getRegistersUseCase.execute(orgId);
      setRegisters(regs);

      const targetRegId = selectedRegisterId || (regs[0]?.id ?? '');
      if (targetRegId && targetRegId !== selectedRegisterId) {
        setSelectedRegisterId(targetRegId);
      }

      const shift = await services.getActiveShiftUseCase.execute(orgId, targetRegId || undefined);
      setActiveShift(shift);

      if (shift) {
        const [movs, receipts] = await Promise.all([
          services.shiftRepo.getShiftMovements(shift.id),
          services.posRepo.getReceiptsByShift(shift.id),
        ]);
        setShiftMovements(movs);
        setRecentReceipts(receipts);
      } else {
        setShiftMovements([]);
        setRecentReceipts([]);
      }
    } catch (err: any) {
      setSaleError(err.message || 'Error al cargar estado del POS.');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, selectedRegisterId, services]);

  useEffect(() => {
    refreshTerminal();
  }, [refreshTerminal]);

  // Acciones de Carrito
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
    setSaleError(null);
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
    setNotes('');
    setSaleError(null);
  }, []);

  // Cálculos Financieros
  const subtotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Math.max(0, cashReceived - total);
  }, [paymentMethod, cashReceived, total]);

  const canSubmitSale = useMemo(() => {
    if (cart.length === 0) return false;
    if (!activeShift || activeShift.status !== 'OPEN') return false;
    if (paymentMethod === 'CASH' && cashReceived < total) return false;
    if (isProcessingSale) return false;
    return true;
  }, [cart, activeShift, paymentMethod, cashReceived, total, isProcessingSale]);

  // Apertura de Turno
  const handleOpenShift = async (initialCash: number, shiftNotes?: string) => {
    if (!orgId || !selectedRegisterId) return;
    try {
      setIsProcessingSale(true);
      setSaleError(null);
      await services.openShiftUseCase.execute({
        organizationId: orgId,
        cashRegisterId: selectedRegisterId,
        userId,
        initialCash,
        notes: shiftNotes,
      });
      setShowOpenShiftModal(false);
      await refreshTerminal();
    } catch (err: any) {
      setSaleError(err.message || 'Error al abrir turno de caja.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Cierre de Turno
  const handleCloseShift = async (actualCash: number, shiftNotes?: string) => {
    if (!orgId || !activeShift) return;
    try {
      setIsProcessingSale(true);
      setSaleError(null);
      await services.closeShiftUseCase.execute({
        organizationId: orgId,
        shiftId: activeShift.id,
        userId,
        actualCash,
        notes: shiftNotes,
      });
      setShowCloseShiftModal(false);
      await refreshTerminal();
    } catch (err: any) {
      setSaleError(err.message || 'Error al cerrar turno de caja.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Registro de Movimiento Manual (CASH_IN / CASH_OUT)
  const handleRecordMovement = async (type: 'CASH_IN' | 'CASH_OUT', amount: number, reason: string) => {
    if (!orgId || !activeShift) return;
    try {
      setIsProcessingSale(true);
      setSaleError(null);
      await services.recordMovementUseCase.execute({
        organizationId: orgId,
        shiftId: activeShift.id,
        userId,
        movementType: type,
        amount,
        reason,
        paymentMethod: 'CASH',
      });
      setShowMovementModal(false);
      await refreshTerminal();
    } catch (err: any) {
      setSaleError(err.message || 'Error al registrar movimiento.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Procesar Venta POS
  const handleProcessSale = async () => {
    if (!canSubmitSale || !activeShift) return;
    try {
      setIsProcessingSale(true);
      setSaleError(null);
      setSaleSuccessMessage(null);

      const idempotencyKey = `pos-${orgId}-${selectedRegisterId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const saleResult = await services.processSaleUseCase.execute({
        organizationId: orgId,
        cashRegisterId: selectedRegisterId,
        shiftId: activeShift.id,
        userId,
        customer: {
          name: customer.name.trim() || 'Público General',
          document: customer.document.trim() || undefined,
          phone: customer.phone.trim() || undefined,
        },
        items: cart.map(it => ({
          productId: it.product.id,
          productName: it.product.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : total,
        discount,
        documentType,
        idempotencyKey,
        notes: notes.trim() || undefined,
      });

      // Obtener el comprobante generado
      const receipt = await services.posRepo.getReceiptById(saleResult.receiptId);
      if (receipt) {
        setLastReceipt(receipt);
        setShowReceiptModal(true);
      }

      setSaleSuccessMessage(`Venta ${saleResult.receiptNumber} procesada con éxito.`);
      clearCart();
      await refreshTerminal();
    } catch (err: any) {
      setSaleError(err.message || 'Error al procesar la venta.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  return {
    // Datos y Estado
    orgId,
    registers,
    selectedRegisterId,
    setSelectedRegisterId,
    activeShift,
    shiftMovements,
    recentReceipts,
    isLoading,
    isProcessingSale,
    saleError,
    saleSuccessMessage,

    // Permisos
    canOperatePos,
    canCloseShift,
    canManageRegisters,

    // Carrito y Valores
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    documentType,
    setDocumentType,
    customer,
    setCustomer,
    discount,
    setDiscount,
    cashReceived,
    setCashReceived,
    notes,
    setNotes,

    // Cálculos
    subtotal,
    total,
    cashChange,
    canSubmitSale,

    // Operaciones
    handleOpenShift,
    handleCloseShift,
    handleRecordMovement,
    handleProcessSale,
    refreshTerminal,

    // Modales
    showOpenShiftModal,
    setShowOpenShiftModal,
    showCloseShiftModal,
    setShowCloseShiftModal,
    showMovementModal,
    setShowMovementModal,
    showReceiptModal,
    setShowReceiptModal,
    lastReceipt,
    setLastReceipt,
  };
}
