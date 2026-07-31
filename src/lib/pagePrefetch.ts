import api from "@/services/api"
import { queryClient } from "@/lib/queryClient"
import {
  roleCatalogQueryOptions,
  rolesQueryOptions,
  settingsQueryOptions,
  teamsQueryOptions,
  usersQueryOptions,
} from "@/hooks/useCrmReferenceData"

const pagedQuery = (endpoint: string, limit = 25) => ({
  queryKey: ["paged", endpoint, 1, limit, {}],
  queryFn: async () => {
    const response = await api.get(endpoint, { params: { page: 1, limit } })
    return response.data.data
  },
  staleTime: 2 * 60_000,
  gcTime: 30 * 60_000,
})

export const prefetchPageData = (url: string) => {
  if (url === "/roles" || url === "/page-access") {
    void queryClient.prefetchQuery(rolesQueryOptions())
  }
  if (url === "/page-access" || url === "/users") {
    void queryClient.prefetchQuery(roleCatalogQueryOptions())
  }
  if (url === "/teams" || url === "/template-access" || url === "/users") {
    void queryClient.prefetchQuery(teamsQueryOptions(url === "/teams" ? "all" : "active"))
    void queryClient.prefetchQuery(usersQueryOptions(url === "/users" ? "manager" : "meeting"))
  }
  if (url === "/settings") {
    void queryClient.prefetchQuery(settingsQueryOptions())
  }

  const pagedEndpoints: Record<string, string> = {
    "/employees": "/employees/paged",
    "/tasks": "/tasks/paged",
    "/meetings": "/events/paged",
    "/notes": "/notes/paged",
    "/notifications": "/notifications/paged",
  }
  const endpoint = pagedEndpoints[url]
  if (endpoint) void queryClient.prefetchQuery(pagedQuery(endpoint))
}
