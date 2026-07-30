import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Loader2, MessageSquare, Paperclip, X, Phone, Mail } from "lucide-react"
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
import { can } from "@/lib/accessControl"
import { templateToHtml } from "@/features/email-marketing/pages/templateUtils"
import { PhonePreview } from "@/features/whatsapp-marketing/app/components/ui/phone-preview"

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
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>(() => followUpFormFromLead(null))
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [statusDetails, setStatusDetails] = useState<StatusDetailsForm>(() => statusDetailsForm("New"))
  const [savingStatusDetails, setSavingStatusDetails] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("New")
  const [commentText, setCommentText] = useState("")
  const [generalNote, setGeneralNote] = useState("")
  const [savingGeneralNote, setSavingGeneralNote] = useState(false)
  const [followUpHistory, setFollowUpHistory] = useState<any[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [messageChannel, setMessageChannel] = useState<"email" | "whatsapp" | null>(null)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  const [users, setUsers] = useState<any[]>([])
  const [assigning, setAssigning] = useState(false)
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [calling, setCalling] = useState(false)
  const activityContainerRef = useRef<HTMLDivElement>(null)
  const canCallLeads = can(currentUser, "calls.manage")
  const canViewCalls = can(currentUser, "calls.view")
  const canChangeLeadStatus = can(currentUser, "leads.change_status")
  const canAssignLeads = can(currentUser, "leads.assign")
  const canAddLeadNotes = can(currentUser, "leads.add_note")

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
    if (canAssignLeads) fetchUsers()
    if (canViewCalls) fetchCallLogs()
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
      const followUpRequest = leadType === "Company"
        ? api.get(`/follow-ups/lead/${id}`).catch((error) => {
            console.error("Failed to fetch follow-up history", error)
            return null
          })
        : Promise.resolve(null)
      const [leadResponse, followUpResponse] = await Promise.all([
        api.get(`/leads/unified/${leadType}/${id}`),
        followUpRequest,
      ])
      const leadData = leadResponse.data.data
      const activeFollowUp = followUpResponse?.data?.data?.active
      setLead(leadData)
      setSelectedStatus(leadData.leadStatus)
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

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus)
    setStatusDetails(statusDetailsForm(newStatus, lead?.statusDetails))
    setFollowUpForm((current) => ({ ...current, followUpRequired: newStatus === "Follow Up" }))
  }

  const openMessageComposer = async (channel: "email" | "whatsapp") => {
    try {
      setMessageChannel(channel)
      setSelectedTemplateId("")
      setTemplatePreviewOpen(false)
      setAvailableTemplates([])
      setLoadingTemplates(true)
      const response = await api.get("/template-access/available", {
        params: {
          type: channel === "email" ? "email_template" : "whatsapp_template",
        },
      })
      setAvailableTemplates(response.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to load ${channel} templates`)
      setMessageChannel(null)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSendTemplate = async () => {
    if (!messageChannel || !selectedTemplateId) return
    try {
      setSendingMessage(true)
      await api.post(
        `/leads/unified/${leadType}/${id}/messages/${messageChannel}`,
        { templateId: selectedTemplateId },
      )
      toast.success(messageChannel === "email" ? "Email sent successfully" : "WhatsApp message sent successfully")
      setTemplatePreviewOpen(false)
      setMessageChannel(null)
      await fetchLead()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Message could not be sent")
      await fetchLead()
    } finally {
      setSendingMessage(false)
    }
  }

  const selectedMessageTemplate = availableTemplates.find(
    (template) => template.resourceId === selectedTemplateId,
  )
  const selectedEmailPreviewHtml = selectedMessageTemplate && messageChannel === "email"
    ? templateToHtml({
        htmlContent: selectedMessageTemplate.htmlContent || "",
        blocks: Array.isArray(selectedMessageTemplate.blocks) ? selectedMessageTemplate.blocks : [],
        preheader: selectedMessageTemplate.preheader || "",
      })
    : ""

  const handleSaveStatusDetails = async () => {
    const comment = statusDetails.note.trim()
    if (!comment) {
      toast.error("Please write comment")
      return
    }
    if (leadType === "Company" && selectedStatus === "Demo Scheduled" && !statusDetails.demoDateTime) {
      toast.error("Select a demo date and time")
      return
    }
    if (leadType === "Company" && selectedStatus === "Not Interested" && !statusDetails.reason) {
      toast.error("Select a reason")
      return
    }
    try {
      setSavingStatusDetails(true)
      const response = await api.put(`/leads/unified/${leadType}/${id}/status`, {
        status: selectedStatus,
        ...(leadType === "Company" ? { details: statusDetails } : {}),
        comment,
      })
      const savedAt = response.data.data?.statusDetails?.savedAt || new Date().toISOString()
      const savedDetails = response.data.data?.statusDetails || {
        status: selectedStatus,
        note: comment,
        savedBy: currentUser,
        savedAt,
      }
      setLead((current: any) => ({
        ...current,
        leadStatus: selectedStatus,
        leadStatusChangedAt: response.data.data?.leadStatusChangedAt,
        ...(leadType === "Company" ? { statusDetails: response.data.data?.statusDetails } : {}),
        statusHistory: [{
          oldStatus: current.leadStatus,
          newStatus: selectedStatus,
          entryType: current.leadStatus === selectedStatus ? "details_saved" : "status_change",
          comment,
          details: savedDetails,
          changedBy: currentUser,
          changedAt: savedAt,
        }, ...(current.statusHistory || [])],
      }))
      setStatusDetails(statusDetailsForm(selectedStatus, response.data.data?.statusDetails))
      window.dispatchEvent(new CustomEvent("follow-up-reminders-refresh"))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] }),
        queryClient.invalidateQueries({ queryKey: ["leads", "stats"] }),
      ])
      toast.success(`${selectedStatus} details saved`)
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
      toast.error("Please write comment")
      return
    }

    try {
      setSavingFollowUp(true)
      if (lead.leadStatus !== "Follow Up") {
        const statusResponse = await api.put(`/leads/unified/${leadType}/${id}/status`, {
          status: "Follow Up",
          comment: commentText.trim(),
        })
        setLead((current: any) => ({
          ...current,
          leadStatus: "Follow Up",
          leadStatusChangedAt: statusResponse.data.data?.leadStatusChangedAt,
          statusHistory: [{
            oldStatus: current.leadStatus,
            newStatus: "Follow Up",
            entryType: "status_change",
            comment: commentText.trim(),
            changedBy: currentUser,
            changedAt: statusResponse.data.data?.leadStatusChangedAt || new Date().toISOString(),
          }, ...(current.statusHistory || [])],
        }))
      }
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["paged", "/companies/paged"] }),
        queryClient.invalidateQueries({ queryKey: ["leads", "stats"] }),
      ])
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

  const handleAddGeneralNote = async () => {
    const text = generalNote.trim()
    if (!text) {
      toast.error("Enter a note")
      return
    }
    try {
      setSavingGeneralNote(true)
      const response = await api.post(`/leads/unified/${leadType}/${id}/comment`, { text })
      setLead((current: any) => ({
        ...current,
        comments: response.data.data?.comments || current?.comments || [],
      }))
      setGeneralNote("")
      toast.success("Note added successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add note")
    } finally {
      setSavingGeneralNote(false)
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

  const persistedStatusActivities = (lead?.statusHistory || [])
    .map((item: any) => ({
      ...item,
      activityType: item.entryType === "details_saved" ? "status-note" : "status-change",
      text: item.entryType === "details_saved" ? item.details?.note : item.comment,
      status: item.newStatus,
      createdAt: item.changedAt || item.createdAt,
      createdBy: item.changedBy,
    }))
    .filter((item: any) => item.text?.trim())
  const currentDetailsAlreadyRecorded = persistedStatusActivities.some((item: any) =>
    item.details
    && item.status === lead?.statusDetails?.status
    && Math.abs(
      new Date(item.createdAt).getTime() - new Date(lead?.statusDetails?.savedAt).getTime(),
    ) < 1000
  )
  const currentDetailsActivity = lead?.statusDetails?.savedAt && !currentDetailsAlreadyRecorded
    ? [{
        activityType: "status-note",
        status: lead.statusDetails.status,
        text: lead.statusDetails.note,
        createdAt: lead.statusDetails.savedAt,
        createdBy: lead.statusDetails.savedBy,
      }]
    : []
  const globalActivityItems = [
    ...persistedStatusActivities,
    ...currentDetailsActivity,
    ...followUpHistory.map((item) => ({
      ...item,
      activityType: "follow-up",
      text: item.message,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
      status: "Follow Up",
    })),
    ...(lead?.comments || []).map((item: any) => ({
      ...item,
      activityType: "general-note",
      status: item.status || null,
    })),
    ...(lead?.messages || []).map((item: any) => ({
      ...item,
      activityType: "lead-message",
      text: `${item.channel === "email" ? "Email" : "WhatsApp"} ${item.status}: ${item.templateName}`,
      status: item.channel === "email" ? "Email" : "WhatsApp",
    })),
  ]
    .filter((item: any) => item.text?.trim())
    .filter((item: any) => !(
      item.activityType === "status-change"
      && item.status === "Follow Up"
      && followUpHistory.some((followUp) =>
        followUp.message?.trim() === item.text.trim()
        && Math.abs(new Date(followUp.createdAt).getTime() - new Date(item.createdAt).getTime()) < 60_000
      )
    ))
    .sort((left: any, right: any) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())

  useEffect(() => {
    const container = activityContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [globalActivityItems.length])

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
        <div className="flex items-center gap-2 pl-12 sm:pl-0">
          {can(currentUser, "email.send.lead") && can(currentUser, "email.templates.use") && (
            <Button size="sm" variant="outline" onClick={() => openMessageComposer("email")}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          )}
          {can(currentUser, "whatsapp.send.lead") && can(currentUser, "whatsapp.templates.use") && (
            <Button size="sm" variant="outline" onClick={() => openMessageComposer("whatsapp")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
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
              {canCallLeads && (
                <Button className="w-fit gap-2 px-5" onClick={handleClickToCall} disabled={calling}>
                  {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  Click to Call
                </Button>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground block text-xs font-semibold uppercase">Lead Status</span>
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                  disabled={!canChangeLeadStatus || savingStatusDetails || savingFollowUp}
                >
                  <SelectTrigger className="w-full">
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
                <Select value="" onValueChange={handleAssignChange} disabled={!canAssignLeads || assigning}>
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

              {canChangeLeadStatus && leadType === "Company" && selectedStatus === "Follow Up" && (
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
              {canChangeLeadStatus && leadType === "Company" && selectedStatus !== "Follow Up" && (
                <StatusDetailsPanel
                  status={selectedStatus}
                  details={statusDetails}
                  setDetails={setStatusDetails}
                  saving={savingStatusDetails}
                  onSave={handleSaveStatusDetails}
                />
              )}
              {canChangeLeadStatus && leadType !== "Company" && (
                <SimpleStatusNotePanel
                  status={selectedStatus}
                  note={statusDetails.note}
                  onNoteChange={(note) => setStatusDetails((current) => ({ ...current, note }))}
                  saving={savingStatusDetails}
                  onSave={handleSaveStatusDetails}
                />
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <Card className="border-muted/60 shadow-sm">
        <CardHeader className="border-b bg-muted/10 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            Lead Activity & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={activityContainerRef} className="h-[420px] overflow-y-auto bg-muted/20 p-4 md:p-5">
            {globalActivityItems.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-5 w-5 opacity-60" />
                No notes added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {globalActivityItems.map((item: any, index: number) => {
                  const authorId = item.createdBy?._id || item.createdBy
                  const author = authorId === currentUser?._id ? "You" : item.createdBy?.name || "User"
                  const isOwnNote = authorId === currentUser?._id
                  return (
                    <div key={`${item._id || item.createdAt}-${index}`} className={`flex ${isOwnNote ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[75%] ${isOwnNote ? "rounded-br-md border-primary/20 bg-primary/10" : "rounded-bl-md bg-background"}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-background/70">{item.status || "General Note"}</Badge>
                          {item.activityType === "follow-up" && (
                            <span className="text-[11px] font-medium text-muted-foreground">Follow-up</span>
                          )}
                        </div>

                        <div className="mt-2 text-sm">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{item.text}</p>
                          {item.activityType === "status-change" && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              {item.oldStatus || "Blank"} → {item.newStatus}
                            </p>
                          )}
                          {item.activityType === "follow-up" && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {item.type && <span>{item.type}</span>}
                              {item.priority && <span>• {item.priority} priority</span>}
                              {item.followUpDateTime && <span>• Due {new Date(item.followUpDateTime).toLocaleString()}</span>}
                            </div>
                          )}
                          {item.activityType === "lead-message" && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>To {item.recipient}</span>
                              {item.subject && <span>• {item.subject}</span>}
                              {item.providerMessageId && <span>• Provider ID {item.providerMessageId}</span>}
                              {item.error && <span className="text-destructive">• {item.error}</span>}
                            </div>
                          )}
                          {item.attachment && (
                            <div className="mt-3 w-fit overflow-hidden rounded-md border">
                              {item.attachment.fileType === "video" ? (
                                <video src={getAttachmentUrl(item.attachment.url)} controls className="max-h-48 max-w-full bg-black object-contain" />
                              ) : (
                                <img src={getAttachmentUrl(item.attachment.url)} alt="Activity attachment" className="max-h-48 max-w-full object-contain" />
                              )}
                            </div>
                          )}
                        </div>
                        <p className={`mt-2 text-[10px] text-muted-foreground ${isOwnNote ? "text-right" : "text-left"}`}>
                          {author} • {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {canAddLeadNotes && (
          <div className="flex items-end gap-2 border-t bg-background p-3">
            <Textarea
              value={generalNote}
              onChange={(event) => setGeneralNote(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  if (generalNote.trim() && !savingGeneralNote) void handleAddGeneralNote()
                }
              }}
              placeholder="Type a note..."
              maxLength={4000}
              rows={1}
              className="max-h-28 min-h-11 resize-none rounded-2xl"
              disabled={savingGeneralNote}
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={handleAddGeneralNote}
              disabled={savingGeneralNote || !generalNote.trim()}
              aria-label="Add note"
            >
              {savingGeneralNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            </Button>
          </div>
          )}
        </CardContent>
      </Card>

      {canViewCalls && (
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
      )}

      <Dialog
        open={Boolean(messageChannel)}
        onOpenChange={(open) => {
          if (!open) {
            setTemplatePreviewOpen(false)
            setMessageChannel(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Send {messageChannel === "email" ? "Email" : "WhatsApp"} Template
            </DialogTitle>
            <DialogDescription>
              Only active, approved templates shared with your role, team, or user account are shown.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipient</p>
              <p className="mt-1 font-medium">{lead.customerName || lead.name || lead.companyName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {messageChannel === "email"
                  ? lead.email1 || lead.email || "No email address"
                  : lead.mobileNo || lead.phoneNo || lead.phone || "No phone number"}
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex min-h-9 items-center justify-between gap-3">
                <label className="text-sm font-medium">Approved Template</label>
                {selectedTemplateId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTemplatePreviewOpen(true)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                ) : null}
              </div>
              {loadingTemplates ? (
                <div className="flex h-20 items-center justify-center rounded-xl border">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availableTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No shared templates are available. Ask an admin to share a template from Administration → Template Access.
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.resourceId} value={template.resourceId}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedTemplateId && (
              <div className="rounded-xl border p-4 text-sm">
                <p className="font-medium">
                  {selectedMessageTemplate?.name}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {selectedMessageTemplate?.subject
                    || selectedMessageTemplate?.category
                    || "Template variables will be filled using this lead's contact details."}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMessageChannel(null)}>Cancel</Button>
            <Button onClick={handleSendTemplate} disabled={!selectedTemplateId || sendingMessage || loadingTemplates}>
              {sendingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send {messageChannel === "email" ? "Email" : "WhatsApp"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templatePreviewOpen} onOpenChange={setTemplatePreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMessageTemplate?.name || "Template Preview"}</DialogTitle>
            <DialogDescription>
              {messageChannel === "email"
                ? selectedMessageTemplate?.subject || "Read-only preview of the selected email template."
                : `${selectedMessageTemplate?.category || "WhatsApp"} · ${selectedMessageTemplate?.language || "Default language"}`}
            </DialogDescription>
          </DialogHeader>
          {messageChannel === "email" ? (
            <div className="h-[65vh] overflow-auto rounded-xl border bg-muted p-4">
              <iframe
                title={`${selectedMessageTemplate?.name || "Email template"} preview`}
                srcDoc={selectedEmailPreviewHtml}
                sandbox=""
                className="mx-auto min-h-full w-full max-w-2xl rounded-lg border-0 bg-white shadow-sm"
              />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded-xl border bg-muted/40 p-4">
              <PhonePreview
                headerType={selectedMessageTemplate?.headerType || undefined}
                headerText={selectedMessageTemplate?.headerText || ""}
                headerImage={selectedMessageTemplate?.previewUrl || selectedMessageTemplate?.headerImageUrl || ""}
                body={selectedMessageTemplate?.content || ""}
                footer={selectedMessageTemplate?.footer || ""}
                buttons={Array.isArray(selectedMessageTemplate?.buttons) ? selectedMessageTemplate.buttons : []}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

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

function SimpleStatusNotePanel({
  status,
  note,
  onNoteChange,
  saving,
  onSave,
}: {
  status: string
  note: string
  onNoteChange: (note: string) => void
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-4 border-t pt-5">
      <div>
        <p className="text-sm font-semibold">{status} Details</p>
        <p className="text-xs text-muted-foreground">Add a comment before saving this lead status.</p>
      </div>
      <Field label={`${status} Note`}>
        <Textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
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
