import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone, isValidPhone, arePhonesEqual } from '../src/core/utils/phone_utils';

describe('Phone Utilities - Zero Trust & Security Verification', () => {
  describe('normalizePhone', () => {
    it('debe normalizar número peruano de 9 dígitos anteponiendo 51', () => {
      expect(normalizePhone('987654321')).toBe('51987654321');
    });

    it('debe conservar prefijo internacional 51 si ya está presente', () => {
      expect(normalizePhone('51987654321')).toBe('51987654321');
      expect(normalizePhone('+51987654321')).toBe('51987654321');
    });

    it('debe limpiar caracteres no numéricos, espacios, guiones y paréntesis', () => {
      expect(normalizePhone('+51 (987) 654-321')).toBe('51987654321');
      expect(normalizePhone('987-654-321')).toBe('51987654321');
      expect(normalizePhone('  987 654 321  ')).toBe('51987654321');
    });

    it('debe sanitizar intentos de inyección SQL y XSS en números de teléfono', () => {
      expect(normalizePhone("987654321'; DROP TABLE customers;--")).toBe('51987654321');
      expect(normalizePhone("<script>alert('xss')</script>987654321")).toBe('51987654321');
    });

    it('debe devolver cadena vacía ante valores nulos, vacíos o indefinidos', () => {
      expect(normalizePhone('')).toBe('');
      expect(normalizePhone(null as unknown as string)).toBe('');
      expect(normalizePhone(undefined as unknown as string)).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('debe formatear celular peruano en formato canónico +51 987 654 321', () => {
      expect(formatPhone('51987654321')).toBe('+51 987 654 321');
      expect(formatPhone('987654321')).toBe('+51 987 654 321');
    });

    it('debe manejar números internacionales de longitud diferente', () => {
      expect(formatPhone('14155552671')).toBe('+1 4155552671');
    });
  });

  describe('isValidPhone', () => {
    it('debe validar números peruanos estándar de 9 dígitos', () => {
      expect(isValidPhone('987654321')).toBe(true);
      expect(isValidPhone('+51 987 654 321')).toBe(true);
      expect(isValidPhone('51987654321')).toBe(true);
    });

    it('debe rechazar números con menos de 7 dígitos o cadenas maliciosas sin dígitos suficientes', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null as unknown as string)).toBe(false);
    });

    it('debe rechazar números con más de 15 dígitos según estándar E.164', () => {
      expect(isValidPhone('1234567890123456')).toBe(false);
    });
  });

  describe('arePhonesEqual', () => {
    it('debe reconocer equivalencia entre números con y sin formato', () => {
      expect(arePhonesEqual('+51 987 654 321', '987654321')).toBe(true);
      expect(arePhonesEqual('987-654-321', '51987654321')).toBe(true);
    });

    it('debe distinguir números claramente diferentes', () => {
      expect(arePhonesEqual('987654321', '987654322')).toBe(false);
      expect(arePhonesEqual('', '987654321')).toBe(false);
    });
  });
});
