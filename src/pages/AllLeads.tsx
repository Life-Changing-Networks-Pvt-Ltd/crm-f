import { useState, useEffect } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Loader2, Building2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import api from "@/services/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface UnifiedLead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Customer' | 'Company';
  leadStatus: string;
  createdBy: string;
  assignedTo: string;
  commentsCount: number;
  createdAt: string;
}

export default function AllLeads() {
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false }) as any
  
  const [leads, setLeads] = useState<UnifiedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState(searchParams?.status || "All")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedLeadData, setSelectedLeadData] = useState<any>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const res = await api.get('/leads/all')
      setLeads(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch leads")
    } finally {
      setLoading(false)
    }
  }

  const openLeadDetails = async (lead: UnifiedLead) => {
    setModalOpen(true)
    setModalLoading(true)
    try {
      const res = await api.get(`/leads/unified/${lead.type}/${lead._id}`)
      setSelectedLeadData(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch details")
      setModalOpen(false)
    } finally {
      setModalLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.phone.includes(searchTerm)
                          
    const matchesType = typeFilter === "All" || lead.type === typeFilter
    const matchesStatus = statusFilter === "All" || lead.leadStatus === statusFilter
    
    let matchesDate = true;
    if (dateFilter !== "All") {
      const leadDate = new Date(lead.createdAt);
      const today = new Date();
      if (dateFilter === "Today") {
        matchesDate = leadDate.toDateString() === today.toDateString();
      } else if (dateFilter === "This Week") {
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        matchesDate = leadDate >= firstDay;
      } else if (dateFilter === "This Month") {
        matchesDate = leadDate.getMonth() === today.getMonth() && leadDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesDate && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="All Unified Leads" description="View and filter all your Companies and Customers.">
        <Button onClick={() => navigate({ to: '/leads' })} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Interested">Interested</SelectItem>
              <SelectItem value="Not Interested">Not Interested</SelectItem>
              <SelectItem value="Prospective">Prospective</SelectItem>
              <SelectItem value="Committed">Committed</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Lead Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Company">Companies</SelectItem>
              <SelectItem value="Customer">Customers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date Added" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No leads found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell 
                      className="font-medium text-primary cursor-pointer hover:underline"
                      onClick={() => openLeadDetails(lead)}
                    >
                      {lead.name}
                    </TableCell>
                    <TableCell>
                      {lead.type === 'Company' ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Building2 className="mr-1 h-3 w-3" /> Company
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Users className="mr-1 h-3 w-3" /> Customer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{lead.email || '-'}</span>
                        <span className="text-xs text-muted-foreground">{lead.phone || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.createdBy}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.assignedTo}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => navigate({ to: `/leads/all/${lead.type}/${lead._id}` })}
                      >
                        {lead.commentsCount} {lead.commentsCount === 1 ? 'Comment' : 'Comments'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {modalLoading ? "Loading..." : selectedLeadData?.companyName || selectedLeadData?.name}
            </DialogTitle>
            <DialogDescription>
              {modalLoading ? "" : selectedLeadData ? `${selectedLeadData.type || (selectedLeadData.companyName ? 'Company' : 'Customer')} Profile` : ""}
            </DialogDescription>
          </DialogHeader>
          
          {modalLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : selectedLeadData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm mt-4">
              {selectedLeadData.companyName && (
                <>
                  <DetailItem label="Customer Name" value={selectedLeadData.customerName} />
                  <DetailItem label="Designation" value={selectedLeadData.customerDesignation} />
                  <DetailItem label="Mobile No" value={selectedLeadData.mobileNo} />
                  <DetailItem label="Phone No" value={selectedLeadData.phoneNo} />
                  <DetailItem label="Email 1" value={selectedLeadData.email1} />
                  <DetailItem label="Email 2" value={selectedLeadData.email2} />
                  <DetailItem label="Products" value={selectedLeadData.products} />
                  <DetailItem label="Business Type" value={selectedLeadData.businessType} />
                  <DetailItem label="Website 1" value={selectedLeadData.website1} />
                  <DetailItem label="Website 2" value={selectedLeadData.website2} />
                  <DetailItem label="Address 1" value={selectedLeadData.address1} />
                  <DetailItem label="Address 2" value={selectedLeadData.address2} />
                  <DetailItem label="City" value={selectedLeadData.city} />
                  <DetailItem label="State" value={selectedLeadData.state} />
                  <DetailItem label="Country" value={selectedLeadData.country} />
                </>
              )}
              {!selectedLeadData.companyName && (
                <>
                  <DetailItem label="Name" value={selectedLeadData.name} />
                  <DetailItem label="Email" value={selectedLeadData.email} />
                  <DetailItem label="Phone" value={selectedLeadData.phone} />
                  <DetailItem label="Company" value={selectedLeadData.company} />
                  <DetailItem label="Address" value={selectedLeadData.address} />
                  <DetailItem label="Total Spend" value={`$${selectedLeadData.totalSpend || 0}`} />
                </>
              )}
              <div className="col-span-full border-t pt-4 mt-2">
                <DetailItem label="Lead Source" value={selectedLeadData.leadSource} />
                <DetailItem label="Status" value={selectedLeadData.leadStatus} />
                <DetailItem label="Created By" value={selectedLeadData.createdBy?.name || 'System'} />
                <DetailItem label="Assigned To" value={selectedLeadData.assignedTo?.name || '-'} />
                <DetailItem label="Date Added" value={new Date(selectedLeadData.createdAt).toLocaleDateString()} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase font-semibold">{label}</span>
      <span className="font-medium text-foreground mt-0.5">{value || '-'}</span>
    </div>
  )
}
