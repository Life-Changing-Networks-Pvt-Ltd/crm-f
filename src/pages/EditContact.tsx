import { useState, useEffect } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Users, Contact, CreditCard } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function EditContact() {
  const { contactId } = useParams({ strict: false }) as any
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    status: 'Active',
    
  })

  useEffect(() => {
    if (contactId) {
      fetchContactDetails(contactId)
    }
  }, [contactId])

  const fetchContactDetails = async (id: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/contacts/${id}`)
      const data = res.data.data
      
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        address: data.address || '',
        status: data.status || 'Active',
        totalSpend: data.totalSpend || 0
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load contact details")
      navigate({ to: '/contacts' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error("Contact name is required")
      return
    }

    try {
      setSubmitting(true)
      await api.put(`/contacts/${contactId}`, formData)
      toast.success("Contact updated successfully")
      navigate({ to: '/contacts' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update contact")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/contacts' })} className="rounded-full hover:bg-muted/80">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title="Edit Contact" 
          description="Update details for this contact." 
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Basic Info */}
        <Card className="shadow-sm border-muted/60 overflow-hidden">
          <div className="bg-primary/5 h-1 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>Primary identification details for the contact.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="font-semibold text-foreground/80">Contact Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="max-w-2xl bg-background" placeholder="E.g., Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="E.g., Acme Corp" />
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
            <CardDescription>How to reach the contact.</CardDescription>
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
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="E.g., Software Engineer" />
            </div>
          </CardContent>
        </Card>

        

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <Button type="button" variant="outline" size="lg" className="min-w-[120px]" onClick={() => navigate({ to: '/contacts' })}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="min-w-[160px]" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Save Changes
          </Button>
        </div>

      </form>
    </div>
  )
}
