import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarDays, Activity, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/services/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"

export default function DashboardReports() {
  const [dateFilter, setDateFilter] = useState("All")
  const reportQuery = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: async () => (await api.get('/reports/dashboard')).data.data,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
  })
  const data = reportQuery.data
  const loading = reportQuery.isLoading
  useEffect(() => {
    if (reportQuery.error) {
      const error = reportQuery.error as any
      toast.error(error.response?.data?.message || "Failed to load report")
    }
  }, [reportQuery.error])

  const metrics = [
    { title: "Total Leads", value: data?.metrics?.totalLeads || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Customers", value: data?.metrics?.totalCustomers || 0, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Companies", value: data?.metrics?.totalCompanies || 0, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Meetings", value: data?.metrics?.totalMeetings || 0, icon: CalendarDays, color: "text-orange-500", bg: "bg-orange-500/10" }
  ]

  const filteredActivities = data?.recentActivities?.filter((activity: any) => {
    if (dateFilter === "All") return true;
    const d = new Date(activity.date);
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
  }) || [];

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Dashboard Reports" description="High-level overview of system metrics and recent activities.">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold">Recent System Activities</h3>
        </div>
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No recent activities found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity: any) => (
                  <TableRow key={activity.id}>
                    <TableCell>{format(new Date(activity.date), 'PP p')}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.action}</TableCell>
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
