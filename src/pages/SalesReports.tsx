import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { Button } from "@/components/ui/button"
import { downloadReportCsv } from "@/lib/reportExport"
import { toast } from "sonner"

export default function SalesReports() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const { data, isLoading: loading, isError } = usePaginatedQuery<any>({
    endpoint: "/reports/sales",
    page,
    limit: 50,
    params: { period: dateFilter, status: statusFilter },
  })
  const filteredData = data?.items || []
  useEffect(() => {
    if (isError) toast.error("Failed to load sales report")
  }, [isError])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return <Badge variant="secondary">New</Badge>
      case 'Prospective': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Prospective</Badge>
      case 'Interested': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Interested</Badge>
      case 'Not Interested': return <Badge variant="destructive">Not Interested</Badge>
      case 'Committed': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Committed</Badge>
      case 'Converted': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Converted</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Sales Reports" description="Analyze sales pipeline and lead conversion data.">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            void downloadReportCsv("sales", { period: dateFilter, status: statusFilter })
              .catch(() => toast.error("Failed to export sales report"))
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Prospective">Prospective</SelectItem>
              <SelectItem value="Interested">Interested</SelectItem>
              <SelectItem value="Not Interested">Not Interested</SelectItem>
              <SelectItem value="Committed">Committed</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); setPage(1) }}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No sales data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>{format(new Date(item.createdAt), 'PP')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DataPagination pagination={data?.pagination} onPageChange={setPage} />
      </div>
    </div>
  )
}
