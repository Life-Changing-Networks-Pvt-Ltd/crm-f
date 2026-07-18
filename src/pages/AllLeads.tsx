import { useState, useEffect } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Building2, Users, Send, Mail, MessageSquare } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import api from "@/services/api"
import { toast } from "sonner"

interface UnifiedLead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Customer' | 'Company';
  leadStatus: string;
  followTypeDate?: string;
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
  const [typeFilter, setTypeFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState(searchParams?.status || "All")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedLeadData, setSelectedLeadData] = useState<any>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedActionLead, setSelectedActionLead] = useState<UnifiedLead | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    setStatusFilter(searchParams?.status || "All")
  }, [searchParams?.status])

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

  const openActionDialog = (lead: UnifiedLead) => {
    setSelectedActionLead(lead)
    setActionDialogOpen(true)
  }

  const handleLeadAction = (type: "email" | "whatsapp") => {
    setActionDialogOpen(false)
    if (type === "email") {
      navigate({ to: "/email-marketing" })
      return
    }
    navigate({ to: "/whatsapp-campaigns" })
  }

  const filteredLeads = leads.filter(lead => {
    const matchesType = typeFilter === "All" || lead.type === typeFilter
    const matchesStatus = statusFilter === "All" || lead.leadStatus === statusFilter
    
    let matchesDate = true;
    let matchesFollowUp = true;
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
    if (searchParams?.followUp === "upcoming") {
      matchesFollowUp = lead.leadStatus === "Follow Up";
    }

    return matchesType && matchesDate && matchesStatus && matchesFollowUp
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="All Unified Leads" description="View and filter all your Companies and Customers.">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Interested">Interested</SelectItem>
              <SelectItem value="Not Interested">Not Interested</SelectItem>
              <SelectItem value="Prospective">Prospective</SelectItem>
              <SelectItem value="Follow Up">Follow Up</SelectItem>
              <SelectItem value="Committed">Committed</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Lead Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Company">Companies</SelectItem>
              <SelectItem value="Customer">Customers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Date Added" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => navigate({ to: '/leads' })} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
          </Button>
        </div>
      </PageHeader>

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
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => openActionDialog(lead)}
                      >
                        <Send className="h-4 w-4" />
                        Action
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

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Choose Action</DialogTitle>
            <DialogDescription>
              Select how you want to contact {selectedActionLead?.name || "this lead"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleLeadAction("email")}
            >
              <Mail className="h-6 w-6 text-blue-500" />
              Email
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleLeadAction("whatsapp")}
            >
              <MessageSquare className="h-6 w-6 text-emerald-500" />
              WhatsApp
            </Button>
          </div>
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
