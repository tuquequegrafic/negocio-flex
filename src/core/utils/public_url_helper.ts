/**
 * Negocio Flex - Helper de URLs Públicas de Negocios (Fase 7)
 * Permite detectar, normalizar y construir URLs de acceso público por slug.
 * Soporta:
 *  - /r/:slug
 *  - ?slug=:slug
 *  - ?r=:slug
 *  - #r/:slug o #/r/:slug
 */

export function detectPublicSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Pathname: /r/:slug (e.g. /r/don-corleone or /r/don-corleone/)
    const pathname = window.location.pathname;
    const pathMatch = pathname.match(/^\/r\/([a-zA-Z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // 2. Query Params: ?slug=:slug or ?r=:slug
    const searchParams = new URLSearchParams(window.location.search);
    const querySlug = searchParams.get('slug') || searchParams.get('r');
    if (querySlug && querySlug.trim()) {
      return querySlug.trim();
    }

    // 3. Hash: #r/:slug o #/r/:slug
    const hash = window.location.hash;
    const hashMatch = hash.match(/^#\/?r\/([a-zA-Z0-9_-]+)/i);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1];
    }
  } catch {
    // Fallback silencioso
  }

  return null;
}

export function buildPublicBusinessUrl(slug: string): string {
  if (typeof window === 'undefined') return `/r/${slug}`;
  const origin = window.location.origin;
  return `${origin}/r/${slug}`;
}

export function setUrlSlugWithoutReload(slug: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (slug) {
      window.history.pushState({ slug }, '', `/r/${slug}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  } catch {
    // Fallback silencioso
  }
}
