import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Check, Clipboard, Download, MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, ModulePage, PageContainer, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"

type DomainView = "domains" | "dns" | "health" | "dedicated-ip"

const viewTitles: Record<DomainView, string> = {
  domains: "My Domains",
  dns: "Setup DNS Records",
  health: "Domain Health",
  "dedicated-ip": "Dedicated IP",
}

const viewDescriptions: Record<DomainView, string> = {
  domains: "Add, review, and manage business domains for trusted email sending.",
  dns: "Copy the generated authentication records into your domain provider.",
  health: "Review domain verification and sender-readiness status.",
  "dedicated-ip": "Review the dedicated IP option for consistent high-volume sending.",
}

export function DomainConnectionPage({ view }: { view: DomainView }) {
  const navigate = useNavigate()
  const { domains, addDomain, updateDomain, setDomainStatus, deleteDomain } = useEmailMarketingStore()
  const [newDomain, setNewDomain] = useState("")
  const [selectedId, setSelectedId] = useState(domains[0]?.id || "")
  const [actionId, setActionId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dedicatedNotes, setDedicatedNotes] = useState("")
  const selected = domains.find((domain) => domain.id === selectedId) || domains[0]
  const submitDomain = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (!normalized || !normalized.includes(".") || normalized.includes(" ")) return toast.error("Enter a valid root domain, for example example.com.")
    if (domains.some((domain) => domain.domain === normalized)) return toast.error("This domain is already connected.")
    try {
      const created = await addDomain(normalized)
      setSelectedId(created.id)
      setNewDomain("")
      toast.success("Domain added", { description: "Add the generated DNS records at your DNS provider." })
      void navigate({ to: getEmailMarketingPath("/connect-domain/dns-records") as never })
    } catch {
      toast.error("Domain could not be registered. Check SES configuration.")
    }
  }

  const copyRecord = async (recordId: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedId(recordId)
    window.setTimeout(() => setCopiedId(null), 1500)
  }

  const exportRecords = () => {
    if (!selected) return
    const rows = ["type,name,value,purpose", ...selected.dnsRecords.map((record) => [record.type, record.name, record.value, record.purpose].map((value) => `"${value.replace(/"/g, '""')}"`).join(","))]
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selected.domain}-dns-records.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const simulateVerification = async () => {
    if (!selected) return
    try {
      const result = await setDomainStatus(selected.id, "verified")
      toast.info("DNS verification completed", { description: result?.status === "verified" ? "Domain is verified and ready for sending." : "Some DNS records are still pending." })
    } catch {
      toast.error("DNS verification could not be completed.")
    }
  }

  const verifyDomain = async (id: string) => {
    setSelectedId(id)
    try {
      const result = await setDomainStatus(id, "verified")
      toast.info("DNS verification completed", {
        description: result?.status === "verified"
          ? "Domain is verified and ready for sending."
          : "Some DNS records are still pending.",
      })
    } catch {
      toast.error("DNS verification could not be completed.")
    }
  }

  const requestDedicatedIp = async () => {
    if (!selected) return
    if (selected.status !== "verified") return toast.error("Verify the sending domain before requesting a dedicated IP.")
    try {
      await updateDomain(selected.id, { dedicatedIp: { ...selected.dedicatedIp, status: "requested", notes: dedicatedNotes } })
      toast.success("Dedicated IP request recorded")
    } catch {
      toast.error("Dedicated IP request could not be recorded.")
    }
  }

  return (
    <ModulePage><PageContainer>
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{viewTitles[view]}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{viewDescriptions[view]}</p>
      </section>

      {view === "domains" ? <DomainsView domains={domains} newDomain={newDomain} setNewDomain={setNewDomain} submitDomain={submitDomain} actionId={actionId} setActionId={setActionId} setSelectedId={setSelectedId} simulateVerification={verifyDomain} deleteDomain={deleteDomain} /> : null}
      {view === "dns" ? <DnsView domains={domains} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} copiedId={copiedId} copyRecord={copyRecord} exportRecords={exportRecords} simulateVerification={simulateVerification} /> : null}
      {view === "health" ? <HealthView domains={domains} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} simulateVerification={simulateVerification} /> : null}
      {view === "dedicated-ip" ? <DedicatedIpView domains={domains} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} notes={dedicatedNotes} setNotes={setDedicatedNotes} request={requestDedicatedIp} /> : null}
    </PageContainer></ModulePage>
  )
}

type Domains = ReturnType<typeof useEmailMarketingStore>["domains"]
function DomainSelector({ domains, value, onChange }: { domains: Domains; value: string; onChange: (value: string) => void }) {
  return <Select value={value || domains[0]?.id || ""} onValueChange={onChange}><SelectTrigger className="w-full md:w-72"><SelectValue placeholder="Choose a domain" /></SelectTrigger><SelectContent>{domains.map((domain) => <SelectItem key={domain.id} value={domain.id}>{domain.domain}</SelectItem>)}</SelectContent></Select>
}

function DomainsView({ domains, newDomain, setNewDomain, submitDomain, actionId, setActionId, setSelectedId, simulateVerification, deleteDomain }: { domains: Domains; newDomain: string; setNewDomain: (value: string) => void; submitDomain: (event: FormEvent) => void; actionId: string | null; setActionId: (value: string | null) => void; setSelectedId: (value: string) => void; simulateVerification: (id: string) => void; deleteDomain: (id: string) => void }) {
  return <><form onSubmit={submitDomain} className="rounded-xl border bg-card p-4 shadow-sm"><Label htmlFor="new-domain" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Business domain or subdomain</Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input id="new-domain" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="example.com or mail.example.com" className="h-10 flex-1 text-sm" /><Button type="submit" className="h-10 shrink-0"><Plus className="mr-2 h-4 w-4" />Add domain</Button></div><p className="mt-2 text-[11px] text-muted-foreground">Root domains and subdomains are supported. You will continue to DNS setup after adding.</p></form><section className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">Domain details</h3></div>{domains.length ? <Table><TableHeader><TableRow><TableHead className="text-xs">Domain</TableHead><TableHead className="text-xs">Tracking subdomain</TableHead><TableHead className="text-xs">Last checked</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="w-16 text-xs">Action</TableHead></TableRow></TableHeader><TableBody>{domains.map((domain) => <TableRow key={domain.id}><TableCell><button type="button" className="text-left text-xs font-medium hover:text-primary" onClick={() => setSelectedId(domain.id)}>{domain.domain}<span className="mt-1 block text-[11px] font-normal text-muted-foreground">Added {formatDate(domain.createdAt)}</span></button></TableCell><TableCell className="text-xs text-muted-foreground">{domain.trackingSubdomain}</TableCell><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{domain.lastCheckedAt ? formatDate(domain.lastCheckedAt) : "Never"}</TableCell><TableCell><StatusPill status={domain.status} /></TableCell><TableCell className="relative"><Button size="icon" variant="ghost" onClick={() => setActionId(actionId === domain.id ? null : domain.id)}><MoreHorizontal className="h-4 w-4" /></Button>{actionId === domain.id ? <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border bg-popover p-1 shadow-lg"><Link to={getEmailMarketingPath("/connect-domain/dns-records") as never} onClick={() => setSelectedId(domain.id)} className="block rounded-lg px-3 py-2 text-xs hover:bg-accent">View DNS records</Link><button className="flex w-full items-center rounded-lg px-3 py-2 text-xs hover:bg-accent" onClick={() => { simulateVerification(domain.id); setActionId(null) }}><RefreshCw className="mr-2 h-3.5 w-3.5" />Verify domain</button><button className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Remove ${domain.domain}?`)) deleteDomain(domain.id); setActionId(null) }}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</button></div> : null}</TableCell></TableRow>)}</TableBody></Table> : <div className="p-4"><EmptyPanel title="No domains added" description="Add your business domain above to generate authentication records." /></div>}</section></>
}

function DnsView({ domains, selected, selectedId, setSelectedId, copiedId, copyRecord, exportRecords, simulateVerification }: { domains: Domains; selected: Domains[number] | undefined; selectedId: string; setSelectedId: (value: string) => void; copiedId: string | null; copyRecord: (id: string, value: string) => void; exportRecords: () => void; simulateVerification: () => void }) {
  if (!selected) return <EmptyPanel title="No domain selected" description="Add a sending domain before configuring DNS records." action={<Button asChild><Link to={getEmailMarketingPath("/connect-domain/my-domains") as never}>Add domain</Link></Button>} />
  return <section className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="text-sm font-semibold">DNS records for {selected.domain}</h3><p className="mt-1 text-xs text-muted-foreground">Add these records at your DNS provider, then verify the domain.</p></div><div className="flex flex-wrap gap-2"><DomainSelector domains={domains} value={selectedId} onChange={setSelectedId} /><Button size="sm" variant="outline" onClick={exportRecords}><Download className="mr-2 h-4 w-4" />Export records</Button><Button size="sm" onClick={simulateVerification}><RefreshCw className="mr-2 h-4 w-4" />Verify</Button></div></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Host</TableHead><TableHead className="text-xs">Value</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader><TableBody>{selected.dnsRecords.map((record) => <TableRow key={record.id}><TableCell><span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] font-bold">{record.type}</span></TableCell><TableCell><CopyValue value={record.name} copied={copiedId === `${record.id}-name`} onCopy={() => copyRecord(`${record.id}-name`, record.name)} /></TableCell><TableCell><CopyValue value={record.value} copied={copiedId === `${record.id}-value`} onCopy={() => copyRecord(`${record.id}-value`, record.value)} /></TableCell><TableCell><StatusPill status={record.status} /></TableCell></TableRow>)}</TableBody></Table></div><div className="border-t px-4 py-3 text-[11px] text-muted-foreground">DNS propagation can take several hours. Verify again after publishing every record.</div></section>
}

function CopyValue({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) { return <div className="flex min-w-60 items-center gap-2"><code className="min-w-0 flex-1 break-all text-[11px] text-muted-foreground">{value}</code><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCopy}>{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}</Button></div> }

function HealthView({ domains, selected, selectedId, setSelectedId, simulateVerification }: { domains: Domains; selected: Domains[number] | undefined; selectedId: string; setSelectedId: (value: string) => void; simulateVerification: () => void }) {
  if (!selected) return <EmptyPanel title="No domain health data" description="Connect a sending domain to begin monitoring its health." />
  return <section className="rounded-xl border bg-card p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">Health for {selected.domain}</h3><p className="mt-1 text-xs text-muted-foreground">Verification, DNS, and sender-readiness summary.</p></div><div className="flex flex-wrap gap-2"><DomainSelector domains={domains} value={selectedId} onChange={setSelectedId} /><Button size="sm" variant="outline" onClick={simulateVerification}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><HealthDetail label="Domain status" value={<StatusPill status={selected.status} />} /><HealthDetail label="DNS records" value={`${selected.dnsRecords.filter((record) => record.status === "verified").length}/${selected.dnsRecords.length} verified`} /><HealthDetail label="Last checked" value={selected.lastCheckedAt ? formatDate(selected.lastCheckedAt) : "Never"} /></div><div className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground">{selected.status === "verified" ? "Domain verified and ready for sending." : "Publish all DNS records and run verification again."}</div></section>
}

function HealthDetail({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-lg border bg-muted/30 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-xs font-medium">{value}</div></div> }

function DedicatedIpView({ domains, selected, selectedId, setSelectedId, notes, setNotes, request }: { domains: Domains; selected: Domains[number] | undefined; selectedId: string; setSelectedId: (value: string) => void; notes: string; setNotes: (value: string) => void; request: () => void }) {
  if (!selected) return <EmptyPanel title="No sending domain" description="Connect and verify a domain before requesting a dedicated IP." />
  return <section className="rounded-xl border bg-card p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-sm font-semibold">Dedicated IP for {selected.domain}</h3><p className="mt-1 text-xs text-muted-foreground">Request a dedicated sending IP for higher-volume sending needs.</p></div><DomainSelector domains={domains} value={selectedId} onChange={setSelectedId} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><HealthDetail label="Request status" value={<StatusPill status={selected.dedicatedIp.status} />} /><HealthDetail label="Assigned IP" value={selected.dedicatedIp.ipAddress || "Not assigned"} /></div><div className="mt-4 space-y-2"><Label htmlFor="dedicated-notes" className="text-xs">Expected volume and notes</Label><Textarea id="dedicated-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="text-sm" placeholder="Share expected monthly email volume or sending requirements." /></div><Button size="sm" className="mt-4" onClick={request} disabled={selected.dedicatedIp.status === "requested"}>{selected.dedicatedIp.status === "requested" ? "Request submitted" : "Request dedicated IP"}</Button></section>
}
