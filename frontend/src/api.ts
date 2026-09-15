const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}