import { describe, it, expect } from 'vitest';
import { sanitizeForCsv, generateCustomersCsv, parseCustomersCsv } from '../src/core/utils/csv_utils';
import { Customer } from '../src/types';

describe('CSV Utilities - CWE-1236 & Formula Injection Mitigation', () => {
  describe('sanitizeForCsv', () => {
    it('debe neutralizar fórmulas maliciosas de Excel comenzando con =', () => {
      const payload = '=cmd|"/c calc"!A0';
      const sanitized = sanitizeForCsv(payload);
      expect(sanitized.startsWith('"\'')).toBe(true);
      expect(sanitized).toBe('"\'=cmd|""/c calc""!A0"');
    });

    it('debe neutralizar fórmulas maliciosas comenzando con +, -, @', () => {
      expect(sanitizeForCsv('+12345').startsWith('"\'')).toBe(true);
      expect(sanitizeForCsv('-cmd').startsWith('"\'')).toBe(true);
      expect(sanitizeForCsv('@SUM(A1:A10)').startsWith('"\'')).toBe(true);
    });

    it('debe neutralizar caracteres de tabulación y retorno de carro que alteran celdas', () => {
      expect(sanitizeForCsv('\tDDE').startsWith('"\'')).toBe(true);
      expect(sanitizeForCsv('\rDDE').startsWith('"\'')).toBe(true);
    });

    it('debe escapar comillas dobles duplicándolas', () => {
      expect(sanitizeForCsv('Empresa "El Éxito"')).toBe('"Empresa ""El Éxito"""');
    });

    it('debe manejar números y valores nulos sin corromperlos', () => {
      expect(sanitizeForCsv(123.45)).toBe('"123.45"');
      expect(sanitizeForCsv(null)).toBe('""');
      expect(sanitizeForCsv(undefined)).toBe('""');
    });
  });

  describe('generateCustomersCsv', () => {
    const mockCustomers: Customer[] = [
      {
        id: 'cust-1',
        organization_id: 'org-123',
        name: '=SUM(A1:A10)', // Intento de inyección
        phone: '51987654321',
        email: 'test@example.com',
        address: 'Av. Las Palmeras 123, Dpto 4',
        reference: '+51 malicioso',
        notes: 'Cliente VIP; sensible',
        total_orders: 5,
        total_spent: 350.5,
        last_order_date: '2026-03-01T10:00:00Z',
        last_order_number: 'ORD-1001',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    it('debe incluir encabezados correctos con BOM UTF-8', () => {
      const csv = generateCustomersCsv(mockCustomers);
      expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
      expect(csv).toContain('Nombre');
      expect(csv).toContain('Teléfono');
      expect(csv).toContain('Email');
      expect(csv).toContain('Última Orden');
    });

    it('debe escapar celdas con inyecciones de fórmulas y comas', () => {
      const csv = generateCustomersCsv(mockCustomers);
      // El nombre malicioso debe estar entrecomillado y neutralizado con comilla simple
      expect(csv).toContain('"\'=SUM(A1:A10)"');
      expect(csv).toContain('"Av. Las Palmeras 123, Dpto 4"');
    });
  });

  describe('parseCustomersCsv', () => {
    it('debe parsear correctamente un CSV con comas dentro de comillas', () => {
      const csvContent = `Nombre,Teléfono,Email,Dirección
"Juan Pérez","987654321","juan@example.com","Calle 1, Mz B"
"María López","912345678","maria@example.com","Av. Lima 456"`;

      const result = parseCustomersCsv(csvContent);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Juan Pérez');
      expect(result[0].phone).toBe('987654321');
      expect(result[0].address).toBe('Calle 1, Mz B');
      expect(result[1].name).toBe('María López');
    });

    it('debe desescapar comillas neutralizadas', () => {
      const csvContent = `Nombre,Teléfono
"''=SUM(1,2)""","987654321"`;
      const result = parseCustomersCsv(csvContent);
      expect(result.length).toBe(1);
      expect(result[0].phone).toBe('987654321');
    });
  });
});
