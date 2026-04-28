/**
 * Resolve API base URL depending on environment.
 */
function resolveApiBaseUrl() {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_DIRECT_API !== '1') {
    return '';
  }
  const raw = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL;
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
  // Render production fallback when env var is not set.
  if (host.includes('onrender.com')) {
    return 'https://testing-lang-lgsz.onrender.com';
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
  } catch (err) {
    console.error("Error parsing ccs_user from localStorage:", err);
    return {};
  }
}

export const apiFetch = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders(),
  };

  console.log("API Fetch →", apiUrl(path));
  console.log("Headers →", headers);

  const response = await fetch(apiUrl(path), { ...options, headers });

  if (response.status === 401) {
    console.warn("API Fetch: Unauthorized (401). Token may be missing or expired.");
    window.dispatchEvent(new CustomEvent('auth_expired'));
  }

  if (response.status === 409) {
    try {
      const errorData = await response.clone().json();
      if (errorData.conflictType) {
        window.dispatchEvent(new CustomEvent('api_conflict', { detail: errorData }));
      }
    } catch (err) {
      console.error("Error parsing 409 conflict response:", err);
    }
  }

  return response;
};
