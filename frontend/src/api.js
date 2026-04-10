const rawBaseUrl = import.meta.env.VITE_API_URL;
const normalizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "";

export const apiBaseUrl = normalizedBaseUrl;

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

export const apiFetch = (path, options) => fetch(apiUrl(path), options);
