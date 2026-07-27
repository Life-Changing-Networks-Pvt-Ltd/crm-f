export interface PaginationMeta {
  page: number
  requestedPage?: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PagedData<T> {
  items: T[]
  pagination: PaginationMeta
  facets?: Record<string, unknown>
}
