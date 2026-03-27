/**
 * API base URL for backend. Set in .env as VITE_API_URL.
 * Default: http://localhost:5000/api
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem("mill_token");
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
    headers: getAuthHeaders(),
    body: formData, // No Content-Type header; browser sets multipart/form-data with boundary
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
