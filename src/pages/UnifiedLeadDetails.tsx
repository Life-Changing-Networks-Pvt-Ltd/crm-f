import { useState, useEffect } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Send, MessageSquare, Paperclip, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import api from "@/services/api"
import { toast } from "sonner"


export default function UnifiedLeadDetails() {
  const { type, id } = useParams({ strict: false }) as any
  const navigate = useNavigate()
  
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commenting, setCommenting] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const [users, setUsers] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)

  const STATUSES = [
    { value: 'New', color: 'bg-blue-500' },
    { value: 'Interested', color: 'bg-emerald-500' },
    { value: 'Not Interested', color: 'bg-red-500' },
    { value: 'Prospective', color: 'bg-purple-500' },
    { value: 'Follow Up', color: 'bg-yellow-500' },
    { value: 'Committed', color: 'bg-orange-500' },
    { value: 'Converted', color: 'bg-green-500' }
  ]

  useEffect(() => {
    fetchLead()
    fetchUsers()
  }, [id, type])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  }

  const fetchLead = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/leads/unified/${type}/${id}`)
      setLead(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch lead details")
      navigate({ to: '/leads/all' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true)
      await api.put(`/leads/unified/${type}/${id}/status`, { status: newStatus })
      setLead({ ...lead, leadStatus: newStatus })
      toast.success("Status updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status")
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAssignChange = async (userId: string) => {
    try {
      setAssigning(true)
      await api.put(`/leads/unified/${type}/${id}/assign`, { assignedTo: userId })
      setLead({ ...lead, assignedTo: { _id: userId } }) // basic optimistic update
      fetchLead() // re-fetch to get populated name
      toast.success("Lead assigned successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign lead")
    } finally {
      setAssigning(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() && !attachment) return
    try {
      setCommenting(true)
      
      const formData = new FormData()
      if (commentText) formData.append("text", commentText)
      else formData.append("text", "File Attachment") // Fallback text if only file

      if (attachment) {
        formData.append("attachment", attachment)
      }

      const res = await api.post(`/leads/unified/${type}/${id}/comment`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      setLead(res.data.data) // backend returns updated lead with populated comments
      setCommentText("")
      removeAttachment()
      toast.success("Comment added")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add comment")
    } finally {
      setCommenting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit")
        return
      }
      setAttachment(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) return null

  const name = type === 'Company' ? lead.companyName : lead.name

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/leads/all' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title={<span className="cursor-pointer hover:underline text-primary" onClick={() => setModalOpen(true)}>{name}</span>} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        {/* Comments Section */}
        <Card className="flex flex-col shadow-sm border-muted/60 h-[600px]">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" /> 
              Comments & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/20">
              {(!lead.comments || lead.comments.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
                  <p>No comments yet.</p>
                  <p>Be the first to add a note!</p>
                </div>
              ) : (
                lead.comments.map((comment: any, i: number) => {
                  const isMine = comment.createdBy?._id === currentUser?._id;
                  return (
                    <div 
                      key={i} 
                      className={`flex flex-col gap-1.5 p-3 rounded-lg border text-sm w-fit max-w-[85%] relative shadow-sm ${
                        isMine 
                          ? 'self-end bg-primary/10 border-primary/20' 
                          : 'self-start bg-card'
                      }`}
                    >
                      <span className={`font-semibold text-xs ${isMine ? 'text-primary/80' : 'text-primary'}`}>
                        {isMine ? 'You' : (comment.createdBy?.name || 'Unknown User')}
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                      
                      {comment.attachment && (
                        <div className="mt-2 rounded-md overflow-hidden border border-border/50">
                          {comment.attachment.fileType === 'video' ? (
                            <video src={comment.attachment.url} controls className="max-w-full max-h-[300px] object-contain bg-black" />
                          ) : (
                            <img src={comment.attachment.url} alt="Attachment" className="max-w-full max-h-[300px] object-contain" />
                          )}
                        </div>
                      )}

                      <span className="text-[10px] text-muted-foreground self-end mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-4 border-t bg-card">
              {attachment && previewUrl && (
                <div className="mb-3 relative inline-block rounded-md overflow-hidden border shadow-sm">
                  {attachment.type.startsWith('video/') ? (
                    <video src={previewUrl} className="h-24 w-auto max-w-[200px] object-cover bg-black" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="h-24 w-auto max-w-[200px] object-cover" />
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-5 w-5 rounded-full" 
                    onClick={removeAttachment}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="relative">
                <Textarea 
                  placeholder="Type a comment or note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none pl-12 pr-12 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <Button 
                  variant="ghost"
                  size="icon" 
                  className="absolute bottom-2 left-2 h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                  onClick={handleAddComment}
                  disabled={commenting || (!commentText.trim() && !attachment)}
                >
                  {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1">Press Enter to send, Shift+Enter for new line. Max file size: 10MB.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-sm border-muted/60">
            <CardHeader className="pb-3 border-b bg-muted/10 mb-4">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground block text-xs font-semibold uppercase">Lead Status</span>
                <Select value={lead.leadStatus} onValueChange={handleStatusChange} disabled={statusUpdating}>
                  <SelectTrigger className="w-full">
                    {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${s.color}`} />
                          {s.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground block text-xs font-semibold uppercase">Assigned To</span>
                <Select value={lead.assignedTo?._id || ''} onValueChange={handleAssignChange} disabled={assigning}>
                  <SelectTrigger className="w-full">
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <SelectValue placeholder="Assign a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u._id !== currentUser?._id).map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {lead?.companyName || lead?.name}
            </DialogTitle>
            <DialogDescription>
              {lead ? `${lead.type || (lead.companyName ? 'Company' : 'Customer')} Profile` : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm mt-4">
            {lead?.companyName && (
              <>
                <DetailItem label="Customer Name" value={lead.customerName} />
                <DetailItem label="Designation" value={lead.customerDesignation} />
                <DetailItem label="Mobile No" value={lead.mobileNo} />
                <DetailItem label="Phone No" value={lead.phoneNo} />
                <DetailItem label="Email 1" value={lead.email1} />
                <DetailItem label="Email 2" value={lead.email2} />
                <DetailItem label="Products" value={lead.products} />
                <DetailItem label="Business Type" value={lead.businessType} />
                <DetailItem label="Website 1" value={lead.website1} />
                <DetailItem label="Website 2" value={lead.website2} />
                <DetailItem label="Address 1" value={lead.address1} />
                <DetailItem label="Address 2" value={lead.address2} />
                <DetailItem label="City" value={lead.city} />
                <DetailItem label="State" value={lead.state} />
                <DetailItem label="Country" value={lead.country} />
              </>
            )}
            {!lead?.companyName && (
              <>
                <DetailItem label="Name" value={lead?.name} />
                <DetailItem label="Email" value={lead?.email} />
                <DetailItem label="Phone" value={lead?.phone} />
                <DetailItem label="Company" value={lead?.company} />
                <DetailItem label="Address" value={lead?.address} />
                <DetailItem label="Total Spend" value={`$${lead?.totalSpend || 0}`} />
              </>
            )}
            <div className="col-span-full border-t pt-4 mt-2">
              <DetailItem label="Lead Source" value={lead?.leadSource} />
              <DetailItem label="Status" value={lead?.leadStatus} />
              <DetailItem label="Created By" value={lead?.createdBy?.name || 'System'} />
              <DetailItem label="Assigned To" value={lead?.assignedTo?.name || '-'} />
              <DetailItem label="Date Added" value={lead ? new Date(lead.createdAt).toLocaleDateString() : '-'} />
            </div>
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
