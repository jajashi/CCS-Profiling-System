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

const GET_CACHE = new Map();
const INFLIGHT_GET = new Map();

function buildGetCacheKey(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const auth = getAuthHeaders().Authorization || "";
  return `${method}:${apiUrl(path)}:${auth}`;
}

export function invalidateApiCache(pathPrefix = "") {
  const prefix = String(pathPrefix || "").trim();
  if (!prefix) {
    GET_CACHE.clear();
    INFLIGHT_GET.clear();
    return;
  }
  const fullPrefix = apiUrl(prefix);
  for (const key of GET_CACHE.keys()) {
    if (key.includes(fullPrefix)) GET_CACHE.delete(key);
  }
  for (const key of INFLIGHT_GET.keys()) {
    if (key.includes(fullPrefix)) INFLIGHT_GET.delete(key);
  }
}

export async function apiGetCached(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET") {
    throw new Error("apiGetCached only supports GET requests.");
  }

  const ttlMs = Number.isFinite(options.ttlMs) ? options.ttlMs : 15000;
  const force = options.force === true;
  const key = buildGetCacheKey(path, options);
  const now = Date.now();
  const cached = GET_CACHE.get(key);

  if (!force && cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (!force && INFLIGHT_GET.has(key)) {
    return INFLIGHT_GET.get(key);
  }

  const promise = (async () => {
    const response = await apiFetch(path, { ...options, method: "GET" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload?.message || `Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    GET_CACHE.set(key, { data, expiresAt: now + Math.max(0, ttlMs) });
    return data;
  })();

  INFLIGHT_GET.set(key, promise);
  try {
    return await promise;
  } finally {
    INFLIGHT_GET.delete(key);
  }
}
