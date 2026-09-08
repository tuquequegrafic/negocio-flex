/**
 * Utilidades Centralizadas para Normalización y Formateo Canónico de Teléfonos
 * Negocio Flex - Fase 8
 * 
 * Única fuente de verdad para normalización de teléfonos, enlaces de WhatsApp y búsqueda CRM.
 */

/**
 * Normaliza un número de teléfono a su formato canónico de solo dígitos.
 * Para números celulares de Perú (9 dígitos comenzando con '9'), antepone el código de país '51'.
 * Maneja espacios, guiones, paréntesis, símbolos '+' y prefijos internacionales.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // 1. Extraer exclusivamente dígitos numéricos
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // 2. Si es número celular peruano estándar (9 dígitos comenzando con 9), canónicamente normalizar a prefijo 51
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }

  // 3. Si ya tiene el prefijo de Perú (11 dígitos comenzando con 519), mantener canónico
  if (digits.length === 11 && digits.startsWith('519')) {
    return digits;
  }

  return digits;
}

/**
 * Obtiene el formato numérico exacto para enlaces de WhatsApp (wa.me/{phone}).
 * Garantiza que siempre incluya código de país válido para celulares de Perú (51) sin duplicar prefijos.
 */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string {
  return normalizePhone(phone);
}

/**
 * Genera el enlace canónico de WhatsApp (wa.me/{phone}?text=...)
 * con número limpio y mensaje opcional codificado.
 */
export function formatWhatsAppUrl(phone: string | null | undefined, message?: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return '#';
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${textParam}`;
}

/**
 * Formatea para visualización limpia y legible en UI.
 * Ejemplos:
 * "51987654321" -> "+51 987 654 321"
 * "987654321"   -> "987 654 321"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('519')) {
    const num = digits.slice(2);
    return `+51 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)} ${digits.slice(digits.length - 10)}`;
  }
  return phone.trim();
}

/**
 * Alias de formato canónico
 */
export const formatPhone = formatPhoneDisplay;

/**
 * Valida si una cadena corresponde a un número telefónico canónico o válido
 * (mínimo 7 dígitos, máximo 15 según estándar internacional ITU-T E.164)
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Compara dos números de teléfono determinando si representan a la misma persona
 * después de normalización canónica completa.
 */
export function arePhonesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const normA = normalizePhone(a);
  const normB = normalizePhone(b);
  if (!normA || !normB) return false;
  return normA === normB;
}
