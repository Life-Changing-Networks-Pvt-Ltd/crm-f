import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Plus, Pencil, Trash2, Loader2, RefreshCw, KeyRound, Users, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import api from "@/services/api"
import Swal from "sweetalert2"
import { toast } from "sonner"

interface VendorData {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  leadsCount: number;
  employeesCount: number;
  indiamart?: {
    apiKey?: string;
    mobileNumber?: string;
    syncStatus?: string;
    lastSyncAt?: string;
    lastError?: string;
  };
}

export default function Vendors() {
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorData | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    indiamartApiKey: "",
    indiamartMobileNumber: "",
  })

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const res = await api.get("/vendors", {
        params: {
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      })
      setVendors(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVendors()
  }

  const handleOpenCreate = () => {
    setEditingVendor(null)
    setShowPassword(false)
    setFormData({
      companyName: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      indiamartApiKey: "",
      indiamartMobileNumber: "",
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (vendor: VendorData) => {
    setEditingVendor(vendor)
    setShowPassword(false)
    setFormData({
      companyName: vendor.companyName || "",
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      password: "",
      indiamartApiKey: vendor.indiamart?.apiKey || "",
      indiamartMobileNumber: vendor.indiamart?.mobileNumber || "",
    })
    setDialogOpen(true)
  }

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyName || !formData.name || !formData.email) {
      toast.error("Please fill in Company Name, Owner Name, and Email.")
      return
    }

    if (!editingVendor && !formData.password) {
      toast.error("Password is required for new vendors.")
      return
    }

    try {
      setSaving(true)
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor._id}`, {
          companyName: formData.companyName,
          name: formData.name,
          phone: formData.phone,
          password: formData.password || undefined,
        })
        toast.success("Vendor updated successfully")
      } else {
        await api.post("/vendors", formData)
        toast.success("Vendor created successfully")
      }
      setDialogOpen(false)
      fetchVendors()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save vendor")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVendor = (vendor: VendorData) => {
    Swal.fire({
      title: "Deactivate Vendor?",
      text: `Are you sure you want to deactivate ${vendor.companyName}? They will no longer be able to log in.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, deactivate",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/vendors/${vendor._id}`)
          toast.success("Vendor deactivated")
          fetchVendors()
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to deactivate vendor")
        }
      }
    })
  }

  // Summary Metrics
  const totalVendors = vendors.length
  const connectedVendors = vendors.filter(
    (v) => v.indiamart?.syncStatus === "connected"
  ).length
  const totalLeads = vendors.reduce((acc, curr) => acc + (curr.leadsCount || 0), 0)

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Vendors & Clients"
          description="Manage client vendors, their IndiaMART lead integrations, and team limits."
        />
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Vendor
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Registered Vendors
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              IndiaMART Connected
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {connectedVendors}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ingested Leads
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalLeads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-lg border">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by company, owner, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchVendors} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company & Owner</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>IndiaMART Integration</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead className="text-center">Team Size</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <span className="text-sm text-muted-foreground mt-2 block">
                      Loading vendors...
                    </span>
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No vendors found. Click "+ Add New Vendor" to onboard your first client.
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => {
                  const isConnected = vendor.indiamart?.syncStatus === "connected"
                  const hasError = vendor.indiamart?.syncStatus === "error"

                  return (
                    <TableRow key={vendor._id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {vendor.companyName || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Owner: {vendor.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{vendor.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {vendor.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isConnected ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-300">
                            ● Connected
                          </Badge>
                        ) : hasError ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" /> Error
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Configured
                          </Badge>
                        )}
                        {vendor.indiamart?.lastSyncAt && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Synced: {new Date(vendor.indiamart.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="secondary" className="px-2.5 py-0.5">
                          {vendor.leadsCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="px-2.5 py-0.5">
                          {vendor.employeesCount || 0} members
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={vendor.status === "active" ? "default" : "secondary"}
                          className={vendor.status === "active" ? "bg-emerald-600" : ""}
                        >
                          {vendor.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(vendor)}
                            title="Edit Vendor"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVendor(vendor)}
                            title="Deactivate Vendor"
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Vendor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor Details" : "Onboard New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? "Update vendor company information and credentials."
                : "Create a new client workspace. They will be able to log in and manage their leads."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVendor} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">
                Company / Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Apex Industrial Tools Pvt Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Owner / Director Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Rajesh Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email (Login ID) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vendor@company.com"
                  value={formData.email}
                  disabled={Boolean(editingVendor)}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                {editingVendor ? "New Password (leave empty to keep current)" : "Password"}
                {!editingVendor && <span className="text-destructive"> *</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingVendor ? "••••••••" : "Minimum 6 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingVendor}
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!editingVendor && (
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <KeyRound className="h-3.5 w-3.5 text-primary" /> IndiaMART API Setup (Optional)
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="indiamartMobileNumber" className="text-xs">IndiaMART Registered Mobile</Label>
                  <Input
                    id="indiamartMobileNumber"
                    placeholder="98XXXXXXXX"
                    value={formData.indiamartMobileNumber}
                    onChange={(e) => setFormData({ ...formData, indiamartMobileNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="indiamartApiKey" className="text-xs">IndiaMART CRM Key</Label>
                  <Input
                    id="indiamartApiKey"
                    placeholder="Paste vendor's CRM Key here"
                    value={formData.indiamartApiKey}
                    onChange={(e) => setFormData({ ...formData, indiamartApiKey: e.target.value })}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingVendor ? "Save Changes" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
