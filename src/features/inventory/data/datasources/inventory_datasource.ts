/**
 * Negocio Flex - Inventory DataSource (Fase 12.1 Remediada)
 * Integración estricta con Supabase RPC ('deduct_order_inventory', 'restore_order_inventory', 'adjust_inventory')
 * y fallback operacional determinista en memoria/local SOLO cuando Supabase no está configurado.
 * 
 * Regla de Remediación FASE 12.1:
 * - NO convertir errores de Supabase en operaciones locales silenciosas.
 * - Lanzar excepciones explícitas ante fallos de BD o RPC.
 * - Soportar dirección IN/OUT para mermas con cantidad estrictamente positiva.
 * - Soportar paginación (limit / offset) y filtros en getMovements.
 */

import { supabaseService } from '../../../../core/network/supabase_client';
import {
  InventoryMovementEntity,
  DeductOrderStockParams,
  RestoreOrderStockParams,
  AdjustInventoryParams,
  DeductStockResult,
  RestoreStockResult,
} from '../../domain/entities/inventory_movement_entity';
import { InventoryMovementFilterOptions } from '../../domain/repositories/inventory_repository';
import { ValidationException } from '../../../../core/errors/app_exceptions';
import { logger } from '../../../../core/utils/logger';

export class InventoryDataSource {
  // Almacén inmutable en memoria para cuando Supabase NO está configurado o entorno de pruebas
  private localLedger: InventoryMovementEntity[] = [];
  // Mutex para operaciones concurrentes en modo local
  private isProcessingLock: boolean = false;

  constructor(initialMovements: InventoryMovementEntity[] = []) {
    this.localLedger = [...initialMovements];
  }

  private getClient() {
    return supabaseService.getClient();
  }

  /**
   * Deducción atómica de inventario por pedido
   */
  async deductOrderStock(
    params: DeductOrderStockParams,
    options?: {
      getProductStockFn?: (productId: string) => {
        stock: number;
        name: string;
        costPrice: number;
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
      };
      updateProductStockFn?: (productId: string, newStock: number) => void;
    }
  ): Promise<DeductStockResult> {
    const client = this.getClient();

    // 1. Si Supabase está configurado, invocar la función RPC atómica PostgreSQL
    // CRIT-02: NO capturar errores de Supabase para ocultarlos en fallback local silencioso
    if (supabaseService.isConfigured && client) {
      logger.info('Invocando RPC deduct_order_inventory en Supabase...', { orderId: params.orderId });

      const { data, error } = await client.rpc('deduct_order_inventory', {
        p_organization_id: params.organizationId,
        p_order_id: params.orderId,
        p_user_id: params.userId || null,
        p_reason: params.reason || null,
        p_items: params.items.map(it => ({
          product_id: it.productId,
          quantity: it.quantity,
        })),
      });

      if (error) {
        logger.error('Error estricto en RPC deduct_order_inventory:', error);
        throw new ValidationException(`Error en deducción de inventario: ${error.message}`);
      }

      const res = data as Record<string, any> | null;
      return {
        success: Boolean(res?.success ?? true),
        idempotent: Boolean(res?.idempotent ?? false),
        orderId: params.orderId,
        itemsProcessed: Number(res?.items_processed ?? params.items.length),
        message: res?.message,
      };
    }

    // 2. Modo Local (Únicamente cuando Supabase NO está configurado)
    // Validar idempotencia: si ya existe movimiento SALE para este pedido, retornar de forma idempotente
    const alreadyDeducted = this.localLedger.some(
      m =>
        m.organizationId === params.organizationId &&
        m.referenceType === 'ORDER' &&
        m.referenceId === params.orderId &&
        m.movementType === 'SALE'
    );

    if (alreadyDeducted) {
      return {
        success: true,
        idempotent: true,
        orderId: params.orderId,
        itemsProcessed: 0,
        message: 'El inventario para este pedido ya fue descontado previamente.',
      };
    }

    // Control de concurrencia: Bloqueo de cola atómica local
    while (this.isProcessingLock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.isProcessingLock = true;

    try {
      // Re-comprobar idempotencia bajo bloqueo
      const doubleCheck = this.localLedger.some(
        m =>
          m.organizationId === params.organizationId &&
          m.referenceType === 'ORDER' &&
          m.referenceId === params.orderId &&
          m.movementType === 'SALE'
      );
      if (doubleCheck) {
        return {
          success: true,
          idempotent: true,
          orderId: params.orderId,
          itemsProcessed: 0,
        };
      }

      // Validar stock de cada artículo antes de descontar nada
      for (const item of params.items) {
        if (options?.getProductStockFn) {
          const prod = options.getProductStockFn(item.productId);
          if (prod && (prod.trackInventory ?? true)) {
            if (!prod.allowNegativeStock && prod.stock < item.quantity) {
              throw new ValidationException(
                `Stock insuficiente para el producto "${prod.name}" (Disponible: ${prod.stock}, Solicitado: ${item.quantity}).`
              );
            }
          }
        }
      }

      // Descontar y registrar en Ledger inmutable
      let itemsProcessed = 0;
      for (const item of params.items) {
        let currentStock = 100;
        let costPrice = 0;
        let track = true;

        if (options?.getProductStockFn) {
          const prod = options.getProductStockFn(item.productId);
          if (prod) {
            currentStock = prod.stock;
            costPrice = prod.costPrice;
            track = prod.trackInventory ?? true;
          }
        }

        if (track) {
          const newStock = currentStock - item.quantity;
          if (options?.updateProductStockFn) {
            options.updateProductStockFn(item.productId, newStock);
          }

          const movement: InventoryMovementEntity = {
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            organizationId: params.organizationId,
            productId: item.productId,
            productName: item.productName,
            movementType: 'SALE',
            quantity: item.quantity, // Cantidad siempre positiva
            stockBefore: currentStock,
            stockAfter: newStock,
            unitCost: costPrice,
            totalCost: Number((costPrice * item.quantity).toFixed(2)),
            referenceType: 'ORDER',
            referenceId: params.orderId,
            reason: params.reason || `Venta confirmada por Pedido #${params.orderId}`,
            createdBy: params.userId,
            createdAt: new Date().toISOString(),
          };

          this.localLedger.push(movement);
          itemsProcessed++;
        }
      }

      return {
        success: true,
        idempotent: false,
        orderId: params.orderId,
        itemsProcessed,
      };
    } finally {
      this.isProcessingLock = false;
    }
  }

  /**
   * Reversión compensatoria por cancelación de pedido
   */
  async restoreOrderStock(
    params: RestoreOrderStockParams,
    options?: {
      getProductStockFn?: (productId: string) => { stock: number; name: string; costPrice: number };
      updateProductStockFn?: (productId: string, newStock: number) => void;
    }
  ): Promise<RestoreStockResult> {
    const client = this.getClient();

    // 1. Supabase RPC directo si está configurado. Lanzar error ante cualquier fallo.
    if (supabaseService.isConfigured && client) {
      logger.info('Invocando RPC restore_order_inventory en Supabase...', { orderId: params.orderId });

      const { data, error } = await client.rpc('restore_order_inventory', {
        p_organization_id: params.organizationId,
        p_order_id: params.orderId,
        p_reason: params.reason || 'Cancelación de pedido',
        p_user_id: params.userId || null,
      });

      if (error) {
        logger.error('Error estricto en RPC restore_order_inventory:', error);
        throw new ValidationException(`Error al restaurar inventario: ${error.message}`);
      }

      const res = data as Record<string, any> | null;
      return {
        success: Boolean(res?.success ?? true),
        idempotent: Boolean(res?.idempotent ?? false),
        orderId: params.orderId,
        itemsRestored: Number(res?.items_restored ?? 0),
        message: res?.message,
      };
    }

    // 2. Modo Local (Únicamente cuando Supabase NO está configurado)
    const alreadyRestored = this.localLedger.some(
      m =>
        m.organizationId === params.organizationId &&
        m.referenceType === 'ORDER' &&
        m.referenceId === params.orderId &&
        m.movementType === 'CANCELLATION'
    );

    if (alreadyRestored) {
      return {
        success: true,
        idempotent: true,
        orderId: params.orderId,
        itemsRestored: 0,
        message: 'El inventario ya fue restaurado previamente para este pedido.',
      };
    }

    // Encontrar movimientos de venta de este pedido
    const saleMovements = this.localLedger.filter(
      m =>
        m.organizationId === params.organizationId &&
        m.referenceType === 'ORDER' &&
        m.referenceId === params.orderId &&
        m.movementType === 'SALE'
    );

    let itemsRestored = 0;
    for (const mov of saleMovements) {
      let currentStock = 0;
      if (options?.getProductStockFn) {
        const prod = options.getProductStockFn(mov.productId);
        if (prod) currentStock = prod.stock;
      }

      const newStock = currentStock + mov.quantity;
      if (options?.updateProductStockFn) {
        options.updateProductStockFn(mov.productId, newStock);
      }

      const compensatoryMov: InventoryMovementEntity = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        organizationId: params.organizationId,
        productId: mov.productId,
        productName: mov.productName,
        movementType: 'CANCELLATION',
        quantity: mov.quantity,
        stockBefore: currentStock,
        stockAfter: newStock,
        unitCost: mov.unitCost,
        totalCost: mov.totalCost,
        referenceType: 'ORDER',
        referenceId: params.orderId,
        reason: params.reason || `Restauración por cancelación de Pedido #${params.orderId}`,
        createdBy: params.userId,
        createdAt: new Date().toISOString(),
      };

      this.localLedger.push(compensatoryMov);
      itemsRestored++;
    }

    return {
      success: true,
      idempotent: false,
      orderId: params.orderId,
      itemsRestored,
    };
  }

  /**
   * Ajuste manual de inventario (Entrada, Salida/Merma, Conteo)
   */
  async adjustInventory(
    params: AdjustInventoryParams,
    options?: {
      getProductStockFn?: (productId: string) => {
        stock: number;
        name: string;
        costPrice: number;
        allowNegativeStock?: boolean;
      };
      updateProductStockFn?: (productId: string, newStock: number, newCost?: number) => void;
    }
  ): Promise<InventoryMovementEntity> {
    const client = this.getClient();

    // 1. Supabase RPC directo si está configurado. Lanzar error ante cualquier fallo.
    if (supabaseService.isConfigured && client) {
      logger.info('Invocando RPC adjust_inventory en Supabase...', {
        productId: params.productId,
        type: params.movementType,
        quantity: params.quantity,
        direction: params.direction || 'IN',
      });

      const { data, error } = await client.rpc('adjust_inventory', {
        p_organization_id: params.organizationId,
        p_product_id: params.productId,
        p_movement_type: params.movementType,
        p_quantity: params.quantity,
        p_unit_cost: params.unitCost || 0,
        p_reason: params.reason,
        p_reference_type: params.referenceType || 'MANUAL_ADJUSTMENT',
        p_reference_id: params.referenceId || null,
        p_user_id: params.userId || null,
        p_direction: params.direction || 'IN',
      });

      if (error) {
        logger.error('Error estricto en RPC adjust_inventory:', error);
        throw new ValidationException(`Error en ajuste de inventario: ${error.message}`);
      }

      const res = data as Record<string, any> | null;
      const stockBefore = Number(res?.stock_before ?? 0);
      const stockAfter = Number(res?.stock_after ?? 0);

      // Crear entidad representativa del movimiento confirmado por Supabase
      const entity: InventoryMovementEntity = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        organizationId: params.organizationId,
        productId: params.productId,
        movementType: params.movementType,
        quantity: params.quantity,
        stockBefore,
        stockAfter,
        unitCost: params.unitCost || 0,
        totalCost: Number(((params.unitCost || 0) * params.quantity).toFixed(2)),
        referenceType: params.referenceType || 'MANUAL_ADJUSTMENT',
        referenceId: params.referenceId,
        reason: params.reason,
        createdBy: params.userId,
        createdAt: new Date().toISOString(),
      };

      return entity;
    }

    // 2. Modo Local (Únicamente cuando Supabase NO está configurado)
    let currentStock = 0;
    let costPrice = params.unitCost || 0;
    let productName = 'Producto';
    let allowNegativeStock = false;

    if (options?.getProductStockFn) {
      const prod = options.getProductStockFn(params.productId);
      if (prod) {
        currentStock = prod.stock;
        costPrice = params.unitCost !== undefined && params.unitCost > 0 ? params.unitCost : prod.costPrice;
        productName = prod.name;
        allowNegativeStock = Boolean(prod.allowNegativeStock);
      }
    }

    let newStock = currentStock;
    if (
      params.movementType === 'PURCHASE' ||
      params.movementType === 'RETURN' ||
      params.movementType === 'INITIAL_LOAD'
    ) {
      newStock = currentStock + params.quantity;
    } else if (params.movementType === 'REVERSAL') {
      newStock = currentStock - params.quantity;
    } else if (params.movementType === 'ADJUSTMENT') {
      // HIGH-02: Manejo semántico de dirección IN / OUT para ADJUSTMENT
      if (params.direction === 'OUT') {
        newStock = currentStock - params.quantity;
      } else if (params.direction === 'IN') {
        newStock = currentStock + params.quantity;
      } else {
        // Conteo físico absoluto
        newStock = params.quantity;
      }
    }

    if (newStock < 0 && !allowNegativeStock) {
      throw new ValidationException(`La operación generaría stock negativo para "${productName}".`);
    }

    if (options?.updateProductStockFn) {
      options.updateProductStockFn(params.productId, newStock, params.unitCost);
    }

    const movement: InventoryMovementEntity = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: params.organizationId,
      productId: params.productId,
      productName,
      movementType: params.movementType,
      quantity: params.quantity, // Cantidad estrictamente positiva
      stockBefore: currentStock,
      stockAfter: newStock,
      unitCost: costPrice,
      totalCost: Number((costPrice * params.quantity).toFixed(2)),
      referenceType: params.referenceType || 'MANUAL_ADJUSTMENT',
      referenceId: params.referenceId,
      reason: params.reason,
      createdBy: params.userId,
      createdAt: new Date().toISOString(),
    };

    this.localLedger.push(movement);
    return movement;
  }

  /**
   * Obtener movimientos históricos del Ledger con paginación y filtros (LOW-02)
   */
  async getMovements(
    organizationId: string,
    productId?: string,
    options?: InventoryMovementFilterOptions
  ): Promise<InventoryMovementEntity[]> {
    const client = this.getClient();

    if (supabaseService.isConfigured && client) {
      let query = (client as any)
        .from('inventory_movements')
        .select('*, products(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (options?.movementType) {
        query = query.eq('movement_type', options.movementType);
      }

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      // Soporte de paginación
      if (options?.limit !== undefined && options.limit > 0) {
        const offset = options.offset ?? 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Error estricto al consultar inventory_movements:', error);
        throw new Error(error.message);
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        productId: row.product_id,
        productName: row.products?.name,
        movementType: row.movement_type,
        quantity: row.quantity,
        stockBefore: row.stock_before,
        stockAfter: row.stock_after,
        unitCost: Number(row.unit_cost),
        totalCost: Number(row.total_cost),
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        reason: row.reason,
        createdBy: row.created_by,
        createdAt: row.created_at,
      }));
    }

    // Modo Local
    let filtered = this.localLedger.filter(
      m => m.organizationId === organizationId && (!productId || m.productId === productId)
    );

    if (options?.movementType) {
      filtered = filtered.filter(m => m.movementType === options.movementType);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      filtered = filtered.filter(m => new Date(m.createdAt).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      filtered = filtered.filter(m => new Date(m.createdAt).getTime() <= end);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.limit !== undefined && options.limit > 0) {
      const offset = options.offset ?? 0;
      filtered = filtered.slice(offset, offset + options.limit);
    }

    return filtered;
  }

  /**
   * Obtener stock actual de un producto
   */
  async getStock(organizationId: string, productId: string): Promise<number> {
    const client = this.getClient();
    if (supabaseService.isConfigured && client) {
      const { data, error } = await client
        .from('products')
        .select('stock')
        .eq('id', productId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        logger.error('Error al consultar stock del producto:', error);
        throw new Error(error.message);
      }

      if (data) return Number(data.stock);
    }

    const latest = this.localLedger
      .filter(m => m.organizationId === organizationId && m.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return latest ? latest.stockAfter : 0;
  }

  /**
   * Registra un movimiento de carga inicial (MED-01) en modo local
   */
  recordInitialLoad(movement: InventoryMovementEntity): void {
    this.localLedger.push(movement);
  }

  /**
   * Helper para pruebas: obtener movimientos locales
   */
  getLocalLedger(): readonly InventoryMovementEntity[] {
    return [...this.localLedger];
  }

  /**
   * Helper para pruebas: reiniciar ledger local
   */
  clearLocalLedger(): void {
    this.localLedger = [];
  }
}
