import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Users as UsersIcon, UserPlus, ShieldAlert, Filter, RefreshCcw } from "lucide-react"
import api from "@/services/api"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28CFE', '#FF6666'];

export default function UserReports() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  useEffect(() => {
    fetchRoles()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles')
      setRoles(res.data.data || [])
    } catch (err) {
      console.error("Failed to fetch roles", err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const params: any = {}
      if (roleFilter && roleFilter !== 'all') params.role = roleFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const res = await api.get('/users', { params })
      setUsers(res.data.data || [])
    } catch (err) {
      setError("Failed to load user data for reports.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    setRoleFilter("all")
    setStartDate("")
    setEndDate("")
    
    // fetchUsers will be slightly delayed if we call it immediately because states might not have updated yet
    // But since it reads from params we can pass them directly or just let a useEffect handle it.
    // Better to fetch directly with empty params for reset:
    setLoading(true)
    api.get('/users').then(res => {
      setUsers(res.data.data || [])
    }).finally(() => setLoading(false))
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-destructive">
        <ShieldAlert className="h-12 w-12 mb-4" />
        <h2 className="text-lg font-semibold">{error}</h2>
      </div>
    )
  }

  // Calculate metrics
  const totalUsers = users.length;
  
  // Calculate users by role
  const roleCount: Record<string, number> = {};
  users.forEach(u => {
    const role = u.role || 'Unassigned';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  const roleData = Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] }));

  // Calculate users created over time (by month-year)
  const dateCount: Record<string, number> = {};
  users.forEach(u => {
    if (u.createdAt) {
      const date = new Date(u.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      dateCount[monthYear] = (dateCount[monthYear] || 0) + 1;
    }
  });
  const trendData = Object.keys(dateCount).map(key => ({ name: key, users: dateCount[key] }));

  const currentMonthYear = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
  const newUsersThisMonth = dateCount[currentMonthYear] || 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="User Reports & Analytics" 
        description="Comprehensive insights into user roles, growth, and team distribution." 
      />

      {/* Filter Section */}
      <Card className="shadow-sm border-muted">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1 min-w-[200px]">
              <Label htmlFor="role">Access Level (Role)</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r._id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2 flex-1 min-w-[150px]">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>

            <div className="grid gap-2 flex-1 min-w-[150px]">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={fetchUsers} className="flex-1 sm:flex-none gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button onClick={handleResetFilters} variant="outline" className="flex-1 sm:flex-none gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts in current view
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users added in {currentMonthYear}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles Types</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(roleCount).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active role configurations in view
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Tabular Data Report */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Detailed User Report</CardTitle>
          <CardDescription>Complete list of users matching the current filter criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role (Access Level)</th>
                    <th className="px-6 py-3 font-medium">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border relative">
                  {loading && (
                    <tr>
                      <td colSpan={4}>
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      </td>
                    </tr>
                  )}
                  {users.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No users found matching these filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">
                          {user.name}
                        </td>
                        <td className="px-6 py-4">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
