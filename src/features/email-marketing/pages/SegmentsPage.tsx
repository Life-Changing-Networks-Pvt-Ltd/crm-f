import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Copy, Eye, ListFilter, MoreHorizontal, Plus, Sparkles, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, ModulePage, PageContainer, PageHeading, SearchField, formatDate } from "../components/PageElements"
import { segmentPresets, type SegmentPreset } from "../data/presets"
import { getEmailMarketingPath } from "../navigation"
import type { SegmentCondition, SegmentField, SegmentInput, SegmentOperator } from "../types"

function emptyCondition(): SegmentCondition {
  return { id: `condition_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, field: "status", operator: "equals", value: "subscribed" }
}

export function SegmentsPage() {
  const { segments, getSegmentSubscribers, deleteSegment, createSegment } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const [actionId, setActionId] = useState<string | null>(null)
  const filtered = segments.filter((segment) => `${segment.name} ${segment.description}`.toLowerCase().includes(query.toLowerCase()))

  const duplicate = async (id: string) => {
    const source = segments.find((segment) => segment.id === id)
    if (!source) return
    try {
      await createSegment({ name: `${source.name} Copy`, description: source.description, logic: source.logic, conditions: source.conditions.map((condition) => ({ ...condition, id: emptyCondition().id })) })
      toast.success("Segment duplicated")
    } catch {
      toast.error("Segment could not be duplicated.")
    }
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading title="Segmentation" description="Create dynamic audience groups using contact attributes, tags, status, source, and signup date." actions={<><Button variant="outline" asChild><Link to={getEmailMarketingPath("/segments/presets") as never}><Sparkles className="mr-2 h-4 w-4" />Ready-made segments</Link></Button><Button asChild><Link to={getEmailMarketingPath("/segments/new") as never}><Plus className="mr-2 h-4 w-4" />Create segment</Link></Button></>} />
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-4"><SearchField value={query} onChange={setQuery} placeholder="Search segments..." className="max-w-sm" /></div>
          {filtered.length ? <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((segment) => { const count = getSegmentSubscribers(segment).length; return <article key={segment.id} className="relative rounded-2xl border bg-background p-5 transition hover:border-primary/30 hover:shadow-sm"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ListFilter className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{segment.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{segment.description || "Dynamic subscriber segment"}</p></div><div className="relative"><Button size="icon" variant="ghost" onClick={() => setActionId(actionId === segment.id ? null : segment.id)}><MoreHorizontal className="h-4 w-4" /></Button>{actionId === segment.id ? <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border bg-popover p-1 shadow-lg"><button className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent" onClick={() => { duplicate(segment.id); setActionId(null) }}><Copy className="mr-2 h-4 w-4" />Duplicate</button><button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Delete ${segment.name}?`)) deleteSegment(segment.id); setActionId(null) }}><Trash2 className="mr-2 h-4 w-4" />Delete</button></div> : null}</div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 p-3"><span className="flex items-center text-xs text-muted-foreground"><Users className="mr-2 h-4 w-4" />Matching subscribers</span><strong>{count}</strong></div><div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground"><span>{segment.conditions.length} rule(s) · {segment.logic.toUpperCase()}</span><span>{formatDate(segment.updatedAt)}</span></div><Button className="mt-4 w-full" variant="outline" asChild><Link to={getEmailMarketingPath(`/segments/${segment.id}/edit`) as never}>Edit segment</Link></Button></article> })}</div> : <div className="p-4"><EmptyPanel title={segments.length ? "No matching segments" : "Create your first segment"} description={segments.length ? "Try another search term." : "Combine audience rules and preview matching subscribers before saving."} action={!segments.length ? <Button asChild><Link to={getEmailMarketingPath("/segments/new") as never}><Plus className="mr-2 h-4 w-4" />Create segment</Link></Button> : undefined} /></div>}
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">{filtered.length} saved segment(s)</div>
        </section>
      </PageContainer>
    </ModulePage>
  )
}

export function SegmentPresetsPage() {
  const navigate = useNavigate()
  const { createSegment, getSegmentSubscribers } = useEmailMarketingStore()
  const handlePreset = async (preset: SegmentPreset) => {
    try {
      const created = await createSegment({ name: preset.name, description: preset.description, logic: preset.logic, conditions: preset.conditions.map((condition) => ({ ...condition, id: emptyCondition().id })) })
      toast.success("Ready-made segment created")
      void navigate({ to: getEmailMarketingPath(`/segments/${created.id}/edit`) as never })
    } catch {
      toast.error("Segment could not be created.")
    }
  }
  return <ModulePage><PageContainer><PageHeading title="Ready-made segments" description="Start with common audience definitions and customize them for your workspace." actions={<Button variant="outline" asChild><Link to={getEmailMarketingPath("/segments") as never}><ArrowLeft className="mr-2 h-4 w-4" />All segments</Link></Button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{segmentPresets.map((preset) => <article key={preset.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div><h3 className="mt-4 font-semibold">{preset.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{preset.description}</p><div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground"><p>{preset.conditions.length} rule(s), match {preset.logic === "and" ? "all" : "any"}</p><p className="mt-1 font-medium text-foreground">{getSegmentSubscribers(preset).length} current matches</p></div><Button className="mt-4 w-full" onClick={() => handlePreset(preset)}>Use this segment</Button></article>)}</div></PageContainer></ModulePage>
}

export function SegmentFormPage({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { segments, subscribers, createSegment, updateSegment, getSegmentSubscribers } = useEmailMarketingStore()
  const existing = segments.find((segment) => segment.id === id)
  const [form, setForm] = useState<SegmentInput>(() => existing ? { name: existing.name, description: existing.description, logic: existing.logic, conditions: existing.conditions } : { name: "", description: "", logic: "and", conditions: [emptyCondition()] })
  const [previewed, setPreviewed] = useState(false)
  const matches = useMemo(() => getSegmentSubscribers(form), [form, getSegmentSubscribers])

  if (id && !existing) return <ModulePage><PageContainer className="max-w-3xl"><div className="rounded-2xl border bg-card p-10 text-center"><h2 className="text-xl font-semibold">Segment not found</h2><Button className="mt-5" asChild><Link to={getEmailMarketingPath("/segments") as never}>Back to segments</Link></Button></div></PageContainer></ModulePage>

  const updateCondition = (conditionId: string, updates: Partial<SegmentCondition>) => setForm((current) => ({ ...current, conditions: current.conditions.map((condition) => condition.id === conditionId ? { ...condition, ...updates } : condition) }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return toast.error("Segment name is required.")
    if (!form.conditions.length || form.conditions.some((condition) => !condition.value.trim())) return toast.error("Complete every segment rule.")
    try {
      const saved = id ? await updateSegment(id, form) : await createSegment(form)
      if (!saved) return toast.error("Segment could not be saved.")
      toast.success(id ? "Segment updated" : "Segment created")
      void navigate({ to: getEmailMarketingPath("/segments") as never })
    } catch {
      toast.error("Segment could not be saved.")
    }
  }

  return (
    <ModulePage><PageContainer className="max-w-6xl"><PageHeading title={id ? "Edit segment" : "Create segment"} description="Combine subscriber attributes and preview exactly who will match this segment." actions={<Button variant="outline" asChild><Link to={getEmailMarketingPath("/segments") as never}><ArrowLeft className="mr-2 h-4 w-4" />All segments</Link></Button>} />
      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="segment-name">Segment name</Label><Input id="segment-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="High-intent subscribers" /></div><div className="space-y-2"><Label>Match logic</Label><Select value={form.logic} onValueChange={(value) => setForm((current) => ({ ...current, logic: value as "and" | "or" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="and">Match all conditions (AND)</SelectItem><SelectItem value="or">Match any condition (OR)</SelectItem></SelectContent></Select></div><div className="space-y-2 md:col-span-2"><Label htmlFor="segment-description">Description</Label><Textarea id="segment-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} /></div></div></div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Audience rules</h3><p className="mt-1 text-xs text-muted-foreground">{form.logic === "and" ? "Every rule must match." : "At least one rule must match."}</p></div><Button type="button" size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, conditions: [...current.conditions, emptyCondition()] }))}><Plus className="mr-2 h-4 w-4" />Add rule</Button></div><div className="mt-5 space-y-3">{form.conditions.map((condition, index) => <div key={condition.id} className="grid gap-2 rounded-xl border bg-background p-3 md:grid-cols-[100px_1fr_1fr_1.2fr_40px] md:items-center"><span className="text-xs font-semibold text-muted-foreground">{index === 0 ? "WHERE" : form.logic.toUpperCase()}</span><Select value={condition.field} onValueChange={(value) => { const field = value as SegmentField; updateCondition(condition.id, { field, operator: field === "createdAt" ? "within_days" : "equals", value: field === "status" ? "subscribed" : "" }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="status">Status</SelectItem><SelectItem value="tag">Tag</SelectItem><SelectItem value="source">Source</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="createdAt">Created date</SelectItem></SelectContent></Select><Select value={condition.operator} onValueChange={(value) => updateCondition(condition.id, { operator: value as SegmentOperator })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{condition.field === "createdAt" ? <SelectItem value="within_days">Within last days</SelectItem> : <><SelectItem value="equals">Equals</SelectItem><SelectItem value="not_equals">Does not equal</SelectItem><SelectItem value="contains">Contains</SelectItem><SelectItem value="not_contains">Does not contain</SelectItem></>}</SelectContent></Select>{condition.field === "status" ? <Select value={condition.value} onValueChange={(value) => updateCondition(condition.id, { value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="subscribed">Subscribed</SelectItem><SelectItem value="unsubscribed">Unsubscribed</SelectItem><SelectItem value="suppressed">Suppressed</SelectItem></SelectContent></Select> : <Input type={condition.field === "createdAt" ? "number" : "text"} min={condition.field === "createdAt" ? 0 : undefined} value={condition.value} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder={condition.field === "tag" ? "vip" : condition.field === "createdAt" ? "30" : "Value"} />}<Button type="button" size="icon" variant="ghost" disabled={form.conditions.length === 1} onClick={() => setForm((current) => ({ ...current, conditions: current.conditions.filter((item) => item.id !== condition.id) }))}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div>
        </section>
        <aside className="space-y-5"><div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-semibold">Live preview</h3><Eye className="h-5 w-5 text-primary" /></div><div className="mt-5 text-center"><p className="text-5xl font-bold tracking-tight">{matches.length}</p><p className="mt-2 text-sm text-muted-foreground">of {subscribers.length} subscribers match</p></div><Button type="button" variant="outline" className="mt-5 w-full" onClick={() => setPreviewed(true)}>Preview matching contacts</Button>{previewed ? <div className="mt-4 max-h-60 divide-y overflow-auto rounded-xl border">{matches.length ? matches.slice(0, 20).map((subscriber) => <div key={subscriber.id} className="p-3"><p className="truncate text-xs font-medium">{subscriber.email}</p><p className="text-[11px] text-muted-foreground">{subscriber.status} · {subscriber.source}</p></div>) : <p className="p-4 text-center text-xs text-muted-foreground">No contacts match these rules.</p>}</div> : null}</div><div className="rounded-2xl border bg-card p-5"><Button type="submit" className="w-full">{id ? "Save segment" : "Create segment"}</Button><p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">Segment membership updates from the current audience data.</p></div></aside>
      </form>
    </PageContainer></ModulePage>
  )
}
