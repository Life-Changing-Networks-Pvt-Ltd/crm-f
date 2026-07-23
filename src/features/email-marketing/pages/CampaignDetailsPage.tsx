import { useMemo, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Archive, ArrowLeft, CalendarClock, Copy, Edit3, Eye, MailCheck, MousePointerClick, Pause, Play, Send, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { MetricCard, ModulePage, PageContainer, PageHeading, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import { templateToHtml } from "./templateUtils"
import { campaignTypeLabels, formatDateTime, toDateTimeLocal } from "./campaignUtils"

export function CampaignDetailsPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const store = useEmailMarketingStore()
  const campaign = store.campaigns.find((item) => item.id === id)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(campaign?.scheduledAt || ""))
  const template = store.templates.find((item) => item.id === campaign?.templateId)
  const segment = store.segments.find((item) => item.id === campaign?.segmentId)
  const previewHtml = useMemo(() => template ? templateToHtml(template) : "<div style='font-family:Arial;padding:50px;text-align:center;color:#64748b'>No template is attached to this campaign.</div>", [template])

  if (!campaign) return <MissingCampaign />

  const duplicate = async () => {
    try {
      const created = await store.duplicateCampaign(id)
      if (!created) return
      toast.success("Campaign duplicated")
      void navigate({ to: getEmailMarketingPath(`/campaigns/${created.id}/edit`) as never })
    } catch {
      toast.error("Campaign could not be duplicated.")
    }
  }
  const remove = async () => {
    if (!window.confirm(`Delete ${campaign.name}?`)) return
    try {
      await store.deleteCampaign(id)
      toast.success("Campaign deleted")
      void navigate({ to: getEmailMarketingPath("/campaigns") as never })
    } catch {
      toast.error("Campaign must be archived before it can be deleted.")
    }
  }
  const saveSchedule = async () => {
    if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) return toast.error("Choose a future date and time.")
    try {
      await store.updateCampaign(id, { scheduledAt: new Date(scheduledAt).toISOString(), status: "scheduled" })
      toast.success("Campaign schedule updated")
      setScheduleOpen(false)
    } catch {
      toast.error("Campaign could not be scheduled.")
    }
  }
  const simulateSend = async () => {
    if (!campaign.templateId || !campaign.totalRecipients || !campaign.fromEmail) return toast.error("Complete the template, audience, and verified sender before sending.")
    if (!window.confirm("Queue this campaign for real delivery?")) return
    try {
      await store.setCampaignStatus(id, "sent")
      toast.success("Campaign queued for delivery")
    } catch {
      toast.error("Campaign could not be queued. Check SES, Redis, and sender verification.")
    }
  }

  const audienceLabel = campaign.audienceMode === "all" ? "All eligible subscribers" : campaign.audienceMode === "segment" ? segment?.name || "Deleted segment" : `${campaign.subscriberIds.length} selected subscribers`

  return (
    <ModulePage><PageContainer>
      <PageHeading title={campaign.name} description={campaign.subject || "No subject added"} actions={<><Button variant="outline" asChild><Link to={getEmailMarketingPath("/campaigns") as never}><ArrowLeft className="mr-2 h-4 w-4" />Campaigns</Link></Button><Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />Preview</Button>{["draft", "scheduled", "paused"].includes(campaign.status) ? <Button asChild><Link to={getEmailMarketingPath(`/campaigns/${id}/edit`) as never}><Edit3 className="mr-2 h-4 w-4" />Edit</Link></Button> : null}</>} />

      <div className="flex flex-wrap items-center gap-2"><StatusPill status={campaign.status} /><span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">{campaignTypeLabels[campaign.type]}</span>{campaign.isRecurring ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Recurring every {campaign.recurrenceInterval} {campaign.recurrenceUnit}(s)</span> : null}<span className="text-xs text-muted-foreground">Updated {formatDate(campaign.updatedAt)}</span></div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recipients" value={campaign.totalRecipients} helper={audienceLabel} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Delivered" value={campaign.metrics.delivered} helper={`${campaign.metrics.sent} send events`} icon={<MailCheck className="h-5 w-5" />} tone="success" />
        <MetricCard label="Unique opens" value={campaign.metrics.opens} helper="Signed open tracking events" icon={<Eye className="h-5 w-5" />} tone="success" />
        <MetricCard label="Unique clicks" value={campaign.metrics.clicks} helper="Tracking connects with backend" icon={<MousePointerClick className="h-5 w-5" />} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><h3 className="font-semibold">Campaign configuration</h3><Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>Preview email</Button></div><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Goal" value={campaign.goal} /><Detail label="Template" value={template?.name || (campaign.type === "drip_campaign" ? `${campaign.dripSteps.length} drip templates` : "Not selected")} /><Detail label="Audience" value={audienceLabel} /><Detail label="Eligible recipients" value={String(campaign.totalRecipients)} /><Detail label="From" value={campaign.fromEmail ? `${campaign.fromName} <${campaign.fromEmail}>` : "Not selected"} /><Detail label="Reply-to" value={campaign.replyTo || campaign.fromEmail || "Not selected"} /></dl></div>

          {campaign.type === "drip_campaign" ? <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6"><h3 className="font-semibold">Drip sequence</h3><div className="mt-5 space-y-3">{campaign.dripSteps.map((step, index) => <div key={step.id} className="flex gap-4 rounded-xl border bg-background p-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div><div className="min-w-0 flex-1"><h4 className="font-medium">{step.title}</h4><p className="mt-1 truncate text-xs text-muted-foreground">{step.subject}</p><p className="mt-2 text-xs font-medium text-primary">Wait {step.delayValue} {step.delayUnit}</p></div></div>)}</div></div> : null}

          <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6"><h3 className="font-semibold">Activity timeline</h3><div className="mt-5 space-y-0">{campaign.activity.map((activity, index) => <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">{index < campaign.activity.length - 1 ? <div className="absolute bottom-0 left-[7px] top-4 w-px bg-border" /> : null}<div className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-background bg-primary" /><div><p className="text-sm font-medium">{activity.action}</p><p className="mt-1 text-xs text-muted-foreground">{activity.detail}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(activity.createdAt)}</p></div></div>)}</div></div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-sm"><h3 className="font-semibold">Delivery</h3><div className="mt-4 rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{campaign.type === "drip_campaign" ? "Enrollment" : "Scheduled time"}</p><p className="mt-1 text-sm font-semibold">{campaign.type === "drip_campaign" ? (campaign.status === "active" ? "Active for matching subscribers" : "Not actively enrolling") : formatDateTime(campaign.scheduledAt)}</p><p className="mt-1 text-xs text-muted-foreground">{campaign.timezone}</p></div><div className="mt-4 grid gap-2">{campaign.type !== "drip_campaign" && ["draft", "scheduled", "paused"].includes(campaign.status) ? <Button variant="outline" onClick={() => setScheduleOpen(true)}><CalendarClock className="mr-2 h-4 w-4" />Schedule</Button> : null}{campaign.type !== "drip_campaign" && ["draft", "scheduled"].includes(campaign.status) ? <Button onClick={simulateSend}><Send className="mr-2 h-4 w-4" />Send now preview</Button> : null}{["active", "scheduled"].includes(campaign.status) ? <Button variant="outline" onClick={() => store.setCampaignStatus(id, "paused")}><Pause className="mr-2 h-4 w-4" />Pause</Button> : campaign.status === "paused" ? <Button onClick={() => store.setCampaignStatus(id, campaign.type === "drip_campaign" ? "active" : "scheduled")}><Play className="mr-2 h-4 w-4" />Resume</Button> : null}</div></div>
          <div className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Campaign actions</h3><div className="mt-4 grid gap-2"><Button variant="outline" onClick={duplicate}><Copy className="mr-2 h-4 w-4" />Duplicate</Button>{campaign.status !== "archived" ? <Button variant="outline" onClick={() => store.setCampaignStatus(id, "archived")}><Archive className="mr-2 h-4 w-4" />Archive</Button> : null}<Button variant="destructive" onClick={remove}><Trash2 className="mr-2 h-4 w-4" />Delete campaign</Button></div></div>
          <div className="rounded-2xl border bg-primary/5 p-5"><p className="text-sm font-semibold">Delivery safety</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Send and scheduling actions are validated by crm-b. Live delivery only starts when the server-side sending and queue configuration is enabled.</p></div>
        </aside>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>{campaign.subject || "Campaign preview"}</DialogTitle><DialogDescription>{campaign.previewText || "No preview text"}</DialogDescription></DialogHeader><div className="h-[65vh] overflow-auto rounded-xl bg-muted p-4"><iframe title="Campaign preview" sandbox="" srcDoc={previewHtml} className="mx-auto min-h-full w-full max-w-2xl rounded-xl border-0 bg-white shadow-sm" /></div></DialogContent></Dialog>
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}><DialogContent><DialogHeader><DialogTitle>Schedule campaign</DialogTitle><DialogDescription>Choose a future delivery time. The worker will be connected in Backend Part 3.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="details-schedule">Send date and time</Label><Input id="details-schedule" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><p className="text-xs text-muted-foreground">Timezone: {campaign.timezone}</p></div><DialogFooter><Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button onClick={saveSchedule}><CalendarClock className="mr-2 h-4 w-4" />Save schedule</Button></DialogFooter></DialogContent></Dialog>
    </PageContainer></ModulePage>
  )
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium capitalize">{value}</dd></div> }
function MissingCampaign() { return <ModulePage><PageContainer className="max-w-3xl"><div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-xl font-semibold">Campaign not found</h2><Button className="mt-5" asChild><Link to={getEmailMarketingPath("/campaigns") as never}>Back to campaigns</Link></Button></div></PageContainer></ModulePage> }
