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

export default function MarketingReports() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("All")

  const { data, isLoading: loading, isError } = usePaginatedQuery<any>({
    endpoint: "/reports/marketing",
    page,
    limit: 50,
    params: { period: dateFilter },
  })
  const filteredData = data?.items || []
  useEffect(() => {
    if (isError) toast.error("Failed to load marketing report")
  }, [isError])

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Marketing Reports" description="Analyze lead acquisition and marketing performance.">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            void downloadReportCsv("marketing", { period: dateFilter })
              .catch(() => toast.error("Failed to export marketing report"))
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
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
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Acquisition Date</TableHead>
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
                    No marketing data found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.leadName}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.isConverted ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(item.dateAcquired), 'PP')}</TableCell>
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
