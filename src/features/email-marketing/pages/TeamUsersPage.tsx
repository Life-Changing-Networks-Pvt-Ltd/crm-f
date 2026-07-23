import { useMemo, useState, type FormEvent } from "react"
import { Check, KeyRound, Pencil, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { EmptyPanel, MetricCard, ModulePage, PageContainer, PageHeading, SearchField, StatusPill, formatDate } from "../components/PageElements"
import type { TeamPermission, TeamUserInput } from "../types"

const permissions: Array<{ value: TeamPermission; label: string; description: string; required?: boolean }> = [
  { value: "view_dashboard", label: "Dashboard", description: "Open the email marketing overview.", required: true },
  { value: "manage_campaigns", label: "Campaigns", description: "Create, edit, schedule, and manage campaigns." },
  { value: "edit_content", label: "Templates", description: "Build and edit reusable email content." },
  { value: "manage_audience", label: "Audience", description: "Manage subscribers, segments, and suppressions." },
  { value: "manage_automations", label: "Automations", description: "Build and activate lifecycle workflows." },
  { value: "view_analytics", label: "Analytics", description: "View analytics and deliverability data." },
  { value: "view_reports", label: "Reports", description: "Open and export performance reports." },
  { value: "manage_sending_domains", label: "Sending domains", description: "Manage DNS and domain health." },
  { value: "view_billing", label: "Billing", description: "View credit balances and billing history." },
  { value: "manage_team_access", label: "Team access", description: "Grant or remove Email Marketing access." },
  { value: "manage_settings", label: "Settings", description: "Manage billing profile and workspace settings." },
]
const emptyForm: TeamUserInput = { name: "", email: "", status: "active", permissions: ["view_dashboard"] }

export function TeamUsersPage() {
  const { teamUsers, createTeamUser, updateTeamUser, deleteTeamUser } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TeamUserInput>(emptyForm)
  const filtered = useMemo(() => teamUsers.filter((item) => !query || `${item.name} ${item.email} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [teamUsers, query])
  const launch = (id?: string) => { const user = teamUsers.find((item) => item.id === id); setEditingId(user?.id || null); setForm(user ? { name: user.name, email: user.email, status: user.status, permissions: user.permissions } : emptyForm); setOpen(true) }
  const toggle = (permission: TeamPermission) => { if (permission === "view_dashboard") return; setForm((current) => ({ ...current, permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission] })) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes("@")) return toast.error("Enter a name and valid email.")
    if (teamUsers.some((item) => item.email === form.email.trim().toLowerCase() && item.id !== editingId)) return toast.error("This email already has access.")
    try {
      if (editingId) await updateTeamUser(editingId, form)
      else await createTeamUser(form)
      setOpen(false)
      toast.success(editingId ? "Access updated" : "CRM user access granted")
    } catch {
      toast.error("Access could not be saved. The email must belong to this CRM workspace.")
    }
  }
  return <ModulePage><PageContainer><PageHeading title="Team permissions" description="Invite collaborators and control which email marketing sections they may access." actions={<Button onClick={() => launch()}><UserPlus className="mr-2 h-4 w-4" />Invite user</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Team users" value={teamUsers.length} helper="Invited collaborators" icon={<Users className="h-5 w-5" />} /><MetricCard label="Active" value={teamUsers.filter((item) => item.status === "active").length} helper="Can access assigned pages" icon={<ShieldCheck className="h-5 w-5" />} tone="success" /><MetricCard label="Inactive" value={teamUsers.filter((item) => item.status === "inactive").length} helper="Access currently disabled" icon={<KeyRound className="h-5 w-5" />} tone="muted" /><MetricCard label="Settings access" value={teamUsers.filter((item) => item.permissions.includes("manage_settings")).length} helper="Elevated workspace access" icon={<Check className="h-5 w-5" />} tone="warning" /></section>
    <section className="rounded-2xl border bg-card"><div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">Team access</h3><p className="mt-1 text-xs text-muted-foreground">Manage account status and allowed sections.</p></div><SearchField value={query} onChange={setQuery} placeholder="Search team users..." className="md:w-80" /></div>{filtered.length ? <div className="divide-y">{filtered.map((user) => <div key={user.id} className="grid gap-3 p-5 text-sm lg:grid-cols-[1.2fr_.6fr_1.5fr_.7fr_auto]"><div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div><StatusPill status={user.status} /><div><p className="line-clamp-2">{permissions.filter((item) => user.permissions.includes(item.value)).map((item) => item.label).join(", ")}</p><p className="text-xs text-muted-foreground">{user.permissions.length} permissions</p></div><div><p>{formatDate(user.invitedAt)}</p><p className="text-xs text-muted-foreground">Invited</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => launch(user.id)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (window.confirm(`Remove ${user.name}'s access?`)) deleteTeamUser(user.id) }}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <div className="p-5"><EmptyPanel title="No team users yet" description="Invite your first collaborator and assign the pages they can access." action={<Button onClick={() => launch()}><UserPlus className="mr-2 h-4 w-4" />Invite user</Button>} /></div>}</section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{editingId ? "Edit team access" : "Invite a team user"}</DialogTitle><DialogDescription>Choose account details and the sections this collaborator can open.</DialogDescription></DialogHeader><form onSubmit={submit}><div className="mt-4 grid gap-4 md:grid-cols-3"><div><Label>Name</Label><Input className="mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Email</Label><Input className="mt-2" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><Label>Status</Label><div className="mt-2 flex gap-2">{(["active", "inactive"] as const).map((status) => <Button key={status} type="button" variant={form.status === status ? "default" : "outline"} className="flex-1 capitalize" onClick={() => setForm({ ...form, status })}>{status}</Button>)}</div></div></div><div className="mt-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Allowed pages</h3><p className="text-xs text-muted-foreground">Dashboard is required for every user.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setForm((current) => ({ ...current, permissions: current.permissions.length === permissions.length ? ["view_dashboard"] : permissions.map((item) => item.value) }))}>Select all</Button></div><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{permissions.map((permission) => { const chosen = form.permissions.includes(permission.value); return <button key={permission.value} type="button" disabled={permission.required} onClick={() => toggle(permission.value)} className={`rounded-xl border p-4 text-left transition ${chosen ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}><div className="flex justify-between gap-3"><p className="font-medium">{permission.label}</p><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${chosen ? "border-primary bg-primary text-primary-foreground" : ""}`}>{chosen ? <Check className="h-3 w-3" /> : null}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{permission.description}</p></button> })}</div></div><div className="mt-6 flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? "Update access" : "Save local invite"}</Button></div></form></DialogContent></Dialog>
    <p className="text-xs text-muted-foreground">Permissions are enforced by the CRM backend. New access can only be granted to an existing CRM user in this workspace.</p>
  </PageContainer></ModulePage>
}
