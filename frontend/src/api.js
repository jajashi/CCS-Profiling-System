const rawBaseUrl = import.meta.env.VITE_API_URL;
const normalizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "";

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
