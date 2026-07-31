import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import api from "@/services/api"

export const referenceQueryKeys = {
  roles: ["reference", "roles"] as const,
  roleCatalog: ["reference", "roles", "catalog"] as const,
  teams: (status = "all") => ["reference", "teams", status] as const,
  users: (purpose = "meeting") => ["reference", "users", purpose] as const,
  companies: (search = "") => ["reference", "companies", search] as const,
  customers: (search = "") => ["reference", "customers", search] as const,
  settings: ["settings"] as const,
}

const dataOf = <T,>(response: { data?: { data?: T } }, fallback: T): T =>
  response.data?.data ?? fallback

export const rolesQueryOptions = () => queryOptions({
  queryKey: referenceQueryKeys.roles,
  queryFn: async () => dataOf(await api.get("/roles"), []),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})

export const roleCatalogQueryOptions = () => queryOptions({
  queryKey: referenceQueryKeys.roleCatalog,
  queryFn: async () => dataOf(await api.get("/roles/catalog"), {}),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})

export const teamsQueryOptions = (status = "all") => queryOptions({
  queryKey: referenceQueryKeys.teams(status),
  queryFn: async () => dataOf(await api.get("/teams", { params: { status } }), []),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})

export const usersQueryOptions = (purpose = "meeting") => queryOptions({
  queryKey: referenceQueryKeys.users(purpose),
  queryFn: async () => dataOf(await api.get("/users/options", { params: { purpose } }), []),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})

export const companiesQueryOptions = (search = "") => queryOptions({
  queryKey: referenceQueryKeys.companies(search),
  queryFn: async () => dataOf(await api.get("/companies/options", {
    params: search ? { search } : undefined,
  }), []),
  staleTime: 2 * 60_000,
  gcTime: 30 * 60_000,
  placeholderData: keepPreviousData,
})

export const customersQueryOptions = (search = "") => queryOptions({
  queryKey: referenceQueryKeys.customers(search),
  queryFn: async () => dataOf(await api.get("/customers/options", {
    params: search ? { search } : undefined,
  }), []),
  staleTime: 2 * 60_000,
  gcTime: 30 * 60_000,
  placeholderData: keepPreviousData,
})

export const settingsQueryOptions = () => queryOptions({
  queryKey: referenceQueryKeys.settings,
  queryFn: async () => dataOf(await api.get("/settings"), {}),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
})

export const useRolesQuery = <T = unknown[]>() => useQuery({
  ...rolesQueryOptions(),
  select: (value) => value as T,
})

export const useRoleCatalogQuery = <T = Record<string, unknown>>() => useQuery({
  ...roleCatalogQueryOptions(),
  select: (value) => value as T,
})

export const useTeamsQuery = <T = unknown[]>(status = "all") => useQuery({
  ...teamsQueryOptions(status),
  select: (value) => value as T,
})

export const useUsersQuery = <T = unknown[]>(purpose = "meeting") => useQuery({
  ...usersQueryOptions(purpose),
  select: (value) => value as T,
})

export const useCompaniesQuery = <T = unknown[]>(search = "") => useQuery({
  ...companiesQueryOptions(search),
  select: (value) => value as T,
})

export const useCustomersQuery = <T = unknown[]>(search = "") => useQuery({
  ...customersQueryOptions(search),
  select: (value) => value as T,
})

export const useSettingsQuery = <T = Record<string, unknown>>() => useQuery({
  ...settingsQueryOptions(),
  select: (value) => value as T,
})
