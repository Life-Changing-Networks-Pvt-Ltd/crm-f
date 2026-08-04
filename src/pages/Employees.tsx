import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/layout/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import api from "@/services/api"
import { BellRing, BriefcaseBusiness, Eye, Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { can } from "@/lib/accessControl"

export default function Employees() {
  const navigate = useNavigate()
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const canManageEmployees = can(currentUser, "employees.manage")
  const canDelegateLeadNotifications = can(currentUser, "leads.manage_notifications")
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isNotificationAccessOpen, setIsNotificationAccessOpen] = useState(false)
  const [notificationDelegates, setNotificationDelegates] = useState<any[]>([])
  const [loadingNotificationDelegates, setLoadingNotificationDelegates] = useState(false)
  const [savingDelegateId, setSavingDelegateId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  // Filters state
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const { data, isLoading: loading, refetch } = usePaginatedQuery<any>({
    endpoint: "/employees/paged",
    page,
    limit: 25,
    params: {
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      department: departmentFilter === "all" ? undefined : departmentFilter,
    },
  })
  const employees = data?.items || []

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This employee record will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/employees/${id}`)
      await refetch()
      Swal.fire("Deleted!", "Employee has been deleted.", "success")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee")
    }
  }

  const openDetails = async (employee: any) => {
    try {
      const response = await api.get(`/employees/${employee._id}`)
      setSelectedEmployee(response.data.data)
      setIsViewOpen(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch employee details")
    }
  }

  const openNotificationAccess = async () => {
    setIsNotificationAccessOpen(true)
    try {
      setLoadingNotificationDelegates(true)
      const response = await api.get("/users/lead-notification-delegates")
      setNotificationDelegates(response.data.data || [])
    } catch (err: any) {
      setIsNotificationAccessOpen(false)
      toast.error(err.response?.data?.message || "Failed to load notification access")
    } finally {
      setLoadingNotificationDelegates(false)
    }
  }

  const updateNotificationAccess = async (delegate: any) => {
    const enabled = !delegate.enabled
    try {
      setSavingDelegateId(delegate._id)
      await api.put(`/users/${delegate._id}/lead-notification-access`, { enabled })
      setNotificationDelegates((current) => current.map((item) => (
        item._id === delegate._id ? { ...item, enabled } : item
      )))
      toast.success(`Lead notification access ${enabled ? "granted" : "revoked"}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update notification access")
    } finally {
      setSavingDelegateId(null)
    }
  }

  const uniqueDepartments = (data?.facets?.departments as string[] | undefined) || []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Employees" description="Create, assign, and manage employee records.">
        <div className="flex items-center gap-3">
          {canDelegateLeadNotifications && (
            <Button variant="outline" onClick={openNotificationAccess}>
              <BellRing className="mr-2 h-4 w-4" /> Notification Access
            </Button>
          )}
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search employees..."
            className="w-[220px]"
          />
          <Select value={departmentFilter} onValueChange={(value) => {
            setDepartmentFilter(value)
            setPage(1)
          }}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept as string} value={dept as string}>{dept as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}>
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          {canManageEmployees && (
            <Button onClick={() => navigate({ to: "/employees/new" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          )}
        </div>
      </PageHeader>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Get started by creating a new employee."
          actionLabel={canManageEmployees ? "Create Employee" : undefined}
          onAction={canManageEmployees ? () => navigate({ to: "/employees/new" }) : undefined}
          icon={<UserRound className="h-10 w-10 text-muted-foreground" />}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            
            {employees.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No employees match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-md">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-muted-foreground">{employee.employeeId} · {employee.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{employee.designation}</div>
                        <div className="text-xs text-muted-foreground">{employee.department}</div>
                      </TableCell>
                      <TableCell>{employee.manager?.name || "-"}</TableCell>
                      <TableCell>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDetails(employee)} title="View Details">
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          {canManageEmployees && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/employees/edit/${employee._id}` })} title="Edit Employee">
                                <Pencil className="h-4 w-4 text-orange-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(employee._id)} title="Delete Employee">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
          {data?.pagination && (
            <DataPagination pagination={data.pagination} onPageChange={setPage} />
          )}
        </Card>
      )}

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              Employee Details
            </DialogTitle>
            <DialogDescription>
              Complete profile for {selectedEmployee?.employeeId}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Detail label="Name" value={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} />
              <Detail label="Employee ID" value={selectedEmployee.employeeId} />
              <Detail label="Email" value={selectedEmployee.email} />
              <Detail label="Phone" value={selectedEmployee.phone} />
              <Detail label="Alternate Phone" value={selectedEmployee.alternatePhone || "-"} />
              <Detail label="Date of Birth" value={selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : "-"} />
              <Detail label="Gender" value={selectedEmployee.gender || "-"} />
              <Detail label="Joining Date" value={selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : "-"} />
              <Detail label="Status" value={selectedEmployee.status || "-"} />
              <Detail label="Designation" value={selectedEmployee.designation} />
              <Detail label="Department" value={selectedEmployee.department} />
              <Detail label="Employment Type" value={selectedEmployee.employmentType} />
              <Detail label="Manager" value={selectedEmployee.manager?.name || "-"} />
              <Detail label="Work Location" value={selectedEmployee.workLocation || "-"} />
              <Detail label="Salary" value={selectedEmployee.salary ? `₹${selectedEmployee.salary.toLocaleString()}` : "-"} />
              <Detail label="Emergency Contact" value={selectedEmployee.emergencyContact?.name ? `${selectedEmployee.emergencyContact.name} - ${selectedEmployee.emergencyContact.relationship || ''} (${selectedEmployee.emergencyContact.phone || "-"})` : "-"} />
              <div className="md:col-span-2">
                <Detail label="Address" value={[selectedEmployee.address?.line1, selectedEmployee.address?.line2, selectedEmployee.address?.city, selectedEmployee.address?.state, selectedEmployee.address?.country, selectedEmployee.address?.postalCode].filter(Boolean).join(", ") || "-"} />
              </div>

              <div className="md:col-span-2 mt-2 font-semibold border-b pb-1 text-sm text-muted-foreground uppercase tracking-wider">Bank Details</div>
              <Detail label="Account Name" value={selectedEmployee.bankDetails?.accountName || "-"} />
              <Detail label="Account Number" value={selectedEmployee.bankDetails?.accountNumber || "-"} />
              <Detail label="Bank Name" value={selectedEmployee.bankDetails?.bankName || "-"} />
              <Detail label="IFSC Code" value={selectedEmployee.bankDetails?.ifscCode || "-"} />

              <div className="md:col-span-2 mt-2">
                <Detail label="Notes" value={selectedEmployee.notes || "-"} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isNotificationAccessOpen} onOpenChange={setIsNotificationAccessOpen}>
        <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Lead Notification Access
            </DialogTitle>
            <DialogDescription>
              Allow team members to control automatic Email and WhatsApp notifications for individual leads.
            </DialogDescription>
          </DialogHeader>
          {loadingNotificationDelegates ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : notificationDelegates.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No eligible active team members found.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {notificationDelegates.map((delegate) => (
                <div key={delegate._id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{delegate.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {delegate.role} · {delegate.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={delegate.enabled}
                    aria-label={`Lead notification access for ${delegate.name}`}
                    disabled={savingDelegateId !== null}
                    onClick={() => updateNotificationAccess(delegate)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingDelegateId === delegate._id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${delegate.enabled ? "bg-primary" : "bg-muted-foreground/35"}`}>
                        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${delegate.enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </span>
                    )}
                    {delegate.enabled ? "Allowed" : "Not allowed"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
