import { describe, it, expect } from 'vitest';
import { CustomerModel } from '../src/features/customers/data/models/customer_model';
import { CustomerEntity } from '../src/features/customers/domain/entities/customer_entity';

describe('CustomerModel & Domain Entity - Schema Consistency & Types', () => {
  const mockRow = {
    id: 'd9b2d63d-a233-4f24-9b21-4f114c0a5241',
    organization_id: 'e1a3b5c7-1234-5678-9abc-def012345678',
    name: 'Carlos Mendoza',
    phone: '51987654321',
    email: 'carlos@example.com',
    address: 'Av. Larco 1020, Miraflores',
    reference: 'Frente al parque',
    notes: 'Cliente preferencial',
    total_orders: 8,
    total_spent: 480.5,
    last_order_date: '2026-03-01T15:30:00Z',
    last_order_number: 'ORD-2026-089',
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-03-01T15:30:00Z',
  };

  it('debe instanciar correctamente desde una fila de base de datos (fromRow)', () => {
    const model = CustomerModel.fromRow(mockRow);

    expect(model.id).toBe(mockRow.id);
    expect(model.organizationId).toBe(mockRow.organization_id);
    expect(model.name).toBe(mockRow.name);
    expect(model.phone).toBe(mockRow.phone);
    expect(model.totalOrders).toBe(8);
    expect(model.totalSpent).toBe(480.5);
    expect(model.lastOrderNumber).toBe('ORD-2026-089');
  });

  it('debe calcular el segmento de cliente correctamente (VIP, FREQUENT, NEW, INACTIVE)', () => {
    const vipCustomer = new CustomerModel(
      '1', 'org', 'VIP User', '51999999999', undefined, undefined, undefined, undefined,
      5, 300, new Date().toISOString()
    );
    expect(vipCustomer.segment).toBe('VIP');

    const frequentCustomer = new CustomerModel(
      '2', 'org', 'Freq User', '51999999998', undefined, undefined, undefined, undefined,
      3, 100, new Date().toISOString()
    );
    expect(frequentCustomer.segment).toBe('FREQUENT');

    const newCustomer = new CustomerModel(
      '3', 'org', 'New User', '51999999997', undefined, undefined, undefined, undefined,
      1, 50, new Date().toISOString()
    );
    expect(newCustomer.segment).toBe('NEW');

    const inactiveCustomer = new CustomerModel(
      '4', 'org', 'Inactive User', '51999999996', undefined, undefined, undefined, undefined,
      0, 0, undefined
    );
    expect(inactiveCustomer.segment).toBe('INACTIVE');
  });

  it('debe calcular el ticket promedio (averageTicket) con precisión', () => {
    const entity = new CustomerModel(
      '1', 'org', 'User', '51999999999', undefined, undefined, undefined, undefined,
      4, 200, new Date().toISOString()
    );
    expect(entity.averageTicket).toBe(50);

    const zeroEntity = new CustomerModel(
      '2', 'org', 'User', '51999999998', undefined, undefined, undefined, undefined,
      0, 0, undefined
    );
    expect(zeroEntity.averageTicket).toBe(0);
  });

  it('debe serializar a fila para inserción en base de datos (toInsertRow) incluyendo last_order_number', () => {
    const model = CustomerModel.fromRow(mockRow);
    const insertRow = model.toInsertRow();

    expect(insertRow.last_order_number).toBe('ORD-2026-089');
    expect(insertRow.organization_id).toBe(mockRow.organization_id);
    expect(insertRow.phone).toBe(mockRow.phone);
  });

  it('debe convertir a interfaz de cliente legado (toLegacy)', () => {
    const model = CustomerModel.fromRow(mockRow);
    const legacy = model.toLegacy();

    expect(legacy.id).toBe(mockRow.id);
    expect(legacy.last_order_number).toBe('ORD-2026-089');
    expect(legacy.total_orders).toBe(8);
  });
});
