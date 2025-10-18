import { API_CONFIG } from '../services/config';

// Build an absolute, encoded URL for an image that may be relative
export function toAbsoluteImageUrl(url?: string | null): string {
  if (!url) return '';
  const base = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const u = new URL(url);
      // If this absolute URL points to an uploads path, always route via gateway (handles stale IPs)
      const uploadsIdx = u.pathname.indexOf('/uploads/');
      if (uploadsIdx !== -1) {
        const tail = u.pathname.substring(uploadsIdx); // '/uploads/..'
        const pathWithGateway = `/api/guide${tail}`;
        const encoded = pathWithGateway
          .split('/')
          .map((seg, idx) => (idx === 0 ? seg : encodeURIComponent(seg)))
          .join('/');
        return `${base}${encoded}`;
      }
      // Otherwise return as-is but safely encoded
      return encodeURI(url);
    }
    // Relative: ensure through gateway and encode
    const rawPath = url.startsWith('/') ? url : `/${url}`;
    const pathWithGateway = rawPath.startsWith('/api/guide') ? rawPath : `/api/guide${rawPath}`;
    const encoded = pathWithGateway
      .split('/')
      .map((seg, idx) => (idx === 0 ? seg : encodeURIComponent(seg)))
      .join('/');
    return `${base}${encoded}`;
  } catch {
    // Fallback best-effort
    const rawPath = url.startsWith('/') ? url : `/${url}`;
    return `${base}${rawPath}`;
  }
}

// Strip an absolute URL back to a relative path suitable for persistence (e.g., '/uploads/..')
export function toRelativeImagePath(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    // If already looks relative
    if (url.startsWith('/uploads/')) return url;
    if (url.startsWith('/api/guide/uploads/')) return url.replace('/api/guide', '');
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const u = new URL(url);
      // Expect '/api/guide/uploads/...' or '/uploads/...'
      if (u.pathname.startsWith('/api/guide/uploads/')) return u.pathname.replace('/api/guide', '');
      if (u.pathname.startsWith('/uploads/')) return u.pathname;
      return u.pathname; // fallback to path only
    }
    return url;
  } catch {
    return url || undefined;
  }
}
