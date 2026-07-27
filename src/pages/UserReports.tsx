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

export default function UserReports() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("All")

  const { data, isLoading: loading, isError } = usePaginatedQuery<any>({
    endpoint: "/reports/users",
    page,
    limit: 50,
    params: { period: dateFilter },
  })
  const filteredData = data?.items || []
  useEffect(() => {
    if (isError) toast.error("Failed to load user report")
  }, [isError])

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="User Reports" description="Analyze user engagement and activity metrics.">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            void downloadReportCsv("users", { period: dateFilter })
              .catch(() => toast.error("Failed to export user report"))
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value); setPage(1) }}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Date Joined" />
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
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Leads Created</TableHead>
                <TableHead className="text-center">Meetings Completed</TableHead>
                <TableHead>Joined Date</TableHead>
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
                    No user data found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.role}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.leadsCreated}</TableCell>
                    <TableCell className="text-center">{item.meetingsCompleted}</TableCell>
                    <TableCell>{format(new Date(item.joinedAt), 'PP')}</TableCell>
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
