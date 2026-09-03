// @ts-nocheck
const API_PREFIX = '/api'
const AUTH_STORAGE_KEY = 'whatsapp_auth_user'

function trimTrailingSlash(value: string) {
  return String(value || '').replace(/\/+$/, '')
}

function resolveWhatsAppApiBase() {
  const explicit = trimTrailingSlash(
    import.meta.env.VITE_WHATSAPP_MARKETING_API_URL || ''
  )

  if (explicit) return explicit

  const sellersloginApi = trimTrailingSlash(
    import.meta.env.VITE_PUBLIC_API_URL || ''
  )

  return sellersloginApi ? `${sellersloginApi}/whatsapp-marketing` : ''
}

export function resolveWhatsAppApiUrl(input: RequestInfo | URL) {
  if (typeof input !== 'string') return input
  if (!input.startsWith(API_PREFIX)) return input

  const apiBase = resolveWhatsAppApiBase()
  if (!apiBase) return input

  return `${apiBase}${input.slice(API_PREFIX.length)}`
}

export function installWhatsAppApiFetchAdapter() {
  if (typeof window === 'undefined') return

  const currentWindow = window as any
  if (currentWindow.__whatsappMarketingFetchPatched) return
  currentWindow.__whatsappMarketingFetchPatched = true

  const nativeFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const resolvedInput = resolveWhatsAppApiUrl(input)
    const isWhatsAppApiRequest =
      typeof input === 'string' && input.startsWith(API_PREFIX)

    if (!isWhatsAppApiRequest) {
      return nativeFetch(resolvedInput, init)
    }

    let authHeaders: Record<string, string> = {}
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
      const user = stored ? JSON.parse(stored) : null
      if (user?.id) {
        authHeaders = {
          'x-user-id': String(user.id),
          'x-user-role': String(user.role || 'user'),
          'x-user-name': String(user.name || ''),
          'x-user': JSON.stringify(user),
        }
      }
    } catch {
      // Keep unauthenticated API calls working (login, password reset, etc.).
    }

    const headers = new Headers(init.headers || {})
    const token = localStorage.getItem('crm_token')
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (!headers.has(key)) headers.set(key, value)
    })

    return nativeFetch(resolvedInput, {
      credentials: init.credentials || 'include',
      ...init,
      headers,
    })
  }
}
