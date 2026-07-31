import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, CalendarRange } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useUsersQuery } from "@/hooks/useCrmReferenceData"

export default function AttendanceReports() {
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1) // First day of current month
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [userId, setUserId] = useState<string>("all")
  
  const employeesQuery = useUsersQuery<any[]>("attendance")
  const employees = employeesQuery.data || []
  const reportQuery = useQuery<any[]>({
    queryKey: ["reports", "attendance", startDate, endDate, userId],
    enabled: Boolean(startDate && endDate),
    queryFn: async () => {
      const endpoint = `/attendance/report?startDate=${startDate}&endDate=${endDate}${userId !== 'all' ? `&userId=${userId}` : ''}`
      return (await api.get(endpoint)).data.data || []
    },
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  })
  const data = reportQuery.data || []
  const loading = reportQuery.isLoading
  useEffect(() => {
    if (reportQuery.error) {
      const error = reportQuery.error as any
      toast.error(error.response?.data?.message || "Failed to fetch attendance report")
    }
  }, [reportQuery.error])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Present</Badge>
      case 'Absent': return <Badge variant="destructive">Absent</Badge>
      case 'Half Day': return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">Half Day</Badge>
      case 'On Leave': return <Badge variant="outline" className="border-blue-500 text-blue-500">On Leave</Badge>
      default: return <Badge variant="outline" className="text-muted-foreground border-dashed">Not Marked</Badge>
    }
  }

  // Summary logic
  const totalDays = data.length
  const totalPresent = data.filter(d => d.status === 'Present').length
  const totalHalf = data.filter(d => d.status === 'Half Day').length
  const totalAbsent = data.filter(d => d.status === 'Absent').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance Reports" description="Analyze employee attendance over a custom date range." />

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 bg-muted/20 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Report Filters
          </CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">From:</span>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">To:</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Employee:</span>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b bg-muted/10">
             <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
               <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Total Records</span>
               <span className="text-2xl font-bold">{totalDays}</span>
             </div>
             <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg p-3 flex flex-col items-center justify-center">
               <span className="text-xs uppercase font-bold tracking-wider mb-1">Present</span>
               <span className="text-2xl font-bold">{totalPresent}</span>
             </div>
             <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg p-3 flex flex-col items-center justify-center">
               <span className="text-xs uppercase font-bold tracking-wider mb-1">Half Day</span>
               <span className="text-2xl font-bold">{totalHalf}</span>
             </div>
             <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 flex flex-col items-center justify-center">
               <span className="text-xs uppercase font-bold tracking-wider mb-1">Absent</span>
               <span className="text-2xl font-bold">{totalAbsent}</span>
             </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No attendance records found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((record) => (
                      <TableRow key={record._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                           {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{record.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{record.user?.role || '-'}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm tabular-nums">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm tabular-nums">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate" title={record.notes}>
                          {record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
