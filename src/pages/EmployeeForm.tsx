import { useEffect, useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft, BriefcaseBusiness, CreditCard, Loader2, MapPin, Phone, UserRound, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import api from "@/services/api"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  alternatePhone: "",
  dateOfBirth: "",
  gender: "",
  designation: "",
  department: "",
  employmentType: "Full-time",
  joiningDate: "",
  workLocation: "",
  salary: "",
  status: "Active",
  manager: "none",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  },
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
  bankDetails: {
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  },
  notes: "",
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "United Arab Emirates", "Singapore", "Japan",
  "China", "Brazil", "South Africa"
]

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

const formatDate = (value?: string) => {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0]
}

export default function EmployeeForm({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as any
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [teamLeaders, setTeamLeaders] = useState<any[]>([])
  const [generatedId, setGeneratedId] = useState("")
  const [loading, setLoading] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchTeamLeaders()
    if (mode === "edit" && employeeId) {
      fetchEmployee(employeeId)
    }
  }, [mode, employeeId])

  const fetchTeamLeaders = async () => {
    try {
      const res = await api.get("/employees/team-leaders")
      setTeamLeaders(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load team leaders")
    }
  }

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/employees/${id}`)
      const employee = res.data.data
      setGeneratedId(employee.employeeId || "")
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        password: "", // passwords are not fetched
        phone: employee.phone || "",
        alternatePhone: employee.alternatePhone || "",
        dateOfBirth: formatDate(employee.dateOfBirth),
        gender: employee.gender || "",
        designation: employee.designation || "",
        department: employee.department || "",
        employmentType: employee.employmentType || "Full-time",
        joiningDate: formatDate(employee.joiningDate),
        workLocation: employee.workLocation || "",
        salary: employee.salary?.toString() || "",
        status: employee.status || "Active",
        manager: employee.manager?._id || "none",
        address: {
          line1: employee.address?.line1 || "",
          line2: employee.address?.line2 || "",
          city: employee.address?.city || "",
          state: employee.address?.state || "",
          country: employee.address?.country || "",
          postalCode: employee.address?.postalCode || "",
        },
        emergencyContact: {
          name: employee.emergencyContact?.name || "",
          relationship: employee.emergencyContact?.relationship || "",
          phone: employee.emergencyContact?.phone || "",
        },
        bankDetails: {
          accountName: employee.bankDetails?.accountName || "",
          accountNumber: employee.bankDetails?.accountNumber || "",
          bankName: employee.bankDetails?.bankName || "",
          ifscCode: employee.bankDetails?.ifscCode || "",
        },
        notes: employee.notes || "",
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load employee")
      navigate({ to: "/employees" })
    } finally {
      setLoading(false)
    }
  }

  const setField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const setNestedField = (section: "address" | "emergencyContact" | "bankDetails", field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.designation || !formData.department || !formData.joiningDate || (mode === "create" && !formData.password)) {
      toast.error("Please fill all required fields (*)")
      return
    }

    const payload = {
      ...formData,
      manager: formData.manager === "none" ? "" : formData.manager,
    }

    try {
      setSubmitting(true)
      if (mode === "edit") {
        await api.put(`/employees/${employeeId}`, payload)
        toast.success("Employee updated successfully")
      } else {
        await api.post("/employees", payload)
        toast.success("Employee created successfully")
      }
      navigate({ to: "/employees" })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save employee")
    } finally {
      setSubmitting(false)
    }
  }

  const fillTestData = () => {
    setFormData({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "Password123!",
      phone: "1234567890",
      alternatePhone: "0987654321",
      dateOfBirth: "1990-01-01",
      gender: "Male",
      designation: "Software Engineer",
      department: "Engineering",
      employmentType: "Full-time",
      joiningDate: new Date().toISOString().split("T")[0],
      workLocation: "New York",
      salary: "120000",
      status: "Active",
      manager: "none",
      address: {
        line1: "123 Tech Street",
        line2: "Suite 400",
        city: "New York",
        state: "New York",
        country: "United States",
        postalCode: "10001",
      },
      emergencyContact: {
        name: "Jane Doe",
        relationship: "Spouse",
        phone: "555-1234",
      },
      bankDetails: {
        accountName: "John Doe",
        accountNumber: "123456789",
        bankName: "Chase Bank",
        ifscCode: "CHAS0123456",
      },
      notes: "Sample test data for employee creation.",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/employees" })} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title={mode === "edit" ? "Edit Employee" : "Create Employee"}
            description={mode === "edit" ? `Update details for ${generatedId}.` : "Employee ID will be generated automatically after saving."}
          />
        </div>
        {mode === "create" && (
          <Button variant="outline" type="button" onClick={fillTestData} className="border-primary text-primary">
            Fill Test Data
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-primary" />
              Personal Details
            </CardTitle>
            <CardDescription>Basic identity and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {mode === "edit" && (
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input value={generatedId} disabled />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
              <Input id="firstName" value={formData.firstName} onChange={(e) => setField("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input id="lastName" value={formData.lastName} onChange={(e) => setField("lastName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="password">Login Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setField("password", e.target.value)} 
                    placeholder="••••••••" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alternatePhone">Alternate Phone</Label>
              <Input id="alternatePhone" value={formData.alternatePhone} onChange={(e) => setField("alternatePhone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender || "none"} onValueChange={(value) => setField("gender", value === "none" ? "" : value)}>
                <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BriefcaseBusiness className="h-5 w-5 text-blue-500" />
              Job Details
            </CardTitle>
            <CardDescription>Role, department, manager, and employment details.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation <span className="text-destructive">*</span></Label>
              <Input id="designation" value={formData.designation} onChange={(e) => setField("designation", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
              <Input id="department" value={formData.department} onChange={(e) => setField("department", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Assign To Manager</Label>
              <Select value={formData.manager} onValueChange={(value) => setField("manager", value)}>
                <SelectTrigger id="manager"><SelectValue placeholder="Select team leader" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {teamLeaders.map((leader) => (
                    <SelectItem key={leader._id} value={leader._id}>
                      {leader.name} ({leader.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select value={formData.employmentType} onValueChange={(value) => setField("employmentType", value)}>
                <SelectTrigger id="employmentType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date <span className="text-destructive">*</span></Label>
              <Input id="joiningDate" type="date" value={formData.joiningDate} onChange={(e) => setField("joiningDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workLocation">Work Location</Label>
              <Input id="workLocation" value={formData.workLocation} onChange={(e) => setField("workLocation", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" type="number" min="0" value={formData.salary} onChange={(e) => setField("salary", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setField("status", value)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Address
            </CardTitle>
            <CardDescription>Residential address details.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input id="addressLine1" value={formData.address.line1} onChange={(e) => setNestedField("address", "line1", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input id="addressLine2" value={formData.address.line2} onChange={(e) => setNestedField("address", "line2", e.target.value)} />
            </div>
            <InputGroup id="city" label="City" value={formData.address.city} onChange={(value) => setNestedField("address", "city", value)} />
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              {formData.address.country === "India" ? (
                <Select value={formData.address.state} onValueChange={(value) => setNestedField("address", "state", value)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="state" value={formData.address.state} onChange={(e) => setNestedField("address", "state", e.target.value)} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.address.country}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      country: value,
                      state: value === "India" ? prev.address.state : "",
                    },
                  }))
                }}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InputGroup id="postalCode" label="Postal Code" value={formData.address.postalCode} onChange={(value) => setNestedField("address", "postalCode", value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-rose-500" />
              Emergency Contact
            </CardTitle>
            <CardDescription>Contact person for urgent situations.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <InputGroup id="emergencyName" label="Name" value={formData.emergencyContact.name} onChange={(value) => setNestedField("emergencyContact", "name", value)} />
            <InputGroup id="relationship" label="Relationship" value={formData.emergencyContact.relationship} onChange={(value) => setNestedField("emergencyContact", "relationship", value)} />
            <InputGroup id="emergencyPhone" label="Phone" value={formData.emergencyContact.phone} onChange={(value) => setNestedField("emergencyContact", "phone", value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-violet-500" />
              Bank Details
            </CardTitle>
            <CardDescription>Payroll account information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InputGroup id="accountName" label="Account Name" value={formData.bankDetails.accountName} onChange={(value) => setNestedField("bankDetails", "accountName", value)} />
            <InputGroup id="accountNumber" label="Account Number" value={formData.bankDetails.accountNumber} onChange={(value) => setNestedField("bankDetails", "accountNumber", value)} />
            <InputGroup id="bankName" label="Bank Name" value={formData.bankDetails.bankName} onChange={(value) => setNestedField("bankDetails", "bankName", value)} />
            <InputGroup id="ifscCode" label="IFSC Code" value={formData.bankDetails.ifscCode} onChange={(value) => setNestedField("bankDetails", "ifscCode", value)} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setField("notes", e.target.value)} rows={4} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-2 flex items-center justify-end gap-4">
          <Button type="button" variant="outline" size="lg" className="min-w-[120px]" onClick={() => navigate({ to: "/employees" })}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="min-w-[160px]" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {mode === "edit" ? "Save Changes" : "Save Employee"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function InputGroup({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
