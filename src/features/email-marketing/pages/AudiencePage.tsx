import { useMemo, useState, type ChangeEvent } from "react"
import { Link } from "@tanstack/react-router"
import { Download, FileUp, MoreHorizontal, Plus, RefreshCw, Trash2, UserCheck, UserMinus, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, MetricCard, ModulePage, PageContainer, PageHeading, SearchField, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import type { SubscriberInput } from "../types"

type CsvPreviewRow = Partial<SubscriberInput> & { email: string }

function parseCsv(content: string): CsvPreviewRow[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""))
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
    return {
      email: row.email || "",
      firstName: row.first_name || row.firstname || row.name || "",
      lastName: row.last_name || row.lastname || "",
      phone: row.phone || "",
      source: row.source || "CSV Import",
      tags: row.tags ? row.tags.split(/[|;]/).map((tag: string) => tag.trim()).filter(Boolean) : [],
      status: "subscribed",
      notes: "",
      blocked: false,
    } as CsvPreviewRow
  }).filter((row) => row.email)
}

export function AudiencePage() {
  const { subscribers, importSubscribers, bulkUpdateSubscribers, deleteSubscribers, updateSubscriber } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [source, setSource] = useState("all")
  const [selected, setSelected] = useState<string[]>([])
  const [actionId, setActionId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState("")
  const [csvRows, setCsvRows] = useState<CsvPreviewRow[]>([])
  const [bulkTags, setBulkTags] = useState("")

  const sources = Array.from(new Set(subscribers.map((subscriber) => subscriber.source).filter(Boolean)))
  const filtered = useMemo(() => subscribers.filter((subscriber) => {
    const haystack = `${subscriber.email} ${subscriber.firstName} ${subscriber.lastName} ${subscriber.tags.join(" ")}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase()))
      && (status === "all" || subscriber.status === status)
      && (source === "all" || subscriber.source === source)
  }), [subscribers, query, status, source])

  const allVisibleSelected = filtered.length > 0 && filtered.every((subscriber) => selected.includes(subscriber.id))
  const subscribed = subscribers.filter((subscriber) => subscriber.status === "subscribed").length
  const unsubscribed = subscribers.filter((subscriber) => subscriber.status === "unsubscribed").length
  const suppressed = subscribers.filter((subscriber) => subscriber.status === "suppressed").length

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setCsvText(content)
    setCsvRows(parseCsv(content))
  }

  const previewCsv = () => {
    const rows = parseCsv(csvText)
    setCsvRows(rows)
    if (!rows.length) toast.error("Add a CSV header and at least one valid email row.")
  }

  const runImport = async () => {
    try {
      const result = await importSubscribers(csvRows)
      toast.success(`${result.added} subscriber${result.added === 1 ? "" : "s"} imported`, { description: `${result.skipped} duplicate or invalid row(s) skipped.` })
      setImportOpen(false)
      setCsvRows([])
      setCsvText("")
    } catch {
      toast.error("Subscribers could not be imported.")
    }
  }

  const runBulkAction = async (action: "unsubscribe" | "suppress" | "reactivate") => {
    if (!selected.length) return
    const tags = bulkTags.split(",").map((tag) => tag.trim()).filter(Boolean)
    try {
      await bulkUpdateSubscribers(selected, action, tags)
      toast.success(`${selected.length} subscriber(s) updated`)
      setSelected([])
      setBulkTags("")
    } catch {
      toast.error("Subscribers could not be updated.")
    }
  }

  const exportCsv = () => {
    const headers = "email,first_name,last_name,phone,status,source,tags"
    const rows = filtered.map((subscriber) => [subscriber.email, subscriber.firstName, subscriber.lastName, subscriber.phone, subscriber.status, subscriber.source, subscriber.tags.join("|")].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "email-marketing-audience.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ModulePage>
      <PageContainer>
        <PageHeading
          title="Audience"
          description="Manage subscribers, import contacts, apply bulk actions, and keep your lists healthy."
          actions={
            <>
              <Button variant="outline" onClick={() => toast.info("CRM sync will be enabled with Backend Part 2.")}><RefreshCw className="mr-2 h-4 w-4" />Sync CRM</Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="mr-2 h-4 w-4" />Import CSV</Button>
              <Button asChild><Link to={getEmailMarketingPath("/audience/new") as never}><Plus className="mr-2 h-4 w-4" />Add subscriber</Link></Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total audience" value={subscribers.length} helper="All contact sources" icon={<Users className="h-5 w-5" />} />
          <MetricCard label="Subscribed" value={subscribed} helper="Eligible for campaigns" icon={<UserCheck className="h-5 w-5" />} tone="success" />
          <MetricCard label="Unsubscribed" value={unsubscribed} helper="Opted out recipients" icon={<UserMinus className="h-5 w-5" />} tone="warning" />
          <MetricCard label="Suppressed" value={suppressed} helper="Blocked from future sends" icon={<Trash2 className="h-5 w-5" />} tone="muted" />
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <SearchField value={query} onChange={setQuery} placeholder="Search email, name, or tag..." className="sm:max-w-sm" />
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="subscribed">Subscribed</SelectItem><SelectItem value="unsubscribed">Unsubscribed</SelectItem><SelectItem value="suppressed">Suppressed</SelectItem></SelectContent></Select>
              <Select value={source} onValueChange={setSource}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}><Download className="mr-2 h-4 w-4" />Export</Button>
          </div>

          {selected.length ? (
            <div className="flex flex-col gap-2 border-b bg-primary/5 p-3 md:flex-row md:items-center">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <Input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} placeholder="Optional tags, comma separated" className="md:ml-auto md:max-w-xs" />
              <Button size="sm" variant="outline" onClick={() => runBulkAction("reactivate")}><UserCheck className="mr-1 h-4 w-4" />Reactivate</Button>
              <Button size="sm" variant="outline" onClick={() => runBulkAction("unsubscribe")}>Unsubscribe</Button>
              <Button size="sm" variant="outline" onClick={() => runBulkAction("suppress")}>Suppress</Button>
              <Button size="sm" variant="destructive" onClick={() => { deleteSubscribers(selected); setSelected([]); toast.success("Selected subscribers deleted") }}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
            </div>
          ) : null}

          {filtered.length ? (
            <Table>
              <TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => setSelected(checked ? filtered.map((subscriber) => subscriber.id) : [])} /></TableHead><TableHead>Subscriber</TableHead><TableHead>Status</TableHead><TableHead>Source</TableHead><TableHead>Tags</TableHead><TableHead>Added</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
              <TableBody>
                {filtered.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell><Checkbox checked={selected.includes(subscriber.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, subscriber.id] : current.filter((id) => id !== subscriber.id))} /></TableCell>
                    <TableCell><Link to={getEmailMarketingPath(`/audience/${subscriber.id}`) as never} className="font-medium text-foreground hover:text-primary">{subscriber.firstName || subscriber.lastName ? `${subscriber.firstName} ${subscriber.lastName}`.trim() : subscriber.email}<span className="block text-xs font-normal text-muted-foreground">{subscriber.email}</span></Link></TableCell>
                    <TableCell><StatusPill status={subscriber.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{subscriber.source}</TableCell>
                    <TableCell><div className="flex max-w-52 flex-wrap gap-1">{subscriber.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{tag}</span>)}{subscriber.tags.length > 3 ? <span className="text-xs text-muted-foreground">+{subscriber.tags.length - 3}</span> : null}</div></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(subscriber.createdAt)}</TableCell>
                    <TableCell className="relative">
                      <Button variant="ghost" size="icon" onClick={() => setActionId(actionId === subscriber.id ? null : subscriber.id)}><MoreHorizontal className="h-4 w-4" /></Button>
                      {actionId === subscriber.id ? (
                        <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border bg-popover p-1 shadow-lg">
                          <Link to={getEmailMarketingPath(`/audience/${subscriber.id}`) as never} className="block rounded-lg px-3 py-2 text-sm hover:bg-accent">View details</Link>
                          <Link to={getEmailMarketingPath(`/audience/${subscriber.id}/edit`) as never} className="block rounded-lg px-3 py-2 text-sm hover:bg-accent">Edit subscriber</Link>
                          <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { updateSubscriber(subscriber.id, { blocked: !subscriber.blocked }); setActionId(null) }}>{subscriber.blocked ? "Unblock" : "Block"}</button>
                          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10" onClick={() => { deleteSubscribers([subscriber.id]); setActionId(null); toast.success("Subscriber deleted") }}>Delete</button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4"><EmptyPanel title={subscribers.length ? "No matching subscribers" : "Build your audience"} description={subscribers.length ? "Try changing the search or filters." : "Add a subscriber manually or import a CSV file to get started."} action={!subscribers.length ? <Button asChild><Link to={getEmailMarketingPath("/audience/new") as never}><Plus className="mr-2 h-4 w-4" />Add subscriber</Link></Button> : undefined} /></div>
          )}
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">Showing {filtered.length} of {subscribers.length} subscribers</div>
        </section>
      </PageContainer>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Import subscribers from CSV</DialogTitle><DialogDescription>Use columns: email, first_name, last_name, phone, source, and tags. Email is required.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="csv-file">Choose CSV file</Label><Input id="csv-file" type="file" accept=".csv,text/csv" className="mt-2" onChange={handleFile} /></div>
            <div><Label htmlFor="csv-content">Or paste CSV content</Label><Textarea id="csv-content" value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={7} className="mt-2 font-mono text-xs" placeholder={'email,first_name,last_name,tags\nuser@example.com,Asha,Sharma,"customer|newsletter"'} /></div>
            <Button type="button" variant="outline" onClick={previewCsv}>Preview rows</Button>
            {csvRows.length ? <div className="max-h-52 overflow-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Source</TableHead></TableRow></TableHeader><TableBody>{csvRows.slice(0, 10).map((row, index) => <TableRow key={`${row.email}-${index}`}><TableCell>{row.email}</TableCell><TableCell>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || "—"}</TableCell><TableCell>{row.source}</TableCell></TableRow>)}</TableBody></Table><p className="border-t px-4 py-2 text-xs text-muted-foreground">{csvRows.length} valid preview row(s)</p></div> : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button onClick={runImport} disabled={!csvRows.length}><FileUp className="mr-2 h-4 w-4" />Import {csvRows.length || ""}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  )
}
