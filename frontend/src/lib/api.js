const rawBaseUrl = import.meta.env.VITE_API_URL;

function resolveFallbackBaseUrl() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return '';
}

const resolvedBaseUrl = rawBaseUrl || resolveFallbackBaseUrl();
const normalizedBaseUrl = resolvedBaseUrl ? resolvedBaseUrl.replace(/\/+$/, "") : "";

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

export const apiFetch = (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders(),
  };
  return fetch(apiUrl(path), { ...options, headers });
};
