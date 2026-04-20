/**
 * In Vite dev, use same-origin `/api/...` requests so the dev-server proxy (see vite.config.js)
 * forwards to the Express API. Calling http://localhost:5000 directly can 404 if nothing is
 * listening there, an old server is running without the latest routes, or the port differs.
 */
function resolveApiBaseUrl() {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_DIRECT_API !== '1') {
    return '';
  }
  const raw = import.meta.env.VITE_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '');
  }
  return resolveFallbackBaseUrl().replace(/\/+$/, '');
}

function resolveFallbackBaseUrl() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return '';
}

const normalizedBaseUrl = resolveApiBaseUrl();

export const apiBaseUrl = normalizedBaseUrl;

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem('ccs_user');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.token;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export const apiFetch = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders(),
  };
  const response = await fetch(apiUrl(path), { ...options, headers });
  
  if (response.status === 409) {
    try {
      const errorData = await response.clone().json();
      if (errorData.conflictType) {
        window.dispatchEvent(new CustomEvent('api_conflict', { detail: errorData }));
      }
    } catch {}
  }
  
  return response;
};
