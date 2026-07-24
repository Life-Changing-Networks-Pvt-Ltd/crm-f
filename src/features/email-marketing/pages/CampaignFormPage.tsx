import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Mail, Plus, Save, Send, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { emailMarketingRequest, getEmailMarketingErrorMessage } from "../emailMarketingApi"
import { ModulePage, PageContainer, StatusPill } from "../components/PageElements"
import { campaignPresets, dripCampaignPresets } from "../data/campaignPresets"
import { getEmailMarketingPath } from "../navigation"
import type { AudienceMode, CampaignGoal, CampaignInput, CampaignStatus, CampaignType, DripStep } from "../types"
import { templateToHtml } from "./templateUtils"
import { audienceCount, campaignTypeLabels, toDateTimeLocal } from "./campaignUtils"

const defaultMetricsRecipients = 0

function createDripStep(templateId = "", overrides: Partial<DripStep> = {}): DripStep {
  return {
    id: `drip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: "New drip email",
    delayValue: 1,
    delayUnit: "days",
    templateId,
    subject: "",
    ...overrides,
  }
}

function createInitialForm(
  drip: boolean,
  presetKey: string | undefined,
  firstTemplateId: string,
  platformSender: ReturnType<typeof useEmailMarketingStore>["platformSender"],
): CampaignInput {
  const preset = (drip ? dripCampaignPresets : campaignPresets).find((item) => item.key === presetKey)
  return {
    name: preset?.label || "",
    type: drip ? "drip_campaign" : preset?.type || "promotional",
    goal: preset?.goal || "clicks",
    subject: preset?.subject || "",
    previewText: preset?.previewText || "",
    fromName: platformSender.fromName,
    fromEmail: platformSender.fromEmail,
    replyTo: platformSender.replyTo,
    templateId: firstTemplateId,
    audienceMode: "all",
    segmentId: "",
    subscriberIds: [],
    status: "draft",
    scheduledAt: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    isRecurring: false,
    recurrenceInterval: 1,
    recurrenceUnit: "week",
    recurrenceEndAt: "",
    dripTargetAudience: drip ? "new_only" : "all",
    dripSteps: drip
      ? (preset?.dripSteps?.map((step) => createDripStep(firstTemplateId, step)) || [createDripStep(firstTemplateId, { delayValue: 0, title: "Welcome email" })])
      : [],
    totalRecipients: defaultMetricsRecipients,
  }
}

export function CampaignFormPage({ id, drip = false, presetKey }: { id?: string; drip?: boolean; presetKey?: string }) {
  const navigate = useNavigate()
  const store = useEmailMarketingStore()
  const existing = store.campaigns.find((campaign) => campaign.id === id)
  const [form, setForm] = useState<CampaignInput>(() => existing ? {
    name: existing.name, type: existing.type, goal: existing.goal, subject: existing.subject, previewText: existing.previewText,
    fromName: existing.fromName, fromEmail: existing.fromEmail, replyTo: existing.replyTo, templateId: existing.templateId || "",
    audienceMode: existing.audienceMode, segmentId: existing.segmentId || "", subscriberIds: existing.subscriberIds || [], status: existing.status,
    scheduledAt: toDateTimeLocal(existing.scheduledAt), timezone: existing.timezone, isRecurring: existing.isRecurring,
    recurrenceInterval: existing.recurrenceInterval, recurrenceUnit: existing.recurrenceUnit, recurrenceEndAt: existing.recurrenceEndAt ? toDateTimeLocal(existing.recurrenceEndAt) : "",
    dripTargetAudience: existing.dripTargetAudience, dripSteps: existing.dripSteps, totalRecipients: existing.totalRecipients,
  } : createInitialForm(
    drip,
    presetKey,
    store.templates[0]?.id || "",
    store.platformSender,
  ))
  const [previewDripStepId, setPreviewDripStepId] = useState(() => form.dripSteps[0]?.id || "")
  const [testOpen, setTestOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testSending, setTestSending] = useState(false)
  const isDrip = form.type === "drip_campaign"
  const verifiedDomains = store.domains.filter((domain) => domain.status === "verified")
  const selectedDripStep = isDrip ? form.dripSteps.find((item) => item.id === previewDripStepId) || form.dripSteps[0] : undefined
  const selectedTemplate = store.templates.find((template) => template.id === (selectedDripStep?.templateId || form.templateId))
  const recipients = useMemo(() => audienceCount(form.audienceMode, form.subscriberIds, form.segmentId, store.subscribers, store.segments, store.getSegmentSubscribers), [form.audienceMode, form.subscriberIds, form.segmentId, store.subscribers, store.segments, store.getSegmentSubscribers])
  const previewHtml = selectedTemplate ? templateToHtml(selectedTemplate) : "<div style='font-family:Arial;padding:40px;text-align:center;color:#64748b'>Choose a template to preview your campaign.</div>"
  const previewSubject = selectedDripStep?.subject || form.subject || "Campaign subject"
  const previewText = form.previewText || "Preview text appears here."

  if (id && !existing) return <MissingCampaign />

  const setField = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  const updateDripStep = (stepId: string, updates: Partial<DripStep>) => setField("dripSteps", form.dripSteps.map((item) => item.id === stepId ? { ...item, ...updates } : item))

  const validateForSchedule = () => {
    if (!form.templateId && !isDrip) return "Choose an email template."
    if (isDrip && form.dripSteps.some((item) => !item.templateId || !item.subject.trim())) return "Complete the template and subject for every drip step."
    if (!recipients) return "Choose an audience with at least one eligible subscriber."
    if (!form.fromEmail) return "Choose an email sender."
    if (!isDrip && form.status === "scheduled" && (!form.scheduledAt || new Date(form.scheduledAt).getTime() <= Date.now())) return "Choose a future schedule date and time."
    return ""
  }

  const save = async (event?: FormEvent, forcedStatus?: CampaignStatus) => {
    event?.preventDefault()
    if (!form.name.trim()) return toast.error("Campaign name is required.")
    const status = forcedStatus || form.status
    if (status !== "draft") {
      const validation = validateForSchedule()
      if (validation) return toast.error(validation)
    }
    const payload: CampaignInput = {
      ...form,
      status,
      scheduledAt: !isDrip && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
      recurrenceEndAt: form.recurrenceEndAt ? new Date(form.recurrenceEndAt).toISOString() : "",
      totalRecipients: recipients,
    }
    try {
      const saved = id ? await store.updateCampaign(id, payload) : await store.createCampaign(payload)
      if (!saved) return toast.error("Campaign could not be saved.")
      toast.success(status === "scheduled" ? "Campaign scheduled" : status === "active" ? "Drip campaign activated" : "Campaign saved")
      const destination = status === "scheduled" ? "/campaigns" : `/campaigns/${saved.id}`
      void navigate({ to: getEmailMarketingPath(destination) as never })
    } catch (error) {
      toast.error(
        getEmailMarketingErrorMessage(
          error,
          "Campaign could not be saved. Check sender and delivery configuration.",
        ),
      )
    }
  }

  const sendTestEmail = async () => {
    const dripStep = isDrip ? form.dripSteps[0] : undefined
    const templateId = dripStep?.templateId || form.templateId
    const subject = dripStep?.subject || form.subject
    if (!testEmail.trim().includes("@")) return toast.error("Enter a valid test email.")
    if (!templateId || !subject.trim()) return toast.error("Choose a template and add a subject first.")
    if (!form.fromEmail) return toast.error("Choose a sender from a verified domain first.")
    setTestSending(true)
    try {
      await emailMarketingRequest("post", "/campaigns/test-send", {
        recipientEmail: testEmail.trim(),
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        replyTo: form.replyTo,
        subject,
        previewText: form.previewText,
        templateId,
      })
      toast.success("Test Email Sent Successfully")
      setTestOpen(false)
    } catch (error) {
      toast.error(
        getEmailMarketingErrorMessage(
          error,
          "Test email could not be sent. Check the sender and SES configuration.",
        ),
      )
    } finally {
      setTestSending(false)
    }
  }

  return (
    <ModulePage><PageContainer>
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Campaigns</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{id ? `Edit ${isDrip ? "drip " : ""}campaign` : isDrip ? "Create drip campaign" : "Create new campaign"}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">Template-driven send setup</span>
              <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">Lifecycle state managed</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link to={getEmailMarketingPath("/campaigns") as never}><ArrowLeft className="mr-2 h-4 w-4" />Back to campaigns</Link></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setTestOpen(true)}><Mail className="mr-2 h-4 w-4" />Test send</Button>
          </div>
        </div>
      </section>

      <form onSubmit={(event) => save(event)} className={`grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)] ${isDrip ? "xl:items-start" : "xl:items-stretch"}`}>
        <div className={isDrip ? "space-y-4" : "h-full"}>
          {isDrip ? <>
            <section className="rounded-xl border bg-card p-5 shadow-sm"><SetupStep form={form} setField={setField} isEditing={Boolean(id)} /></section>
            <section className="rounded-xl border bg-card p-5 shadow-sm"><ContentStep form={form} setField={setField} templates={store.templates} isDrip={isDrip} updateDripStep={updateDripStep} previewDripStepId={previewDripStepId} setPreviewDripStepId={setPreviewDripStepId} /></section>
            <section className="rounded-xl border bg-card p-5 shadow-sm"><AudienceSenderStep form={form} setField={setField} subscribers={store.subscribers} segments={store.segments} verifiedDomains={verifiedDomains} platformSender={store.platformSender} recipientCount={recipients} /></section>
            <section className="rounded-xl border bg-card p-5 shadow-sm"><ScheduleStep form={form} setField={setField} isDrip={isDrip} /></section>
            <div className="flex flex-wrap justify-end gap-2 rounded-xl border bg-card p-4 shadow-sm">
              <Button type="button" variant="outline" onClick={() => save(undefined, "draft")}><Save className="mr-2 h-4 w-4" />Save as draft</Button>
              <Button type="submit"><Send className="mr-2 h-4 w-4" />{form.status === "active" ? "Activate drip" : "Create drip campaign"}</Button>
            </div>
          </> : <CompactCampaignForm form={form} setField={setField} templates={store.templates} subscribers={store.subscribers} segments={store.segments} verifiedDomains={verifiedDomains} platformSender={store.platformSender} recipientCount={recipients} isEditing={Boolean(id)} saveDraft={() => save(undefined, "draft")} />}
        </div>

        <aside className={`${isDrip ? "xl:sticky xl:top-4" : "h-full"}`}>
          <div className={`overflow-hidden rounded-xl border bg-card shadow-sm ${isDrip ? "" : "flex h-full flex-col"}`}>
            <div className="border-b p-5">
              <div className="flex items-center justify-between gap-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Live preview</p><StatusPill status={form.status} /></div>
              <h2 className="mt-3 text-base font-semibold">{previewSubject}</h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">{form.fromName || "Your brand"} &lt;{form.fromEmail || "sender@sellerslogin.com"}&gt;</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{previewText}</p>
            </div>
            <div className="border-b bg-muted/30 p-4">
              <div className="rounded-lg border border-dashed bg-background p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Audience</p>
                <p className="mt-1 text-sm font-medium">{recipients} eligible recipient(s)</p>
                <p className="mt-1 text-xs text-muted-foreground">{isDrip ? `${form.dripSteps.length} email sequence` : selectedTemplate?.name || "Choose a template"}</p>
              </div>
            </div>
            <div className={`bg-muted/20 p-4 ${isDrip ? "" : "flex min-h-0 flex-1"}`}>
              <iframe title="Campaign live preview" sandbox="" srcDoc={previewHtml} className={`w-full rounded-lg border-0 bg-white shadow-sm ${isDrip ? "h-[520px]" : "h-full min-h-[320px]"}`} />
            </div>
          </div>
        </aside>
      </form>

      <Dialog open={testOpen} onOpenChange={setTestOpen}><DialogContent><DialogHeader><DialogTitle>Send a test email</DialogTitle><DialogDescription>Send the selected template through crm-b and the configured verified SES sender. Test sends do not affect campaign metrics or audience delivery.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="test-email">Recipient email</Label><Input id="test-email" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="you@example.com" disabled={testSending} /></div><DialogFooter><Button variant="outline" onClick={() => setTestOpen(false)} disabled={testSending}>Cancel</Button><Button onClick={sendTestEmail} disabled={testSending}><Send className="mr-2 h-4 w-4" />{testSending ? "Sending..." : "Send test email"}</Button></DialogFooter></DialogContent></Dialog>
    </PageContainer></ModulePage>
  )
}

function CompactCampaignForm({
  form,
  setField,
  templates,
  subscribers,
  segments,
  verifiedDomains,
  platformSender,
  recipientCount,
  isEditing,
  saveDraft,
}: {
  form: CampaignInput
  setField: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void
  templates: ReturnType<typeof useEmailMarketingStore>["templates"]
  subscribers: ReturnType<typeof useEmailMarketingStore>["subscribers"]
  segments: ReturnType<typeof useEmailMarketingStore>["segments"]
  verifiedDomains: ReturnType<typeof useEmailMarketingStore>["domains"]
  platformSender: ReturnType<typeof useEmailMarketingStore>["platformSender"]
  recipientCount: number
  isEditing: boolean
  saveDraft: () => void
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="compact-campaign-name" className="text-xs">Campaign name *</Label>
          <Input id="compact-campaign-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="For example: April product update" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Campaign type</Label>
          <Select value={form.type} disabled={isEditing} onValueChange={(value) => setField("type", value as CampaignType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(campaignTypeLabels).filter(([value]) => value !== "drip_campaign").map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Campaign goal</Label>
          <Select value={form.goal} onValueChange={(value) => setField("goal", value as CampaignGoal)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="clicks">Clicks</SelectItem><SelectItem value="orders">Orders</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="reactivation">Reactivation</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Send status</Label>
          <Select value={form.status} onValueChange={(value) => setField("status", value as CampaignStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="compact-subject" className="text-xs">Subject line</Label>
          <Input id="compact-subject" value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="For example: A quick update from Sellers Login" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="compact-from-name" className="text-xs">From name</Label>
          <Input id="compact-from-name" value={form.fromName} onChange={(event) => setField("fromName", event.target.value)} placeholder="For example: Sellers Login" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">From email</Label>
          <Select value={form.fromEmail} onValueChange={(value) => setField("fromEmail", value)}>
            <SelectTrigger><SelectValue placeholder="Choose sender" /></SelectTrigger>
            <SelectContent><SelectItem value={platformSender.fromEmail}>{platformSender.fromEmail} · SellersLogin default</SelectItem>{verifiedDomains.map((domain) => <SelectItem key={domain.id} value={`info@${domain.domain}`}>info@{domain.domain}</SelectItem>)}</SelectContent>
          </Select>
          <p className="truncate text-[10px] text-muted-foreground">Final sender: {form.fromEmail || platformSender.fromEmail}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="compact-reply-to" className="text-xs">Reply-to</Label>
          <Input id="compact-reply-to" type="email" value={form.replyTo} onChange={(event) => setField("replyTo", event.target.value)} placeholder="Optional reply email" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Template</Label>
          <Select value={form.templateId} onValueChange={(value) => setField("templateId", value)}>
            <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
            <SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} · {template.type}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Choose your audience</Label>
          <Select value={form.audienceMode} onValueChange={(value) => setField("audienceMode", value as AudienceMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All subscribers</SelectItem><SelectItem value="segment">Saved segment</SelectItem><SelectItem value="selected">Selected subscribers</SelectItem></SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">{recipientCount} eligible recipient(s)</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compact-preview-text" className="text-xs">Preview text</Label>
          <Input id="compact-preview-text" value={form.previewText} onChange={(event) => setField("previewText", event.target.value)} placeholder="Short inbox preview text" />
        </div>

        {form.audienceMode === "segment" ? <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Saved segment</Label><Select value={form.segmentId} onValueChange={(value) => setField("segmentId", value)}><SelectTrigger><SelectValue placeholder="Choose a segment" /></SelectTrigger><SelectContent>{segments.map((segment) => <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>)}</SelectContent></Select></div> : null}
        {form.audienceMode === "selected" ? <div className="md:col-span-2"><Label className="text-xs">Individual subscribers</Label><div className="mt-1.5 grid max-h-28 gap-px overflow-y-auto rounded-lg border bg-border sm:grid-cols-2">{subscribers.filter((subscriber) => subscriber.status === "subscribed" && !subscriber.blocked).map((subscriber) => <label key={subscriber.id} className="flex cursor-pointer items-center gap-2 bg-background px-3 py-2 text-xs"><Checkbox checked={form.subscriberIds.includes(subscriber.id)} onCheckedChange={(checked) => setField("subscriberIds", checked ? [...form.subscriberIds, subscriber.id] : form.subscriberIds.filter((id) => id !== subscriber.id))} /><span className="truncate">{subscriber.email}</span></label>)}</div></div> : null}

        {form.status === "scheduled" ? <><div className="space-y-1.5"><Label htmlFor="compact-schedule" className="text-xs">Send date and time</Label><Input id="compact-schedule" type="datetime-local" value={form.scheduledAt} onChange={(event) => setField("scheduledAt", event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="compact-timezone" className="text-xs">Timezone</Label><Input id="compact-timezone" value={form.timezone} onChange={(event) => setField("timezone", event.target.value)} /></div></> : null}

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3 md:col-span-2">
          <span><span className="block text-xs font-semibold">Recurring campaign</span><span className="mt-0.5 block text-[10px] text-muted-foreground">Re-check the selected audience before every scheduled run.</span></span>
          <span className="flex shrink-0 items-center gap-2 text-xs"><Checkbox checked={form.isRecurring} onCheckedChange={(checked) => { setField("isRecurring", Boolean(checked)); if (checked) setField("status", "scheduled") }} />{form.isRecurring ? "On" : "Off"}</span>
        </label>

        {form.isRecurring ? <div className="grid gap-3 md:col-span-2 md:grid-cols-3"><div className="space-y-1.5"><Label className="text-xs">Every</Label><Input type="number" min={1} value={form.recurrenceInterval} onChange={(event) => setField("recurrenceInterval", Number(event.target.value))} /></div><div className="space-y-1.5"><Label className="text-xs">Frequency</Label><Select value={form.recurrenceUnit} onValueChange={(value) => setField("recurrenceUnit", value as CampaignInput["recurrenceUnit"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Day(s)</SelectItem><SelectItem value="week">Week(s)</SelectItem><SelectItem value="month">Month(s)</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs">End date</Label><Input type="datetime-local" value={form.recurrenceEndAt} onChange={(event) => setField("recurrenceEndAt", event.target.value)} /></div></div> : null}
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" size="sm" onClick={saveDraft}><Save className="mr-2 h-4 w-4" />Save as draft</Button>
        <Button type="submit" size="sm"><Send className="mr-2 h-4 w-4" />{form.status === "scheduled" ? "Schedule campaign" : "Create campaign"}</Button>
      </div>
    </section>
  )
}

function SetupStep({ form, setField, isEditing }: { form: CampaignInput; setField: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void; isEditing: boolean }) {
  return <div><h3 className="text-lg font-semibold">Campaign setup</h3><p className="mt-1 text-sm text-muted-foreground">Name the campaign and define its purpose.</p><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label htmlFor="campaign-name">Internal campaign name *</Label><Input id="campaign-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Diwali product launch" /></div><div className="space-y-2"><Label>Campaign type</Label><Select value={form.type} disabled={isEditing} onValueChange={(value) => setField("type", value as CampaignType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(campaignTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Primary goal</Label><Select value={form.goal} onValueChange={(value) => setField("goal", value as CampaignGoal)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="clicks">Clicks</SelectItem><SelectItem value="orders">Orders</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="reactivation">Reactivation</SelectItem></SelectContent></Select></div><div className="space-y-2 md:col-span-2"><Label>Workflow status</Label><Select value={form.status} onValueChange={(value) => setField("status", value as CampaignStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Save as draft</SelectItem>{form.type === "drip_campaign" ? <><SelectItem value="active">Active</SelectItem>{isEditing ? <SelectItem value="paused">Paused</SelectItem> : null}</> : <SelectItem value="scheduled">Schedule for later</SelectItem>}</SelectContent></Select></div></div></div>
}

function ContentStep({ form, setField, templates, isDrip, updateDripStep, previewDripStepId, setPreviewDripStepId }: { form: CampaignInput; setField: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void; templates: ReturnType<typeof useEmailMarketingStore>["templates"]; isDrip: boolean; updateDripStep: (id: string, updates: Partial<DripStep>) => void; previewDripStepId: string; setPreviewDripStepId: (id: string) => void }) {
  if (isDrip) return <div><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">Drip email sequence</h3><p className="mt-1 text-sm text-muted-foreground">Set content and delay for each lifecycle step. Focus a step to show it in the live preview.</p></div><Button type="button" size="sm" variant="outline" onClick={() => { const next = createDripStep(templates[0]?.id || ""); setField("dripSteps", [...form.dripSteps, next]); setPreviewDripStepId(next.id) }}><Plus className="mr-2 h-4 w-4" />Add step</Button></div><div className="mt-6 space-y-4">{form.dripSteps.map((item, index) => <div key={item.id} onFocusCapture={() => setPreviewDripStepId(item.id)} onClick={() => setPreviewDripStepId(item.id)} className={`rounded-xl border bg-background p-4 transition ${previewDripStepId === item.id ? "border-primary ring-1 ring-primary/20" : ""}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-primary">STEP {index + 1}{previewDripStepId === item.id ? " · PREVIEWING" : ""}</span><Button type="button" size="icon" variant="ghost" disabled={form.dripSteps.length === 1} onClick={() => setField("dripSteps", form.dripSteps.filter((step) => step.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Step title</Label><Input value={item.title} onChange={(event) => updateDripStep(item.id, { title: event.target.value })} /></div><div className="grid grid-cols-[1fr_130px] gap-2"><div className="space-y-2"><Label>Wait</Label><Input type="number" min={0} value={item.delayValue} onChange={(event) => updateDripStep(item.id, { delayValue: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Unit</Label><Select value={item.delayUnit} onValueChange={(value) => updateDripStep(item.id, { delayUnit: value as DripStep["delayUnit"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hours">Hours</SelectItem><SelectItem value="days">Days</SelectItem><SelectItem value="weeks">Weeks</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Template</Label><Select value={item.templateId} onValueChange={(value) => updateDripStep(item.id, { templateId: value })}><SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger><SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Subject</Label><Input value={item.subject} onChange={(event) => updateDripStep(item.id, { subject: event.target.value })} /></div></div></div>)}</div>{!templates.length ? <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Create at least one template before activating this drip campaign.</p> : null}</div>
  return <div><h3 className="text-lg font-semibold">Email content</h3><p className="mt-1 text-sm text-muted-foreground">Choose a template and customize inbox-facing text.</p><div className="mt-6 grid gap-5"><div className="space-y-2"><Label>Template</Label><Select value={form.templateId} onValueChange={(value) => setField("templateId", value)}><SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger><SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} · {template.type}</SelectItem>)}</SelectContent></Select>{!templates.length ? <p className="text-xs text-muted-foreground">No templates yet. <Link to={getEmailMarketingPath("/templates") as never} className="text-primary underline">Create a template first.</Link></p> : null}</div><div className="space-y-2"><Label htmlFor="campaign-subject">Email subject</Label><Input id="campaign-subject" value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Hello {{first_name}}" /></div><div className="space-y-2"><Label htmlFor="campaign-preview">Preview text</Label><Textarea id="campaign-preview" value={form.previewText} onChange={(event) => setField("previewText", event.target.value)} rows={3} placeholder="The short text shown beside the subject in the inbox." /></div></div></div>
}

type Store = ReturnType<typeof useEmailMarketingStore>
function AudienceSenderStep({ form, setField, subscribers, segments, verifiedDomains, platformSender, recipientCount }: { form: CampaignInput; setField: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void; subscribers: Store["subscribers"]; segments: Store["segments"]; verifiedDomains: Store["domains"]; platformSender: Store["platformSender"]; recipientCount: number }) {
  return <div><h3 className="text-lg font-semibold">Audience and sender</h3><p className="mt-1 text-sm text-muted-foreground">The SellersLogin sender is always available; verified workspace domains can be selected when connected.</p><div className="mt-6 space-y-6"><div><Label>Audience source</Label><div className="mt-3 grid gap-3 md:grid-cols-3">{(["all", "segment", "selected"] as AudienceMode[]).map((mode) => <button key={mode} type="button" onClick={() => setField("audienceMode", mode)} className={`rounded-xl border p-4 text-left transition ${form.audienceMode === mode ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}><Users className="h-5 w-5 text-primary" /><p className="mt-2 text-sm font-semibold capitalize">{mode === "all" ? "All subscribers" : mode}</p><p className="mt-1 text-xs text-muted-foreground">{mode === "all" ? "Every eligible contact" : mode === "segment" ? "Use a saved segment" : "Pick individual contacts"}</p></button>)}</div></div>{form.audienceMode === "segment" ? <div className="space-y-2"><Label>Saved segment</Label><Select value={form.segmentId} onValueChange={(value) => setField("segmentId", value)}><SelectTrigger><SelectValue placeholder="Choose a segment" /></SelectTrigger><SelectContent>{segments.map((segment) => <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>)}</SelectContent></Select></div> : null}{form.audienceMode === "selected" ? <div><Label>Individual subscribers</Label><div className="mt-2 max-h-60 divide-y overflow-auto rounded-xl border">{subscribers.filter((subscriber) => subscriber.status === "subscribed" && !subscriber.blocked).map((subscriber) => <label key={subscriber.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50"><Checkbox checked={form.subscriberIds.includes(subscriber.id)} onCheckedChange={(checked) => setField("subscriberIds", checked ? [...form.subscriberIds, subscriber.id] : form.subscriberIds.filter((id) => id !== subscriber.id))} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{subscriber.email}</span><span className="block text-xs text-muted-foreground">{subscriber.firstName} {subscriber.lastName}</span></span></label>)}{!subscribers.length ? <p className="p-4 text-sm text-muted-foreground">Add subscribers in Audience first.</p> : null}</div></div> : null}<div className="rounded-xl bg-primary/5 p-4"><p className="text-sm font-semibold">{recipientCount} eligible recipient(s)</p><p className="mt-1 text-xs text-muted-foreground">Unsubscribed, suppressed, and blocked contacts are excluded automatically.</p></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="sender-name">From name</Label><Input id="sender-name" value={form.fromName} onChange={(event) => setField("fromName", event.target.value)} /></div><div className="space-y-2"><Label>From email</Label><Select value={form.fromEmail} onValueChange={(value) => setField("fromEmail", value)}><SelectTrigger><SelectValue placeholder="Choose sender" /></SelectTrigger><SelectContent><SelectItem value={platformSender.fromEmail}>{platformSender.fromEmail} · SellersLogin default</SelectItem>{verifiedDomains.map((domain) => <SelectItem key={domain.id} value={`info@${domain.domain}`}>info@{domain.domain}</SelectItem>)}</SelectContent></Select>{!verifiedDomains.length ? <p className="text-xs text-muted-foreground">Using the SellersLogin default sender. <Link to={getEmailMarketingPath("/connect-domain/my-domains") as never} className="text-primary underline">Connect a custom domain.</Link></p> : null}</div><div className="space-y-2 md:col-span-2"><Label htmlFor="reply-to">Reply-to email</Label><Input id="reply-to" type="email" value={form.replyTo} onChange={(event) => setField("replyTo", event.target.value)} placeholder={form.fromEmail || platformSender.replyTo} /></div></div></div></div>
}

function ScheduleStep({ form, setField, isDrip }: { form: CampaignInput; setField: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void; isDrip: boolean }) {
  if (isDrip) return <div><h3 className="text-lg font-semibold">Drip activation</h3><p className="mt-1 text-sm text-muted-foreground">Choose which subscribers enter this flow.</p><div className="mt-6 space-y-5"><div className="space-y-2"><Label>Enrollment audience</Label><Select value={form.dripTargetAudience} onValueChange={(value) => setField("dripTargetAudience", value as "all" | "new_only")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new_only">New subscribers joining after activation</SelectItem><SelectItem value="all">Current matches and future subscribers</SelectItem></SelectContent></Select></div><div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">When active, subscribers enter at step 1 and progress using each configured delay. Choose the lifecycle status in Campaign setup above.</div></div></div>
  return <div><h3 className="text-lg font-semibold">Schedule and recurrence</h3><p className="mt-1 text-sm text-muted-foreground">Configure timing when “Schedule for later” is selected above.</p><div className="mt-6 space-y-5">{form.status === "scheduled" ? <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="schedule-at">Send date and time</Label><Input id="schedule-at" type="datetime-local" value={form.scheduledAt} onChange={(event) => setField("scheduledAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="timezone">Timezone</Label><Input id="timezone" value={form.timezone} onChange={(event) => setField("timezone", event.target.value)} /></div></div> : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">This campaign will remain a draft until its workflow status is changed.</div>}<label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><Checkbox checked={form.isRecurring} onCheckedChange={(checked) => { setField("isRecurring", Boolean(checked)); if (checked) setField("status", "scheduled") }} /><span><span className="block text-sm font-semibold">Recurring campaign</span><span className="mt-1 block text-xs text-muted-foreground">Re-evaluate the selected audience before every scheduled run.</span></span></label>{form.isRecurring ? <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Every</Label><Input type="number" min={1} value={form.recurrenceInterval} onChange={(event) => setField("recurrenceInterval", Number(event.target.value))} /></div><div className="space-y-2"><Label>Frequency</Label><Select value={form.recurrenceUnit} onValueChange={(value) => setField("recurrenceUnit", value as CampaignInput["recurrenceUnit"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Day(s)</SelectItem><SelectItem value="week">Week(s)</SelectItem><SelectItem value="month">Month(s)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>End date (optional)</Label><Input type="datetime-local" value={form.recurrenceEndAt} onChange={(event) => setField("recurrenceEndAt", event.target.value)} /></div></div> : null}</div></div>
}

function MissingCampaign() { return <ModulePage><PageContainer className="max-w-3xl"><div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-xl font-semibold">Campaign not found</h2><Button className="mt-5" asChild><Link to={getEmailMarketingPath("/campaigns") as never}>Back to campaigns</Link></Button></div></PageContainer></ModulePage> }
