import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/layout/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import api from "@/services/api"
import { BriefcaseBusiness, Eye, Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import Swal from "sweetalert2"

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get("/employees")
      setEmployees(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

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
      await fetchEmployees()
      Swal.fire("Deleted!", "Employee has been deleted.", "success")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee")
    }
  }

  const openDetails = (employee: any) => {
    setSelectedEmployee(employee)
    setIsViewOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Employees" description="Create, assign, and manage employee records.">
        <Button onClick={() => navigate({ to: "/employees/new" })}>
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Get started by creating a new employee."
          actionLabel="Create Employee"
          onAction={() => navigate({ to: "/employees/new" })}
          icon={<UserRound className="h-10 w-10 text-muted-foreground" />}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-md border">
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
                          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/employees/edit/${employee._id}` })} title="Edit Employee">
                            <Pencil className="h-4 w-4 text-orange-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(employee._id)} title="Delete Employee">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
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
              <Detail label="Designation" value={selectedEmployee.designation} />
              <Detail label="Department" value={selectedEmployee.department} />
              <Detail label="Employment Type" value={selectedEmployee.employmentType} />
              <Detail label="Manager" value={selectedEmployee.manager?.name || "-"} />
              <Detail label="Work Location" value={selectedEmployee.workLocation || "-"} />
              <Detail label="Salary" value={selectedEmployee.salary ? `₹${selectedEmployee.salary.toLocaleString()}` : "-"} />
              <Detail label="Emergency Contact" value={selectedEmployee.emergencyContact?.name ? `${selectedEmployee.emergencyContact.name} (${selectedEmployee.emergencyContact.phone || "-"})` : "-"} />
              <Detail label="Address" value={[selectedEmployee.address?.line1, selectedEmployee.address?.city, selectedEmployee.address?.state].filter(Boolean).join(", ") || "-"} />
              <div className="md:col-span-2">
                <Detail label="Notes" value={selectedEmployee.notes || "-"} />
              </div>
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
