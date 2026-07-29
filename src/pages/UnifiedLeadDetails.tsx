import { useState, useEffect, type Dispatch, type SetStateAction } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, MessageSquare, Paperclip, X, Phone, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api, { BACKEND_URL } from "@/services/api"
import { toast } from "sonner"
import { browserPhone } from "@/services/browserPhone"

const dateTimeInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const FOLLOW_UP_TYPES = ["Call", "WhatsApp", "Email", "Meeting", "Demo", "Other"]
const FOLLOW_UP_PRIORITIES = ["Low", "Normal", "High", "Urgent"]
const FOLLOW_UP_REMINDERS = [
  { value: "15_minutes", label: "15 minutes before" },
  { value: "30_minutes", label: "30 minutes before" },
  { value: "1_hour", label: "1 hour before" },
  { value: "1_day", label: "1 day before" },
]

interface FollowUpForm {
  followUpRequired: boolean
  followUpDateTime: string
  followUpType: string
  followUpPriority: string
  followUpReminder: string
}

type StatusDetailsForm = {
  note: string
  productService: string
  expectedDecisionDate: string
  demoDateTime: string
  demoMode: string
  meetingLink: string
  location: string
  reminder: string
  reason: string
  requirement: string
  estimatedDealValue: string
  expectedClosingDate: string
  committedProductService: string
  dealValue: string
  expectedCompletionDate: string
  convertedAt: string
  finalDealValue: string
}

const dateInputValue = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : ""

const statusDetailsForm = (status: string, details?: any): StatusDetailsForm => {
  const saved = details?.status === status ? details : {}
  return {
    note: saved.note || "",
    productService: saved.productService || "",
    expectedDecisionDate: dateInputValue(saved.expectedDecisionDate),
    demoDateTime: saved.demoDateTime ? dateTimeInputValue(new Date(saved.demoDateTime)) : "",
    demoMode: saved.demoMode || "Online",
    meetingLink: saved.meetingLink || "",
    location: saved.location || "",
    reminder: saved.reminder || "30_minutes",
    reason: saved.reason || "",
    requirement: saved.requirement || "",
    estimatedDealValue: saved.estimatedDealValue?.toString() || "",
    expectedClosingDate: dateInputValue(saved.expectedClosingDate),
    committedProductService: saved.committedProductService || "",
    dealValue: saved.dealValue?.toString() || "",
    expectedCompletionDate: dateInputValue(saved.expectedCompletionDate),
    convertedAt: dateInputValue(saved.convertedAt) || dateInputValue(new Date().toISOString()),
    finalDealValue: saved.finalDealValue?.toString() || "",
  }
}

const followUpFormFromLead = (lead: any): FollowUpForm => ({
  followUpRequired: lead?.followUpRequired === true
    || lead?.leadStatus === "Follow Up"
    || ["Pending", "Snoozed"].includes(lead?.status),
  followUpDateTime: lead?.followUpDateTime
    ? dateTimeInputValue(new Date(lead.followUpDateTime))
    : "",
  followUpType: lead?.followUpType || lead?.type || "Call",
  followUpPriority: lead?.followUpPriority || lead?.priority || "Normal",
  followUpReminder: lead?.followUpReminder || lead?.reminderBefore || "1_hour",
})

export default function UnifiedLeadDetails() {
  const { type, id } = useParams({ strict: false }) as any
  const leadType = type || "Company"
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>(() => followUpFormFromLead(null))
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [statusDetails, setStatusDetails] = useState<StatusDetailsForm>(() => statusDetailsForm("New"))
  const [savingStatusDetails, setSavingStatusDetails] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [followUpHistory, setFollowUpHistory] = useState<any[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const [users, setUsers] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [calling, setCalling] = useState(false)

  const getAttachmentUrl = (url: string) => {
    if (!url) return ""
    try {
      const parsed = new URL(url)
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${BACKEND_URL}${parsed.pathname}`
      }
      return url
    } catch {
      return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`
    }
  }

  const STATUSES = [
    { value: 'New', color: 'bg-blue-500' },
    { value: 'Demo Scheduled', color: 'bg-cyan-500' },
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
    fetchCallLogs()
  }, [id, leadType])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/leads/assignable-users')
      setUsers(res.data.data)
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  }

  const fetchLead = async () => {
    try {
      setLoading(true)
      const [leadResponse, followUpResponse] = await Promise.all([
        api.get(`/leads/unified/${leadType}/${id}`),
        leadType === "Company" ? api.get(`/follow-ups/lead/${id}`) : Promise.resolve(null),
      ])
      const leadData = leadResponse.data.data
      const activeFollowUp = followUpResponse?.data?.data?.active
      setLead(leadData)
      setStatusDetails(statusDetailsForm(leadData.leadStatus, leadData.statusDetails))
      setFollowUpHistory(followUpResponse?.data?.data?.items || [])
      setFollowUpForm(followUpFormFromLead(activeFollowUp || leadData))
      setCommentText(activeFollowUp?.message || "")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch lead details")
      navigate({ to: leadType === "Company" ? '/leads' : '/leads/all' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCallLogs = async () => {
    try {
      const res = await api.get(`/leads/unified/${leadType}/${id}/calls`)
      const calls = res.data.data || []
      setCallLogs(calls)
    } catch (err) {
      console.error("Failed to fetch call logs", err)
    }
  }

  const handleClickToCall = async () => {
    try {
      setCalling(true)
      await browserPhone.start(leadType, id, lead?.companyName || lead?.name || "Lead")
      fetchCallLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start call")
    } finally {
      setCalling(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true)
      const response = await api.put(`/leads/unified/${leadType}/${id}/status`, { status: newStatus })
      setLead({
        ...lead,
        leadStatus: newStatus,
        leadStatusChangedAt: response.data.data?.leadStatusChangedAt,
        followUpRequired: newStatus === "Follow Up" ? lead.followUpRequired : false,
        followUpDateTime: newStatus === "Follow Up" ? lead.followUpDateTime : null,
      })
      setStatusDetails(statusDetailsForm(newStatus, response.data.data?.statusDetails))
      setFollowUpForm((current) => ({ ...current, followUpRequired: newStatus === "Follow Up" }))
      window.dispatchEvent(new CustomEvent("follow-up-reminders-refresh"))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] }),
        queryClient.invalidateQueries({ queryKey: ["leads", "stats"] }),
      ])
      toast.success("Status updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status")
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSaveStatusDetails = async () => {
    if (lead.leadStatus === "Demo Scheduled" && !statusDetails.demoDateTime) {
      toast.error("Select a demo date and time")
      return
    }
    if (lead.leadStatus === "Not Interested" && !statusDetails.reason) {
      toast.error("Select a reason")
      return
    }
    try {
      setSavingStatusDetails(true)
      const response = await api.put(`/leads/unified/${leadType}/${id}/status`, {
        status: lead.leadStatus,
        details: statusDetails,
      })
      setLead((current: any) => ({ ...current, statusDetails: response.data.data?.statusDetails }))
      setStatusDetails(statusDetailsForm(lead.leadStatus, response.data.data?.statusDetails))
      await queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] })
      toast.success(`${lead.leadStatus} details saved`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save status details")
    } finally {
      setSavingStatusDetails(false)
    }
  }

  useEffect(() => {
    const refreshFollowUp = () => void fetchLead()
    window.addEventListener("follow-up-updated", refreshFollowUp)
    return () => window.removeEventListener("follow-up-updated", refreshFollowUp)
  }, [id, leadType])

  const handleSaveFollowUp = async () => {
    if (!followUpForm.followUpDateTime) {
      toast.error("Select a follow-up date and time")
      return
    }
    if (!commentText.trim()) {
      toast.error("Enter a follow-up message")
      return
    }

    try {
      setSavingFollowUp(true)
      const formData = new FormData()
      formData.append("followUpRequired", "true")
      formData.append("message", commentText.trim())
      formData.append("followUpDateTime", new Date(followUpForm.followUpDateTime).toISOString())
      formData.append("followUpType", followUpForm.followUpType)
      formData.append("followUpPriority", followUpForm.followUpPriority)
      formData.append("followUpReminder", followUpForm.followUpReminder)
      if (attachment) formData.append("attachment", attachment)
      const response = await api.post(`/follow-ups/lead/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const savedFollowUp = response.data.data?.followUp
      setLead((current: any) => ({
        ...current,
        followUpRequired: Boolean(savedFollowUp),
        followUpDateTime: savedFollowUp?.followUpDateTime || null,
        followUpType: savedFollowUp?.type || null,
        followUpPriority: savedFollowUp?.priority || null,
        followUpReminder: savedFollowUp?.reminderBefore || null,
      }))
      setFollowUpForm(followUpFormFromLead(savedFollowUp))
      if (!savedFollowUp) setCommentText("")
      removeAttachment()
      const historyResponse = await api.get(`/follow-ups/lead/${id}`)
      setFollowUpHistory(historyResponse.data.data?.items || [])
      await queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] })
      toast.success(response.data.message || "Follow-up saved successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save follow-up")
    } finally {
      setSavingFollowUp(false)
    }
  }

  const handleAssignChange = async (userId: string) => {
    try {
      setAssigning(true)
      await api.put(`/leads/unified/${leadType}/${id}/assign`, { assignedTo: userId })
      await queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] })
      setLead({ ...lead, assignedTo: { _id: userId } }) // basic optimistic update
      fetchLead() // re-fetch to get populated name
      toast.success("Lead assigned successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign lead")
    } finally {
      setAssigning(false)
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

  const assignedUsers = Array.isArray(lead?.assignedTo)
    ? lead.assignedTo
    : lead?.assignedTo
      ? [lead.assignedTo]
      : []

  const assignedLabel = assignedUsers.length > 0
    ? assignedUsers.map((user: any) => user?.name || "Unknown").join(", ")
    : "-"

  const timelineItems = [
    ...followUpHistory.map((item) => ({
      ...item,
      text: item.message,
      createdAt: item.createdAt,
      source: "follow-up",
    })),
    ...(lead?.comments || []).map((item: any) => ({ ...item, source: "legacy-comment" })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) return null

  const name = leadType === 'Company' ? lead.companyName : lead.name

  return (
    <div className="flex flex-col gap-5 pb-8 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: leadType === "Company" ? '/leads' : '/leads/all' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
          <button
            type="button"
            className="truncate text-left text-2xl font-bold tracking-tight text-primary hover:underline"
            onClick={() => setModalOpen(true)}
          >
            {name}
          </button>
        </div>
        {leadType === "Company" && (
          <div className="flex items-center gap-2 pl-12 sm:pl-0">
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/email-marketing" })}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/whatsapp-marketing" })}>
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        )}
      </div>

      {leadType === "Company" && (
        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardContent className="grid gap-0 p-0 md:grid-cols-3">
            <section className="space-y-2.5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
              <DetailItem label="Business Type" value={lead.businessType} />
              <DetailItem label="Products / Services" value={lead.products} />
              <DetailItem label="Location" value={[lead.city, lead.state, lead.country].filter(Boolean).join(", ")} />
              {lead.website1 && (
                <a
                  className="block truncate text-sm font-medium text-primary hover:underline"
                  href={lead.website1.startsWith("http") ? lead.website1 : `https://${lead.website1}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {lead.website1}
                </a>
              )}
            </section>
            <section className="space-y-2.5 border-y p-4 md:border-x md:border-y-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Contact</p>
              <DetailItem label="Name" value={lead.customerName} />
              <DetailItem label="Designation" value={lead.customerDesignation} />
              <DetailItem label="Phone" value={lead.mobileNo || lead.phoneNo} />
              <DetailItem label="Email" value={lead.email1} />
            </section>
            <section className="space-y-2.5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales Context</p>
              <DetailItem label="Status" value={lead.leadStatus} />
              <DetailItem label="Assigned To" value={assignedLabel} />
              <DetailItem label="Lead Source" value={lead.leadSource} />
              <DetailItem
                label="Next Follow-up"
                value={lead.followUpDateTime || lead.scheduledDateTime || lead.followTypeDate
                  ? new Date(lead.followUpDateTime || lead.scheduledDateTime || lead.followTypeDate).toLocaleString()
                  : "—"}
              />
            </section>
          </CardContent>
        </Card>
      )}

      <div className="block">
        {/* Unified lead workflow */}
        <div className="w-full">
          <Card className="shadow-sm border-muted/60">
            <CardHeader className="mb-3 border-b bg-muted/10 py-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 p-4 text-sm md:p-5">
              <Button className="w-fit gap-2 px-5" onClick={handleClickToCall} disabled={calling}>
                {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                Click to Call
              </Button>

              <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground block text-xs font-semibold uppercase">Lead Status</span>
                <Select
                  value={lead.leadStatus}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
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
                <Select value="" onValueChange={handleAssignChange} disabled={assigning}>
                  <SelectTrigger className="w-full">
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <SelectValue placeholder={assignedLabel === "-" ? "Assign a user..." : `Assigned: ${assignedLabel}`} />
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

              </div>

              {leadType === "Company" && lead.leadStatus === "Follow Up" && (
                <div className="grid gap-4 border-t pt-5 lg:grid-cols-2 lg:gap-x-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm font-semibold">Follow-up & Message</p>
                    <p className="text-xs text-muted-foreground">Schedule the next action and add its reminder message.</p>
                  </div>

                  <>
                      <div className="flex flex-col gap-2 lg:col-start-2 lg:row-span-4 lg:row-start-2 lg:border-l lg:pl-6">
                        <label htmlFor="follow-up-message" className="text-xs font-semibold text-muted-foreground">
                          Follow-up Message
                        </label>
                        <div className="relative">
                          <Textarea
                            id="follow-up-message"
                            rows={3}
                            maxLength={4000}
                            placeholder="Add a message for this follow-up..."
                            value={commentText}
                            onChange={(event) => setCommentText(event.target.value)}
                            className="min-h-[84px] resize-y pr-11 text-sm"
                            disabled={savingFollowUp}
                          />
                          <input
                            type="file"
                            id="follow-up-file-upload"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground"
                            onClick={() => document.getElementById("follow-up-file-upload")?.click()}
                            disabled={savingFollowUp}
                            aria-label="Attach a file"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </div>
                        {attachment && (
                          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
                            <span className="min-w-0 truncate text-xs">{attachment.name}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={removeAttachment}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {attachment && previewUrl && (
                          <div className="relative w-fit overflow-hidden rounded-md border">
                            {attachment.type.startsWith("video/") ? (
                              <video src={previewUrl} className="h-20 max-w-[220px] bg-black object-cover" />
                            ) : (
                              <img src={previewUrl} alt="Follow-up attachment preview" className="h-20 max-w-[220px] object-cover" />
                            )}
                          </div>
                        )}
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message History</p>
                          {timelineItems.length === 0 ? (
                            <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-4 text-xs text-muted-foreground">
                              <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                              No follow-up messages yet.
                            </div>
                          ) : (
                            <div className="flex max-h-[210px] flex-col gap-2 overflow-y-auto pr-1">
                              {timelineItems.map((comment: any, index: number) => (
                                <div key={comment._id || index} className="rounded-md border bg-muted/20 p-2.5">
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-primary">
                                      {comment.createdBy?._id === currentUser?._id || comment.createdBy === currentUser?._id
                                        ? "You"
                                        : comment.createdBy?.name || "User"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{comment.text}</p>
                                  {comment.attachment && (
                                    <div className="mt-2 overflow-hidden rounded border">
                                      {comment.attachment.fileType === "video" ? (
                                        <video src={getAttachmentUrl(comment.attachment.url)} controls className="max-h-28 max-w-full bg-black object-contain" />
                                      ) : (
                                        <img src={getAttachmentUrl(comment.attachment.url)} alt="Follow-up attachment" className="max-h-28 max-w-full object-contain" />
                                      )}
                                    </div>
                                  )}
                                  {comment.source === "follow-up" && (
                                    <span className="mt-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">
                                      {comment.status} · {comment.type}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 lg:col-start-1">
                        <label htmlFor="follow-up-date-time" className="text-xs font-semibold text-muted-foreground">
                          Follow-up Date & Time
                        </label>
                        <Input
                          id="follow-up-date-time"
                          type="datetime-local"
                          step={60}
                          min={dateTimeInputValue(new Date())}
                          value={followUpForm.followUpDateTime}
                          onChange={(event) => setFollowUpForm((current) => ({
                            ...current,
                            followUpDateTime: event.target.value,
                          }))}
                          disabled={savingFollowUp}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 lg:col-start-1">
                        <label className="text-xs font-semibold text-muted-foreground">Follow-up Type</label>
                        <Select
                          value={followUpForm.followUpType}
                          onValueChange={(value) => setFollowUpForm((current) => ({ ...current, followUpType: value }))}
                          disabled={savingFollowUp}
                        >
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FOLLOW_UP_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:col-start-1">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                          <Select
                            value={followUpForm.followUpPriority}
                            onValueChange={(value) => setFollowUpForm((current) => ({ ...current, followUpPriority: value }))}
                            disabled={savingFollowUp}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FOLLOW_UP_PRIORITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Reminder</label>
                          <Select
                            value={followUpForm.followUpReminder}
                            onValueChange={(value) => setFollowUpForm((current) => ({ ...current, followUpReminder: value }))}
                            disabled={savingFollowUp}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FOLLOW_UP_REMINDERS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                  </>

                  <Button className="w-fit justify-self-end px-5 lg:col-span-2" onClick={handleSaveFollowUp} disabled={savingFollowUp}>
                    {savingFollowUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Follow-up
                  </Button>
                </div>
              )}
              {leadType === "Company" && lead.leadStatus !== "Follow Up" && (
                <StatusDetailsPanel
                  status={lead.leadStatus}
                  details={statusDetails}
                  setDetails={setStatusDetails}
                  saving={savingStatusDetails}
                  onSave={handleSaveStatusDetails}
                />
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <Card className="mt-4 border-muted/60 shadow-sm">
        <CardHeader className="border-b bg-muted/10 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-primary" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Called By</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No calls logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  callLogs.map((call) => (
                    <TableRow key={call._id}>
                      <TableCell className="font-medium">{call.calledBy?.name || "User"}</TableCell>
                      <TableCell>{new Date(call.callDatetime || call.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{call.durationSeconds || 0}s</TableCell>
                      <TableCell>
                        <Badge variant={call.status === "completed" ? "default" : call.status === "failed" ? "destructive" : "secondary"}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.aiQualityScore || "-"}/10</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate({ to: `/calls/${call._id}` })}
                        >
                          Show Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                <DetailItem label="Primary Contact Name" value={lead.customerName} />
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
              <DetailItem label="Assigned To" value={assignedLabel} />
              <DetailItem label="Date Added" value={lead ? new Date(lead.createdAt).toLocaleDateString() : '-'} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusDetailsPanel({
  status,
  details,
  setDetails,
  saving,
  onSave,
}: {
  status: string
  details: StatusDetailsForm
  setDetails: Dispatch<SetStateAction<StatusDetailsForm>>
  saving: boolean
  onSave: () => void
}) {
  const update = (field: keyof StatusDetailsForm, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }))
  }
  const titles: Record<string, string> = {
    New: "New Lead Details",
    "Demo Scheduled": "Demo Schedule",
    Interested: "Interest Details",
    "Not Interested": "Closure Details",
    Prospective: "Prospect Details",
    Committed: "Commitment Details",
    Converted: "Conversion Details",
  }

  return (
    <div className="space-y-4 border-t pt-5">
      <div>
        <p className="text-sm font-semibold">{titles[status] || `${status} Details`}</p>
        <p className="text-xs text-muted-foreground">Save the information relevant to the selected lead status.</p>
      </div>

      {status === "Demo Scheduled" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Demo Date & Time">
            <Input type="datetime-local" value={details.demoDateTime} onChange={(event) => update("demoDateTime", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Demo Mode">
            <Select value={details.demoMode} onValueChange={(value) => update("demoMode", value)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="On-site">On-site</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {details.demoMode === "Online" ? (
            <Field label="Meeting Link">
              <Input value={details.meetingLink} onChange={(event) => update("meetingLink", event.target.value)} placeholder="https://..." disabled={saving} />
            </Field>
          ) : (
            <Field label="Location">
              <Input value={details.location} onChange={(event) => update("location", event.target.value)} placeholder="Meeting location" disabled={saving} />
            </Field>
          )}
          <Field label="Reminder">
            <Select value={details.reminder} onValueChange={(value) => update("reminder", value)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_REMINDERS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      {status === "Interested" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Interested Product / Service">
            <Input value={details.productService} onChange={(event) => update("productService", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Expected Decision Date">
            <Input type="date" value={details.expectedDecisionDate} onChange={(event) => update("expectedDecisionDate", event.target.value)} disabled={saving} />
          </Field>
        </div>
      )}

      {status === "Not Interested" && (
        <Field label="Reason">
          <Select value={details.reason} onValueChange={(value) => update("reason", value)} disabled={saving}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>
              {["No requirement", "Budget issue", "Not reachable", "Chose competitor", "Duplicate", "Other"].map((reason) => (
                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {status === "Prospective" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Requirement">
            <Textarea value={details.requirement} onChange={(event) => update("requirement", event.target.value)} className="min-h-[76px]" disabled={saving} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated Deal Value">
              <Input type="number" min="0" value={details.estimatedDealValue} onChange={(event) => update("estimatedDealValue", event.target.value)} disabled={saving} />
            </Field>
            <Field label="Expected Closing Date">
              <Input type="date" value={details.expectedClosingDate} onChange={(event) => update("expectedClosingDate", event.target.value)} disabled={saving} />
            </Field>
          </div>
        </div>
      )}

      {status === "Committed" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Committed Product / Service">
            <Input value={details.committedProductService} onChange={(event) => update("committedProductService", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Deal Value">
            <Input type="number" min="0" value={details.dealValue} onChange={(event) => update("dealValue", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Expected Completion Date">
            <Input type="date" value={details.expectedCompletionDate} onChange={(event) => update("expectedCompletionDate", event.target.value)} disabled={saving} />
          </Field>
        </div>
      )}

      {status === "Converted" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Product / Service">
            <Input value={details.productService} onChange={(event) => update("productService", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Final Deal Value">
            <Input type="number" min="0" value={details.finalDealValue} onChange={(event) => update("finalDealValue", event.target.value)} disabled={saving} />
          </Field>
          <Field label="Conversion Date">
            <Input type="date" value={details.convertedAt} onChange={(event) => update("convertedAt", event.target.value)} disabled={saving} />
          </Field>
        </div>
      )}

      <Field label={status === "New" ? "Initial Note" : `${status} Note`}>
        <Textarea
          value={details.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="Add relevant details..."
          className="min-h-[76px]"
          disabled={saving}
        />
      </Field>

      <div className="flex justify-end">
        <Button className="w-fit px-5" onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save {status}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase font-semibold">{label}</span>
      <span className="mt-0.5 text-sm font-medium text-foreground">{value || '-'}</span>
    </div>
  )
}
