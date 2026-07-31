import { dehydrate, hydrate, QueryClient } from "@tanstack/react-query"

const CACHE_PREFIX = "crm-query-cache"
const CACHE_MAX_AGE = 30 * 60_000
const PERSISTED_QUERY_ROOTS = new Set([
  "dashboard",
  "leads",
  "paged",
  "reference",
  "settings",
  "notes",
  "notifications",
  "messages",
  "template-access",
])

const currentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("crm_user") || "null")?._id || "anonymous"
  } catch {
    return "anonymous"
  }
}

const cacheKey = () => `${CACHE_PREFIX}:${currentUserId()}`

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

if (typeof window !== "undefined") {
  try {
    const persisted = JSON.parse(localStorage.getItem(cacheKey()) || "null")
    if (persisted?.timestamp > Date.now() - CACHE_MAX_AGE && persisted?.state) {
      hydrate(queryClient, persisted.state)
    }
  } catch {
    localStorage.removeItem(cacheKey())
  }

  let persistTimer: number | undefined
  queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(cacheKey(), JSON.stringify({
          timestamp: Date.now(),
          state: dehydrate(queryClient, {
            shouldDehydrateQuery: (query) => (
              query.state.status === "success"
              && PERSISTED_QUERY_ROOTS.has(String(query.queryKey[0]))
            ),
          }),
        }))
      } catch {
        // Storage can be unavailable or full; in-memory caching still works.
      }
    }, 500)
  })
}

export const clearPersistedQueryCache = () => {
  if (typeof window === "undefined") return
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${CACHE_PREFIX}:`))
    .forEach((key) => localStorage.removeItem(key))
  queryClient.clear()
}
