// @ts-nocheck
import { resolveWhatsAppApiUrl } from "@whatsapp/lib/apiBase";

const AUTH_STORAGE_KEY = "whatsapp_auth_user";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('crm_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role || 'user';
      headers['x-user-name'] = user.name || '';
      headers['x-user'] = JSON.stringify(user);
    }
  } catch {
    // ignore
  }
  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(resolveWhatsAppApiUrl(url), {
    credentials: "include",
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
}
