import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/services/api"
import { toast } from "sonner"
import { AlertCircle, ArrowRight, Building2, Check, CheckCircle2, Copy, Eye, EyeOff, FileText, KeyRound, MessageCircle, Phone, RefreshCw, Search, ShieldCheck, Smartphone, Trash2, Wifi } from "lucide-react"

type PhoneAsset = { metaId: string; displayPhoneNumber: string; verifiedName: string; qualityRating?: string; codeVerificationStatus?: string; platformType?: string }
type TemplateAsset = { metaId: string; name: string; language: string; category: string; status: string; components?: Array<{ type: string; text?: string }> }
type WabaAsset = { metaId: string; name: string; businessId?: string; businessName?: string; currency?: string; timezoneId?: string; phones: PhoneAsset[]; templates: TemplateAsset[] }
type Connection = { configured: boolean; status?: string; metaUserName?: string; graphVersion?: string; lastSyncAt?: string; lastSyncError?: string; accounts: WabaAsset[] }

const emptyConnection: Connection = { configured: false, accounts: [] }
const statusStyle = (status?: string) => status === "APPROVED" || status === "GREEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : status === "REJECTED" || status === "RED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
const formatSyncTime = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not synced yet"

export default function WhatsAppCampaigns() {
  const [connection, setConnection] = useState<Connection>(emptyConnection)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [token, setToken] = useState("")
  const [graphVersion, setGraphVersion] = useState("v23.0")
  const [businessIds, setBusinessIds] = useState("")
  const [wabaIds, setWabaIds] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [templateQuery, setTemplateQuery] = useState("")
  const [templateStatus, setTemplateStatus] = useState("all")

  const loadConnection = async () => {
    try {
      const response = await api.get("/whatsapp/connection")
      setConnection(response.data.data)
      if (response.data.data.accounts?.length) setSelectedAccountId((current) => current || response.data.data.accounts[0].metaId)
    } catch (error: any) { toast.error(error.response?.data?.message || "Could not load WhatsApp settings") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadConnection() }, [])
  const selectedAccount = connection.accounts.find((account) => account.metaId === selectedAccountId) || connection.accounts[0]
  const allPhones = connection.accounts.flatMap((account) => account.phones)
  const allTemplates = connection.accounts.flatMap((account) => account.templates)
  const approvedTemplates = allTemplates.filter((template) => template.status === "APPROVED").length
  const filteredTemplates = useMemo(() => (selectedAccount?.templates || []).filter((template) => {
    const matchesQuery = `${template.name} ${template.language} ${template.category}`.toLowerCase().includes(templateQuery.toLowerCase())
    return matchesQuery && (templateStatus === "all" || template.status === templateStatus)
  }), [selectedAccount, templateQuery, templateStatus])

  const connect = async () => {
    if (!connection.configured && !token.trim()) return toast.error("Enter your Meta system-user token")
    setWorking(true)
    try {
      const response = await api.post("/whatsapp/connection", { accessToken: token.trim() || undefined, graphVersion, businessIds, wabaIds })
      setConnection(response.data.data)
      setSelectedAccountId(response.data.data.accounts?.[0]?.metaId || "")
      setToken(""); setBusinessIds(""); setWabaIds(""); setConnectOpen(false)
      toast.success(response.data.message)
    } catch (error: any) { toast.error(error.response?.data?.message || "Meta connection failed") }
    finally { setWorking(false) }
  }

  const sync = async () => {
    setWorking(true)
    try { const response = await api.post("/whatsapp/sync"); setConnection(response.data.data); toast.success(response.data.message) }
    catch (error: any) { toast.error(error.response?.data?.message || "Sync failed") }
    finally { setWorking(false) }
  }

  const disconnect = async () => {
    if (!window.confirm("Remove this Meta connection and all synced WhatsApp assets from CRM?")) return
    setWorking(true)
    try { await api.delete("/whatsapp/connection"); setConnection(emptyConnection); setSelectedAccountId(""); toast.success("WhatsApp disconnected") }
    catch (error: any) { toast.error(error.response?.data?.message || "Could not disconnect") }
    finally { setWorking(false) }
  }

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-emerald-600" /></div>

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-10">
      <PageHeader title={<span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm"><MessageCircle className="h-6 w-6" /></span>WhatsApp Marketing</span>} description="Connect Meta, manage numbers and keep every message template in one place.">
        {connection.configured ? <Button variant="outline" onClick={sync} disabled={working}><RefreshCw className={`mr-2 h-4 w-4 ${working ? "animate-spin" : ""}`} />Sync Meta</Button> : <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConnectOpen(true)}><Wifi className="mr-2 h-4 w-4" />Connect WhatsApp</Button>}
      </PageHeader>

      {!connection.configured ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50 via-background to-background shadow-sm">
            <CardContent className="grid min-h-[390px] gap-8 p-8 lg:grid-cols-[1fr_340px] lg:items-center lg:p-12">
              <div><Badge className="mb-5 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">WhatsApp Business Platform</Badge><h2 className="max-w-xl text-3xl font-bold tracking-tight lg:text-4xl">Bring every WhatsApp asset into your CRM.</h2><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Add your Meta system-user token once. We’ll securely discover your businesses, WABAs, phone number IDs and message templates.</p><Button size="lg" className="mt-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => setConnectOpen(true)}>Start Meta setup<ArrowRight className="ml-2 h-4 w-4" /></Button><div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Token stays server-side</span><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-600" />One-click resync</span></div></div>
              <div className="rounded-2xl border bg-background/90 p-5 shadow-lg"><div className="flex items-center justify-between border-b pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100"><Smartphone className="h-5 w-5 text-emerald-700" /></span><div><p className="text-sm font-semibold">Meta Cloud API</p><p className="text-xs text-muted-foreground">Ready to connect</p></div></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /></div>{[[Building2,"Business accounts"],[Phone,"Phone number IDs"],[FileText,"Message templates"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Building2; return <div key={label as string} className="flex items-center gap-3 border-b py-4 last:border-0"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><ItemIcon className="h-4 w-4" /></span><span className="flex-1 text-sm font-medium">{label as string}</span><Check className="h-4 w-4 text-emerald-600" /></div>})}</div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg">Before you connect</CardTitle><CardDescription>Your system user needs these Meta permissions.</CardDescription></CardHeader><CardContent className="space-y-4">{["business_management","whatsapp_business_management","whatsapp_business_messaging"].map((permission) => <div className="flex gap-3" key={permission}><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-mono text-sm font-medium">{permission}</p><p className="mt-1 text-xs text-muted-foreground">Required to discover and manage WhatsApp assets.</p></div></div>)}<div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>Use a permanent system-user token, not a short-lived personal access token.</p></div></div></CardContent></Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${connection.status === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}><Wifi className="h-5 w-5" /></span><div><div className="flex items-center gap-2"><p className="font-semibold">Meta connected</p><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge></div><p className="text-sm text-muted-foreground">{connection.metaUserName || "System user"} · Graph API {connection.graphVersion} · Synced {formatSyncTime(connection.lastSyncAt)}</p></div></div><Select value={selectedAccount?.metaId} onValueChange={setSelectedAccountId}><SelectTrigger className="w-full md:w-[320px]"><SelectValue placeholder="Choose WhatsApp account" /></SelectTrigger><SelectContent>{connection.accounts.map((account) => <SelectItem value={account.metaId} key={account.metaId}>{account.name || account.metaId}</SelectItem>)}</SelectContent></Select></div>
          {connection.lastSyncError && <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-5 w-5" />{connection.lastSyncError}</div>}
          {!connection.accounts.length && <div className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Meta returned zero assigned WhatsApp accounts</p><p className="mt-1 text-sm">Assign both WABAs to this system user in Meta Business Settings, or reconnect with your Business Portfolio ID / WABA IDs.</p></div></div><Button className="shrink-0 bg-amber-900 text-white hover:bg-amber-800" onClick={() => setConnectOpen(true)}>Add account IDs</Button></div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[Building2,"WhatsApp accounts",connection.accounts.length,"Synced from Meta"],[Phone,"Phone numbers",allPhones.length,"Cloud API senders"],[FileText,"Templates",allTemplates.length,"Across all accounts"],[CheckCircle2,"Approved",approvedTemplates,`${allTemplates.length ? Math.round(approvedTemplates / allTemplates.length * 100) : 0}% ready to send`]].map(([Icon,label,value,detail]) => { const StatIcon = Icon as typeof Building2; return <Card key={label as string}><CardContent className="flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><StatIcon className="h-5 w-5" /></span><div><p className="text-2xl font-bold">{value as number}</p><p className="text-sm font-medium">{label as string}</p><p className="text-xs text-muted-foreground">{detail as string}</p></div></CardContent></Card>})}</div>
          <Tabs defaultValue="numbers" className="space-y-4"><TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0"><TabsTrigger value="numbers" className="border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none">Phone numbers</TabsTrigger><TabsTrigger value="templates" className="border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none">Templates</TabsTrigger><TabsTrigger value="settings" className="border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none">Settings</TabsTrigger></TabsList>
            <TabsContent value="numbers"><Card><CardHeader><CardTitle className="text-lg">Phone numbers</CardTitle><CardDescription>{selectedAccount?.name} · WABA ID {selectedAccount?.metaId}</CardDescription></CardHeader><CardContent>{selectedAccount?.phones.length ? <div className="grid gap-4 lg:grid-cols-2">{selectedAccount.phones.map((phone) => <div className="rounded-xl border p-5" key={phone.metaId}><div className="flex items-start justify-between"><div className="flex gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Phone className="h-5 w-5" /></span><div><p className="font-semibold">{phone.verifiedName || "WhatsApp number"}</p><p className="text-lg font-medium">{phone.displayPhoneNumber || "—"}</p></div></div><Badge variant="outline" className={statusStyle(phone.qualityRating)}>{phone.qualityRating || "UNKNOWN"}</Badge></div><div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm"><div><p className="text-xs text-muted-foreground">Phone number ID</p><p className="mt-1 truncate font-mono text-xs">{phone.metaId}</p></div><div><p className="text-xs text-muted-foreground">Verification</p><p className="mt-1 text-xs font-medium">{phone.codeVerificationStatus || "—"}</p></div><div><p className="text-xs text-muted-foreground">Platform</p><p className="mt-1 text-xs font-medium">{phone.platformType || "Cloud API"}</p></div><div><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Connected</p></div></div></div>)}</div> : <EmptyRows icon={Phone} title="No phone numbers found" detail="Assign a phone number to this WhatsApp Business Account in Meta." />}</CardContent></Card></TabsContent>
            <TabsContent value="templates"><Card><CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="text-lg">Message templates</CardTitle><CardDescription>Synced from {selectedAccount?.name}</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Search templates" className="pl-9 sm:w-64" /></div><Select value={templateStatus} onValueChange={setTemplateStatus}><SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select></div></CardHeader><CardContent>{filteredTemplates.length ? <div className="overflow-hidden rounded-lg border"><div className="hidden grid-cols-[1.5fr_.7fr_.7fr_.7fr_40px] gap-4 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid"><span>Name</span><span>Category</span><span>Language</span><span>Status</span><span /></div>{filteredTemplates.map((template) => <div className="grid gap-3 border-t p-4 first:border-t-0 md:grid-cols-[1.5fr_.7fr_.7fr_.7fr_40px] md:items-center" key={template.metaId}><div><p className="font-medium">{template.name}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{template.components?.find((component) => component.type === "BODY")?.text || `Template ID ${template.metaId}`}</p></div><span className="text-sm">{template.category}</span><span className="text-sm">{template.language}</span><Badge variant="outline" className={`w-fit ${statusStyle(template.status)}`}>{template.status}</Badge><Button variant="ghost" size="icon" title="Copy template name" onClick={() => { navigator.clipboard.writeText(template.name); toast.success("Template name copied") }}><Copy className="h-4 w-4" /></Button></div>)}</div> : <EmptyRows icon={FileText} title="No templates match" detail="Sync Meta or adjust your template filters." />}</CardContent></Card></TabsContent>
            <TabsContent value="settings"><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-lg">Meta connection</CardTitle><CardDescription>Connection and sync details for this CRM user.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><SettingRow label="System user" value={connection.metaUserName || "—"} /><SettingRow label="Graph API version" value={connection.graphVersion || "—"} /><SettingRow label="Last successful sync" value={formatSyncTime(connection.lastSyncAt)} /><SettingRow label="WhatsApp Business Account" value={selectedAccount?.metaId || "—"} mono /></CardContent></Card><Card className="border-red-100"><CardHeader><CardTitle className="text-lg">Connection controls</CardTitle><CardDescription>Resync assets or replace the current system-user token.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button variant="outline" onClick={sync} disabled={working}><RefreshCw className="mr-2 h-4 w-4" />Sync now</Button><Button variant="outline" onClick={() => setConnectOpen(true)}><KeyRound className="mr-2 h-4 w-4" />Replace token</Button><Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={disconnect} disabled={working}><Trash2 className="mr-2 h-4 w-4" />Disconnect</Button></CardContent></Card></div></TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><KeyRound className="h-4 w-4" /></span>{connection.configured ? "Reconnect Meta account" : "Connect Meta WhatsApp"}</DialogTitle><DialogDescription>The token is sent directly to your CRM server and is never returned to the browser.</DialogDescription></DialogHeader><div className="space-y-5 py-2"><div className="space-y-2"><Label htmlFor="meta-token">System-user access token</Label><div className="relative"><Input id="meta-token" type={showToken ? "text" : "password"} value={token} onChange={(event) => setToken(event.target.value)} placeholder="EAAB..." className="pr-10 font-mono" autoComplete="off" /><button type="button" aria-label={showToken ? "Hide token" : "Show token"} onClick={() => setShowToken(!showToken)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="text-xs text-muted-foreground">Create it in Meta Business Settings → Users → System users.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="business-ids">Business Portfolio ID(s)</Label><Input id="business-ids" value={businessIds} onChange={(event) => setBusinessIds(event.target.value)} placeholder="1234567890" className="font-mono" /><p className="text-xs text-muted-foreground">Comma-separated if there are multiple.</p></div><div className="space-y-2"><Label htmlFor="waba-ids">WABA ID(s)</Label><Input id="waba-ids" value={wabaIds} onChange={(event) => setWabaIds(event.target.value)} placeholder="9876543210" className="font-mono" /><p className="text-xs text-muted-foreground">Optional direct account fallback.</p></div></div><div className="space-y-2"><Label>Graph API version</Label><Select value={graphVersion} onValueChange={setGraphVersion}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="v23.0">v23.0 (recommended)</SelectItem><SelectItem value="v22.0">v22.0</SelectItem><SelectItem value="v21.0">v21.0</SelectItem></SelectContent></Select></div><div className="rounded-lg border bg-muted/40 p-4"><p className="mb-3 text-sm font-medium">What will be synced</p><div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Business accounts & WABAs</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Phone numbers and IDs</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Template content & status</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Quality and verification</span></div></div></div><DialogFooter><Button variant="outline" onClick={() => setConnectOpen(false)} disabled={working}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={connect} disabled={working}>{working ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}{working ? "Connecting & syncing…" : "Connect & sync"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}

function EmptyRows({ icon: Icon, title, detail }: { icon: typeof Phone; title: string; detail: string }) { return <div className="flex min-h-56 flex-col items-center justify-center text-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Icon className="h-5 w-5 text-muted-foreground" /></span><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div> }
function SettingRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className={`max-w-[60%] text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span></div> }
