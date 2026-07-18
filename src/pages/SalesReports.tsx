import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import api from "@/services/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function SalesReports() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [dateFilter, setDateFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/sales')
      setData(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter((item: any) => {
    if (statusFilter !== "All" && item.status !== statusFilter) return false;
    if (dateFilter === "All") return true;

    const d = new Date(item.createdAt);
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      </div>
    </div>
  )
}
