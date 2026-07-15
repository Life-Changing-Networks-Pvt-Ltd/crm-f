import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Users, Contact, CreditCard, FileSpreadsheet } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExcelImportModal } from "@/components/shared/ExcelImportModal"

export default function CreateCustomer() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'Active',
    totalSpend: 0
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error("Customer name is required")
      return
    }

    try {
      setSubmitting(true)
      await api.post('/customers', formData)
      toast.success("Customer created successfully")
      navigate({ to: '/customers' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create customer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleImport = async (data: any[]) => {
    try {
      const res = await api.post('/customers/bulk', { data })
      toast.success(res.data.message || "Customers imported successfully")
      navigate({ to: '/customers' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to import customers")
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/customers' })} className="rounded-full hover:bg-muted/80">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader 
            title="Create Customer" 
            description="Add a new customer to your database." 
          />
        </div>
        <Button variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => setIsImportModalOpen(true)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
        </Button>
      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Customers"
        templateName="Customers"
        templateHeaders={["Name", "Email", "Phone", "Company", "Address", "Status", "TotalSpend"]}
        onImport={handleImport}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Basic Info */}
        <Card className="shadow-sm border-muted/60 overflow-hidden">
          <div className="bg-primary/5 h-1 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>Primary identification details for the customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="font-semibold text-foreground/80">Customer Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="max-w-2xl bg-background" placeholder="E.g., Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="E.g., Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(p => ({...p, status: val}))}>
                <SelectTrigger id="status" className="bg-background">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="shadow-sm border-muted/60 overflow-hidden">
          <div className="bg-blue-500/10 h-1 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Contact className="h-5 w-5 text-blue-500" />
              Contact Details
            </CardTitle>
            <CardDescription>How to reach the customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street address, City, Country" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card className="shadow-sm border-muted/60 overflow-hidden">
          <div className="bg-emerald-500/10 h-1 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              Financial Information
            </CardTitle>
            <CardDescription>Track revenue and spending.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="totalSpend">Total Spend (₹)</Label>
              <Input id="totalSpend" name="totalSpend" type="number" min="0" value={formData.totalSpend} onChange={(e) => setFormData(p => ({...p, totalSpend: Number(e.target.value)}))} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <Button type="button" variant="outline" size="lg" className="min-w-[120px]" onClick={() => navigate({ to: '/customers' })}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="min-w-[160px]" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Save Customer
          </Button>
        </div>

      </form>
    </div>
  )
}
