// @ts-nocheck
import { resolveWhatsAppApiUrl } from "@whatsapp/lib/apiBase";

const AUTH_STORAGE_KEY = "whatsapp_auth_user";

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return {};
    const user = JSON.parse(stored);
    return {
      "x-user-id": user.id,
      "x-user-role": user.role || "user",
      "x-user-name": user.name || "",
      "x-user": JSON.stringify(user),
    };
  } catch {
    return {};
  }
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
