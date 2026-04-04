/**
 * API base URL for backend. Set in .env as VITE_API_URL.
 * Default: http://localhost:5000/api
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Get the current client ID.
 * Priority: localStorage (set at login) → VITE_CLIENT_ID env var
 * This is the value sent as the 'x-client-id' header to the backend.
 */
export const getClientId = () => {
  return localStorage.getItem("mill_client_id") || import.meta.env.VITE_CLIENT_ID || "";
};

/**
 * Build all required request headers including:
 * - Authorization Bearer token
 * - x-client-id for multi-tenant routing
 */
const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem("mill_token");
  const clientId = getClientId();

  const headers = { ...extraHeaders };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (clientId) {
    headers["x-client-id"] = clientId;
  }

  return headers;
};

export async function apiGet(path, params = {}) {
  const url = new URL(API_BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPost(path, body) {
  const res = await fetch(API_BASE_URL + path, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPut(path, body) {
  const res = await fetch(API_BASE_URL + path, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiDelete(path) {
  const res = await fetch(API_BASE_URL + path, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPostFormData(path, formData) {
  const res = await fetch(API_BASE_URL + path, {
    method: "POST",
    headers: getAuthHeaders(), // No Content-Type; browser sets multipart/form-data+boundary
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPutFormData(path, formData) {
  const res = await fetch(API_BASE_URL + path, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}
