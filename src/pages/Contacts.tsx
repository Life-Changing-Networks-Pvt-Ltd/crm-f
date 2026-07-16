import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useSelector } from "react-redux"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Users, Eye, Pencil, Trash2, Mail, Phone, Building, MapPin } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { RootState } from "@/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Swal from "sweetalert2"

export default function Contacts() {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // View Contact State
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/contacts')
      setContacts(res.data.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (contact: any) => {
    setSelectedContact(contact)
    setIsViewOpen(true)
  }

  const canEdit = (contact: any) => {
    if (!user) return false;
    return user.role === 'admin' || user._id === contact.createdBy?._id;
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/contacts/${id}`)
        Swal.fire('Deleted!', 'The contact has been deleted.', 'success')
        fetchContacts()
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to delete contact")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contacts" description="Manage your active contacts.">
        <Button onClick={() => navigate({ to: '/contacts/new' })}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="Get started by creating a new one."
          actionLabel="Create Contact"
          onAction={() => navigate({ to: '/contacts/new' })}
          icon={<Users className="h-10 w-10 text-muted-foreground" />}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-medium text-foreground">Contact Name</TableHead>
                    <TableHead className="font-medium text-foreground">Contact</TableHead>
                    <TableHead className="font-medium text-foreground">Company</TableHead>
                    <TableHead className="font-medium text-foreground">Status</TableHead>
                    <TableHead className="font-medium text-foreground">Created By</TableHead>
                    <TableHead className="font-medium text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact._id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{contact.phone || "-"}</div>
                        <div className="text-xs text-muted-foreground">{contact.email || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{contact.companyName || "-"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{contact.designation || ""}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${contact.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {contact.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contact.createdBy ? (
                          <>
                            <div className="font-medium text-sm">{contact.createdBy.name}</div>
                            <div className="text-xs text-muted-foreground">({contact.createdBy.role})</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(contact)} title="View Details">
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          {canEdit(contact) && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/contacts/edit/${contact._id}` })} title="Edit Contact">
                                <Pencil className="h-4 w-4 text-orange-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(contact._id)} title="Delete Contact">
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
          </CardContent>
        </Card>
      )}

      {/* View Contact Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Contact Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedContact?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="mt-4 space-y-4">
              
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md border">
                <div>
                  <span className="text-xs text-muted-foreground block">Contact Name</span>
                  <span className="font-medium text-lg">{selectedContact.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block mt-1 ${selectedContact.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedContact.status}
                  </span>
                </div>
                
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedContact.email || "No email provided"}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedContact.phone || "No phone provided"}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedContact.company || "No company provided"}</span>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{selectedContact.designation || "No designation provided"}</span>
                </div>
                

              </div>

            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
