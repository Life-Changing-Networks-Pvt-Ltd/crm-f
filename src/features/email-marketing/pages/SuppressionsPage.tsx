import { useMemo, useState, type FormEvent } from "react"
import { AlertTriangle, Ban, Plus, RotateCcw, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, MetricCard, ModulePage, PageContainer, PageHeading, SearchField, StatusPill, formatDate } from "../components/PageElements"
import type { SuppressionType } from "../types"

export function SuppressionsPage() {
  const { suppressions, addSuppression, removeSuppression } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [type, setType] = useState<SuppressionType>("manual")
  const [reason, setReason] = useState("")
  const filtered = useMemo(() => suppressions.filter((item) => (!query || `${item.email} ${item.reason}`.toLowerCase().includes(query.toLowerCase())) && (typeFilter === "all" || item.type === typeFilter)), [suppressions, query, typeFilter])
  const unsubscribeCount = suppressions.filter((item) => item.type === "unsubscribe").length
  const riskCount = suppressions.filter((item) => item.type === "bounce" || item.type === "complaint").length

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim().includes("@")) return toast.error("Enter a valid email address.")
    try {
      await addSuppression(email, type, reason || "Manually added to the suppression list")
      toast.success("Email address suppressed")
      setEmail("")
      setReason("")
      setType("manual")
      setShowForm(false)
    } catch {
      toast.error("Email address could not be suppressed.")
    }
  }

  return <ModulePage><PageContainer><PageHeading title="Suppressions" description="Protect sender reputation by excluding unsubscribed, bounced, complained, or manually blocked addresses." actions={<Button onClick={() => setShowForm((current) => !current)}><Plus className="mr-2 h-4 w-4" />Add suppression</Button>} />
    <section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Total suppressed" value={suppressions.length} helper="Blocked from future emails" icon={<ShieldAlert className="h-5 w-5" />} tone="warning" /><MetricCard label="Unsubscribed" value={unsubscribeCount} helper="Recipient opt-outs" icon={<Ban className="h-5 w-5" />} tone="muted" /><MetricCard label="Delivery risks" value={riskCount} helper="Bounces and complaints" icon={<AlertTriangle className="h-5 w-5" />} tone="warning" /></section>
    {showForm ? <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-[1fr_220px_1.5fr_auto] md:items-end"><div className="space-y-2"><Label htmlFor="suppression-email">Email address</Label><Input id="suppression-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div><div className="space-y-2"><Label>Reason type</Label><Select value={type} onValueChange={(value) => setType(value as SuppressionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="unsubscribe">Unsubscribe</SelectItem><SelectItem value="bounce">Bounce</SelectItem><SelectItem value="complaint">Complaint</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="suppression-reason">Notes</Label><Textarea id="suppression-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={1} placeholder="Why should this address be blocked?" /></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Suppress</Button></div></div></form> : null}
    <section className="rounded-2xl border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b p-4 md:flex-row"><SearchField value={query} onChange={setQuery} placeholder="Search email or reason..." className="md:max-w-sm md:flex-1" /><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All reasons</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="unsubscribe">Unsubscribe</SelectItem><SelectItem value="bounce">Bounce</SelectItem><SelectItem value="complaint">Complaint</SelectItem></SelectContent></Select></div>{filtered.length ? <Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Added</TableHead><TableHead className="w-32" /></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.email}</TableCell><TableCell><StatusPill status={item.type} /></TableCell><TableCell className="max-w-md text-muted-foreground">{item.reason}</TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(item.createdAt)}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => { removeSuppression(item.id); toast.success("Address removed from suppressions") }}><RotateCcw className="mr-2 h-4 w-4" />Unsuppress</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="p-4"><EmptyPanel title={suppressions.length ? "No matching suppressions" : "Your suppression list is clear"} description={suppressions.length ? "Try another search or reason filter." : "Addresses added here will be excluded from future email campaigns."} /></div>}<div className="border-t px-4 py-3 text-xs text-muted-foreground">Showing {filtered.length} of {suppressions.length} suppressed addresses</div></section>
  </PageContainer></ModulePage>
}
