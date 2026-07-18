import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import api from "@/services/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function MarketingReports() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [dateFilter, setDateFilter] = useState("All")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/marketing')
      setData(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter((item: any) => {
    if (dateFilter === "All") return true;

    const d = new Date(item.dateAcquired);
    const today = new Date();
    if (dateFilter === "Today") {
      return d.toDateString() === today.toDateString();
    }
    if (dateFilter === "This Week") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      return d >= firstDay;
    }
    if (dateFilter === "This Month") {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Marketing Reports" description="Analyze lead acquisition and marketing performance.">
        <Select value={dateFilter} onValueChange={setDateFilter}>
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
      </div>
    </div>
  )
}
