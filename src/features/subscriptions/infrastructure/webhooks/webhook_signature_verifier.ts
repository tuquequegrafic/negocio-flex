/**
 * Negocio Flex - Webhook Signature Verifier (Fase 10: Remediación Criptográfica Estricta)
 * Implementa verificación formal mediante HMAC-SHA256, comparación en tiempo constante (timingSafeEqual)
 * y protección contra Replay Attack mediante timestamp drift tolerance.
 * 
 * ELIMINADOS: Patrones inseguros de subcadena y longitud.
 */

import crypto from 'crypto';
import { WebhookVerificationError } from '../../domain/errors/subscription_errors';

export interface WebhookHeaderCheckParams {
  readonly provider: string;
  readonly rawBody: string;
  readonly headers: Record<string, string | undefined>;
  readonly secretKey?: string;
  readonly toleranceSeconds?: number;
}

export class WebhookSignatureVerifier {
  private static readonly DEFAULT_TOLERANCE_SECONDS = 300; // 5 minutos

  /**
   * Verifica la autenticidad criptográfica del webhook
   */
  static verifySignature(params: WebhookHeaderCheckParams): boolean {
    const { provider, rawBody, headers, secretKey, toleranceSeconds = this.DEFAULT_TOLERANCE_SECONDS } = params;
    const normProvider = provider.toLowerCase().trim();

    // 1. Si no hay secreto configurado, bloquear procesamiento
    if (!secretKey || secretKey.trim().length === 0) {
      throw new WebhookVerificationError(
        provider,
        'PAYMENT PROVIDER PENDING CONFIGURATION: Clave secreta de webhook no configurada en el servidor.'
      );
    }

    // 2. Extraer cabecera según el estándar de cada proveedor
    let signatureHeader: string | undefined;

    if (normProvider === 'stripe') {
      signatureHeader = headers['stripe-signature'];
      if (!signatureHeader) {
        throw new WebhookVerificationError(provider, 'Cabecera stripe-signature ausente.');
      }
      return this.verifyStripeSignature(rawBody, signatureHeader, secretKey, toleranceSeconds);
    }

    if (normProvider === 'culqi') {
      signatureHeader = headers['x-culqi-signature'] || headers['x-signature'];
      if (!signatureHeader) {
        throw new WebhookVerificationError(provider, 'Cabecera x-culqi-signature ausente.');
      }
      return this.verifyHmacSha256(rawBody, signatureHeader, secretKey, provider);
    }

    if (normProvider === 'mercadopago') {
      signatureHeader = headers['x-signature'];
      if (!signatureHeader) {
        throw new WebhookVerificationError(provider, 'Cabecera x-signature ausente.');
      }
      return this.verifyMercadoPagoSignature(rawBody, signatureHeader, secretKey, toleranceSeconds, headers);
    }

    // Genérico con HMAC-SHA256 estándar
    signatureHeader = headers['x-signature'] || headers['authorization'];
    if (!signatureHeader) {
      throw new WebhookVerificationError(provider, 'Cabecera criptográfica de firma ausente.');
    }
    return this.verifyHmacSha256(rawBody, signatureHeader, secretKey, provider);
  }

  /**
   * Verificación oficial del protocolo Stripe (t=timestamp,v1=signature)
   */
  private static verifyStripeSignature(
    rawBody: string,
    header: string,
    secret: string,
    toleranceSeconds: number
  ): boolean {
    const items = header.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const item of items) {
      const parts = item.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          signatures.push(value);
        }
      }
    }

    if (!timestamp || signatures.length === 0) {
      throw new WebhookVerificationError('Stripe', 'Formato de cabecera stripe-signature inválido (falta t o v1).');
    }

    // Comprobar ventana de tolerancia (Anti-Replay / Clock Skew)
    const timestampInt = parseInt(timestamp, 10);
    if (isNaN(timestampInt)) {
      throw new WebhookVerificationError('Stripe', 'Timestamp de stripe-signature inválido.');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTimestamp - timestampInt) > toleranceSeconds) {
      throw new WebhookVerificationError(
        'Stripe',
        `Tolerancia de timestamp excedida (${Math.abs(currentTimestamp - timestampInt)}s > ${toleranceSeconds}s). Posible Replay Attack.`
      );
    }

    // Calcular firma esperada: HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
    const payloadToSign = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign, 'utf8')
      .digest('hex');

    // Comparación segura en tiempo constante contra todas las firmas v1 presentes
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    for (const candidate of signatures) {
      const candidateBuffer = Buffer.from(candidate, 'hex');
      if (candidateBuffer.length === expectedBuffer.length) {
        if (crypto.timingSafeEqual(candidateBuffer, expectedBuffer)) {
          return true;
        }
      }
    }

    throw new WebhookVerificationError('Stripe', 'Firma criptográfica v1 no coincide con el payload firmado.');
  }

  /**
   * Verificación estándar HMAC-SHA256 con timingSafeEqual
   */
  private static verifyHmacSha256(
    rawBody: string,
    providedSignature: string,
    secret: string,
    provider: string
  ): boolean {
    const cleanSignature = providedSignature.replace(/^sha256=/i, '').trim();

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(cleanSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      throw new WebhookVerificationError(provider, 'Longitud de firma criptográfica inválida.');
    }

    if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      throw new WebhookVerificationError(provider, 'Firma criptográfica inválida (hash no coincide).');
    }

    return true;
  }

  /**
   * Verificación para MercadoPago (ts=...,v1=...)
   */
  private static verifyMercadoPagoSignature(
    rawBody: string,
    header: string,
    secret: string,
    toleranceSeconds: number,
    headers: Record<string, string | undefined>
  ): boolean {
    // Si viene en formato simple hex
    if (!header.includes('=')) {
      return this.verifyHmacSha256(rawBody, header, secret, 'MercadoPago');
    }

    const parts = header.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k?.trim() === 'ts') ts = v?.trim() || '';
      if (k?.trim() === 'v1') hash = v?.trim() || '';
    }

    if (!ts || !hash) {
      return this.verifyHmacSha256(rawBody, header, secret, 'MercadoPago');
    }

    const tsInt = parseInt(ts, 10);
    const current = Math.floor(Date.now() / 1000);
    if (!isNaN(tsInt) && Math.abs(current - tsInt) > toleranceSeconds) {
      throw new WebhookVerificationError('MercadoPago', 'Timestamp de x-signature fuera de la ventana de tolerancia.');
    }

    const dataId = headers['x-request-id'] || '';
    const manifest = `id:${dataId};request-id:${headers['x-request-id'] || ''};ts:${ts};`;
    const expected = crypto.createHmac('sha256', secret).update(manifest, 'utf8').digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const providedBuffer = Buffer.from(hash, 'hex');

    if (expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      return true;
    }

    // Si falló el manifest con x-request-id, evaluar firma directa del rawBody
    return this.verifyHmacSha256(rawBody, hash, secret, 'MercadoPago');
  }
}
