import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Ban, Mail, Pencil, ShieldAlert, Tag, Trash2, UserCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { ModulePage, PageContainer, PageHeading, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import type { SubscriberInput, SubscriberStatus } from "../types"

const emptyForm: SubscriberInput = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  status: "subscribed",
  source: "Manual",
  tags: [],
  notes: "",
  blocked: false,
}

export function SubscriberFormPage({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { subscribers, createSubscriber, updateSubscriber } = useEmailMarketingStore()
  const existing = subscribers.find((subscriber) => subscriber.id === id)
  const [form, setForm] = useState<SubscriberInput>(() => existing ? {
    email: existing.email,
    firstName: existing.firstName,
    lastName: existing.lastName,
    phone: existing.phone,
    status: existing.status,
    source: existing.source,
    tags: existing.tags,
    notes: existing.notes,
    blocked: existing.blocked,
  } : emptyForm)
  const [tags, setTags] = useState(existing?.tags.join(", ") || "")

  const setField = <K extends keyof SubscriberInput>(key: K, value: SubscriberInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (!email || !email.includes("@")) return toast.error("Enter a valid email address.")
    if (subscribers.some((subscriber) => subscriber.email.toLowerCase() === email && subscriber.id !== id)) return toast.error("This email already exists in the audience.")

    const payload = { ...form, email, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) }
    try {
      const saved = id ? await updateSubscriber(id, payload) : await createSubscriber(payload)
      if (!saved) return toast.error("Subscriber could not be found.")
      toast.success(id ? "Subscriber updated" : "Subscriber added")
      void navigate({ to: getEmailMarketingPath(`/audience/${saved.id}`) as never })
    } catch {
      toast.error("Subscriber could not be saved.")
    }
  }

  if (id && !existing) {
    return <MissingSubscriber />
  }

  return (
    <ModulePage>
      <PageContainer className="max-w-5xl">
        <PageHeading title={id ? "Edit subscriber" : "Add subscriber"} description="Maintain accurate contact details, consent status, tags, and internal notes." actions={<Button variant="outline" asChild><Link to={getEmailMarketingPath(id ? `/audience/${id}` : "/audience") as never}><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>} />
        <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="subscriber-email">Email address *</Label><Input id="subscriber-email" type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="name@company.com" required /></div>
            <div className="space-y-2"><Label htmlFor="subscriber-first-name">First name</Label><Input id="subscriber-first-name" value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="subscriber-last-name">Last name</Label><Input id="subscriber-last-name" value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="subscriber-phone">Phone</Label><Input id="subscriber-phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+91..." /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => setField("status", value as SubscriberStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="subscribed">Subscribed</SelectItem><SelectItem value="unsubscribed">Unsubscribed</SelectItem><SelectItem value="suppressed">Suppressed</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="subscriber-source">Source</Label><Input id="subscriber-source" value={form.source} onChange={(event) => setField("source", event.target.value)} placeholder="Manual, CRM Lead, CSV Import..." /></div>
            <div className="space-y-2"><Label htmlFor="subscriber-tags">Tags</Label><Input id="subscriber-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="customer, newsletter, vip" /><p className="text-xs text-muted-foreground">Separate multiple tags with commas.</p></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="subscriber-notes">Internal notes</Label><Textarea id="subscriber-notes" value={form.notes} onChange={(event) => setField("notes", event.target.value)} rows={5} placeholder="Add context for your team..." /></div>
          </div>
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" asChild><Link to={getEmailMarketingPath("/audience") as never}>Cancel</Link></Button><Button type="submit">{id ? "Save changes" : "Add subscriber"}</Button></div>
        </form>
      </PageContainer>
    </ModulePage>
  )
}

export function SubscriberDetailsPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const { subscribers, updateSubscriber, deleteSubscribers, addSuppression } = useEmailMarketingStore()
  const subscriber = subscribers.find((item) => item.id === id)
  const [tags, setTags] = useState(subscriber?.tags.join(", ") || "")
  const [notes, setNotes] = useState(subscriber?.notes || "")
  const displayName = useMemo(() => subscriber ? `${subscriber.firstName} ${subscriber.lastName}`.trim() || subscriber.email : "Subscriber", [subscriber])

  if (!subscriber) return <MissingSubscriber />

  const saveNotes = async () => {
    try {
      await updateSubscriber(subscriber.id, { tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), notes })
      toast.success("Subscriber details saved")
    } catch {
      toast.error("Subscriber details could not be saved.")
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${subscriber.email} from your audience?`)) return
    try {
      await deleteSubscribers([subscriber.id])
      toast.success("Subscriber deleted")
      void navigate({ to: getEmailMarketingPath("/audience") as never })
    } catch {
      toast.error("Subscriber could not be deleted.")
    }
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading title={displayName} description={subscriber.email} actions={<><Button variant="outline" asChild><Link to={getEmailMarketingPath("/audience") as never}><ArrowLeft className="mr-2 h-4 w-4" />Audience</Link></Button><Button asChild><Link to={getEmailMarketingPath(`/audience/${id}/edit`) as never}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button></>} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center gap-3"><StatusPill status={subscriber.status} />{subscriber.blocked ? <StatusPill status="blocked" /> : null}<span className="text-xs text-muted-foreground">Added {formatDate(subscriber.createdAt)}</span></div>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <Detail label="Email" value={subscriber.email} />
                <Detail label="Phone" value={subscriber.phone || "Not provided"} />
                <Detail label="Source" value={subscriber.source || "Unknown"} />
                <Detail label="Last updated" value={formatDate(subscriber.updatedAt)} />
              </dl>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <h3 className="font-semibold">Tags and notes</h3>
              <div className="mt-4 space-y-4">
                <div><Label htmlFor="detail-tags">Tags</Label><div className="relative mt-2"><Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="detail-tags" value={tags} onChange={(event) => setTags(event.target.value)} className="pl-9" /></div></div>
                <div><Label htmlFor="detail-notes">Internal notes</Label><Textarea id="detail-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="mt-2" /></div>
                <Button onClick={saveNotes}>Save details</Button>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Email eligibility</h3>
              <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm"><p className="font-medium">{subscriber.status === "subscribed" && !subscriber.blocked ? "Eligible for email" : "Not eligible for email"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Status: {subscriber.status}. {subscriber.blocked ? "This address is blocked." : "No manual block is active."}</p></div>
              <div className="mt-4 grid gap-2">
                <Button variant="outline" onClick={() => { updateSubscriber(id, { status: "subscribed", blocked: false }); toast.success("Subscriber reactivated") }}><UserCheck className="mr-2 h-4 w-4" />Reactivate</Button>
                <Button variant="outline" onClick={() => { updateSubscriber(id, { status: "unsubscribed" }); toast.success("Subscriber unsubscribed") }}><Mail className="mr-2 h-4 w-4" />Unsubscribe</Button>
                <Button variant="outline" onClick={() => { addSuppression(subscriber.email, "manual", "Manually suppressed from subscriber details"); toast.success("Address suppressed") }}><ShieldAlert className="mr-2 h-4 w-4" />Suppress address</Button>
                <Button variant="outline" onClick={() => { updateSubscriber(id, { blocked: !subscriber.blocked }); toast.success(subscriber.blocked ? "Address unblocked" : "Address blocked") }}><Ban className="mr-2 h-4 w-4" />{subscriber.blocked ? "Unblock" : "Block"}</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-card p-5"><h3 className="font-semibold text-destructive">Danger zone</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Permanently remove this subscriber from the frontend workspace.</p><Button variant="destructive" className="mt-4 w-full" onClick={remove}><Trash2 className="mr-2 h-4 w-4" />Delete subscriber</Button></div>
          </aside>
        </div>
      </PageContainer>
    </ModulePage>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd></div>
}

function MissingSubscriber() {
  return <ModulePage><PageContainer className="max-w-3xl"><div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-xl font-semibold">Subscriber not found</h2><p className="mt-2 text-sm text-muted-foreground">This subscriber may have been removed.</p><Button className="mt-5" asChild><Link to={getEmailMarketingPath("/audience") as never}>Back to audience</Link></Button></div></PageContainer></ModulePage>
}
