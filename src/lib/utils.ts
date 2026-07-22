import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: unknown): string | undefined {
  const raw = typeof path === 'string'
    ? path
    : path && typeof path === 'object'
      ? String((path as any).url || (path as any).secure_url || (path as any).src || '')
      : ''
  const value = raw.trim()
  if (!value) return undefined
  if (/^(https?:|data:)/i.test(value)) return value
  const apiBase = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
  return `${apiBase}/${value.replace(/^\/+/, '')}`
}
