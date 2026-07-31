import { keepPreviousData, useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import type { PagedData } from "@/types/pagination"

interface PaginatedQueryOptions {
  endpoint: string
  page: number
  limit?: number
  params?: Record<string, string | number | undefined>
  enabled?: boolean
  staleTime?: number
}

export const usePaginatedQuery = <T>({
  endpoint,
  page,
  limit = 25,
  params = {},
  enabled = true,
  staleTime = 2 * 60_000,
}: PaginatedQueryOptions) => {
  const normalizedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  )
  return useQuery({
    queryKey: ["paged", endpoint, page, limit, normalizedParams],
    enabled,
    staleTime,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const response = await api.get(endpoint, {
        params: { page, limit, ...normalizedParams },
        signal,
      })
      return response.data.data as PagedData<T>
    },
  })
}
