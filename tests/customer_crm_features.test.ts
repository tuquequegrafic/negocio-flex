import { describe, it, expect } from 'vitest';
import { CustomerModel } from '../src/features/customers/data/models/customer_model';
import { normalizePhone } from '../src/core/utils/phone_utils';

describe('Customer CRM Features - Business Logic, Filters & Segmentation', () => {
  const org1 = 'org-tenant-alpha';
  const org2 = 'org-tenant-beta';

  const mockCustomers: CustomerModel[] = [
    new CustomerModel('c1', org1, 'Ana Valdivia', '51987654321', 'ana@example.com', undefined, undefined, 'Nota privada A', 6, 450, '2026-03-01T10:00:00Z', 'ORD-01'),
    new CustomerModel('c2', org1, 'Bernardo Torres', '51912345678', 'bernardo@example.com', undefined, undefined, undefined, 3, 120, '2026-02-20T10:00:00Z', 'ORD-02'),
    new CustomerModel('c3', org1, 'Carla Ramos', '51923456789', undefined, undefined, undefined, undefined, 1, 45, '2026-02-15T10:00:00Z', 'ORD-03'),
    new CustomerModel('c4', org1, 'David Salazar', '51934567890', undefined, undefined, undefined, 'Prospecto frío', 0, 0, undefined, undefined),
    // Tenant beta: Mismo teléfono que Ana pero diferente organización
    new CustomerModel('c5', org2, 'Ana Beta', '51987654321', 'ana.beta@example.com', undefined, undefined, 'Nota tenant B', 2, 80, '2026-03-02T10:00:00Z', 'ORD-B1'),
  ];

  it('debe segmentar correctamente cada perfil de cliente', () => {
    expect(mockCustomers[0].segment).toBe('VIP'); // totalOrders >= 5 o totalSpent >= 300
    expect(mockCustomers[1].segment).toBe('FREQUENT'); // totalOrders >= 2
    expect(mockCustomers[2].segment).toBe('NEW'); // totalOrders = 1
    expect(mockCustomers[3].segment).toBe('INACTIVE'); // totalOrders = 0
  });

  it('debe aislar estrictamente clientes por organización (Multi-Tenant)', () => {
    const org1Customers = mockCustomers.filter(c => c.organizationId === org1);
    const org2Customers = mockCustomers.filter(c => c.organizationId === org2);

    expect(org1Customers.length).toBe(4);
    expect(org2Customers.length).toBe(1);

    // Búsqueda por teléfono en org1 no debe devolver el de org2
    const targetPhone = normalizePhone('987654321');
    const matchedInOrg1 = org1Customers.filter(c => normalizePhone(c.phone) === targetPhone);
    const matchedInOrg2 = org2Customers.filter(c => normalizePhone(c.phone) === targetPhone);

    expect(matchedInOrg1.length).toBe(1);
    expect(matchedInOrg1[0].name).toBe('Ana Valdivia');
    expect(matchedInOrg2.length).toBe(1);
    expect(matchedInOrg2[0].name).toBe('Ana Beta');
  });

  it('debe filtrar clientes por segmento de fidelización de manera precisa', () => {
    const org1Customers = mockCustomers.filter(c => c.organizationId === org1);

    const vipList = org1Customers.filter(c => c.segment === 'VIP');
    const frequentList = org1Customers.filter(c => c.segment === 'FREQUENT');
    const newList = org1Customers.filter(c => c.segment === 'NEW');
    const inactiveList = org1Customers.filter(c => c.segment === 'INACTIVE');

    expect(vipList.map(c => c.name)).toEqual(['Ana Valdivia']);
    expect(frequentList.map(c => c.name)).toEqual(['Bernardo Torres']);
    expect(newList.map(c => c.name)).toEqual(['Carla Ramos']);
    expect(inactiveList.map(c => c.name)).toEqual(['David Salazar']);
  });

  it('debe calcular métricas agregadas globales de CRM para la organización', () => {
    const org1Customers = mockCustomers.filter(c => c.organizationId === org1);

    const totalCustomers = org1Customers.length;
    const totalSpent = org1Customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const totalOrders = org1Customers.reduce((acc, c) => acc + c.totalOrders, 0);
    const vipCount = org1Customers.filter(c => c.segment === 'VIP').length;
    const globalAvgTicket = totalOrders > 0 ? Number((totalSpent / totalOrders).toFixed(2)) : 0;

    expect(totalCustomers).toBe(4);
    expect(totalSpent).toBe(615);
    expect(totalOrders).toBe(10);
    expect(vipCount).toBe(1);
    expect(globalAvgTicket).toBe(61.5);
  });
});
