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

export default function MeetingReports() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const { data, isLoading: loading, isError } = usePaginatedQuery<any>({
    endpoint: "/reports/meetings",
    page,
    limit: 50,
    params: { period: dateFilter, status: statusFilter },
  })
  const filteredData = data?.items || []
  useEffect(() => {
    if (isError) toast.error("Failed to load meeting report")
  }, [isError])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled': return <Badge variant="secondary">Scheduled</Badge>
      case 'Completed': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
      case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Meeting Reports" description="Analyze meetings, durations, and summaries.">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            void downloadReportCsv("meetings", { period: dateFilter, status: statusFilter })
              .catch(() => toast.error("Failed to export meeting report"))
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                <TableHead>Meeting Title</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration (Mins)</TableHead>
                <TableHead>Has Summary</TableHead>
                <TableHead>Scheduled Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No meeting data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.organizer}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.durationMinutes || '-'}</TableCell>
                    <TableCell>
                      {item.hasSummary ? (
                        <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(item.date), 'PP p')}</TableCell>
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
