import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { PaginationMeta } from "@/types/pagination"

export function DataPagination({
  pagination,
  onPageChange,
}: {
  pagination?: PaginationMeta
  onPageChange: (page: number) => void
}) {
  useEffect(() => {
    if (pagination?.requestedPage && pagination.requestedPage !== pagination.page) {
      onPageChange(pagination.page)
    }
  }, [pagination?.page, pagination?.requestedPage, onPageChange])

  if (!pagination || pagination.total === 0) return null
  const firstItem = (pagination.page - 1) * pagination.limit + 1
  const lastItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">
        Showing {firstItem}–{lastItem} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrevious}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="min-w-20 text-center">
          {pagination.page} / {pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pagination.hasNext}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
