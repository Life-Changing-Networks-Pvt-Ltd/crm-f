import { useEffect, useMemo, useState } from "react"
import { FileText, Loader2, Mail, MessageSquare, Search, Share2 } from "lucide-react"
import Swal from "sweetalert2"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/services/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { can } from "@/lib/accessControl"

interface Option {
  _id: string
  name: string
  email?: string
  level?: string
  role?: string
  status?: string
}

interface ResourceAccess {
  _id: string
  visibility: "restricted" | "company"
  roleIds: Option[]
  teamIds: Option[]
  userIds: Option[]
  actions: Array<"use" | "edit" | "share">
}

interface TemplateResource {
  resourceType: "email_template" | "whatsapp_template"
  resourceId: string
  name: string
  status?: string
  category?: string
  subject?: string
  language?: string
  updatedAt?: string
  access: ResourceAccess | null
}

const emptyShareForm = {
  visibility: "restricted" as "restricted" | "company",
  roleIds: [] as string[],
  teamIds: [] as string[],
  userIds: [] as string[],
  actions: ["use"] as Array<"use" | "edit" | "share">,
}

const ids = (values?: Option[]) => (values || []).map((value) => value._id)

export default function TemplateAccess() {
  const user = useSelector((state: RootState) => state.auth.user)
  const canManageTemplate = (template: TemplateResource) => (
    can(user, "admin.template_access.manage")
    || (template.resourceType === "email_template" && can(user, "email.templates.share"))
    || (template.resourceType === "whatsapp_template" && can(user, "whatsapp.templates.share"))
  )
  const [templates, setTemplates] = useState<TemplateResource[]>([])
  const [roles, setRoles] = useState<Option[]>([])
  const [teams, setTeams] = useState<Option[]>([])
  const [users, setUsers] = useState<Option[]>([])
  const [channel, setChannel] = useState<"all" | "email_template" | "whatsapp_template">("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<TemplateResource | null>(null)
  const [shareForm, setShareForm] = useState(emptyShareForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    try {
      setIsLoading(true)
      const [templateResponse, roleResponse, teamResponse, userResponse] = await Promise.all([
        api.get("/template-access"),
        api.get("/roles"),
        api.get("/teams", { params: { status: "active" } }),
        api.get("/users/options", { params: { purpose: "meeting" } }),
      ])
      setTemplates(templateResponse.data.data || [])
      setRoles(roleResponse.data.data || [])
      setTeams(teamResponse.data.data || [])
      setUsers(userResponse.data.data || [])
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Failed to load template access", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return templates.filter((template) => (
      (channel === "all" || template.resourceType === channel)
      && (!query || `${template.name} ${template.subject || ""} ${template.category || ""}`
        .toLowerCase()
        .includes(query))
    ))
  }, [templates, channel, search])

  const openShare = (template: TemplateResource) => {
    setSelected(template)
    setShareForm(template.access ? {
      visibility: template.access.visibility,
      roleIds: ids(template.access.roleIds),
      teamIds: ids(template.access.teamIds),
      userIds: ids(template.access.userIds),
      actions: template.access.actions?.length ? template.access.actions : ["use"],
    } : emptyShareForm)
  }

  const toggleId = (
    field: "roleIds" | "teamIds" | "userIds",
    id: string,
  ) => {
    setShareForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((value) => value !== id)
        : [...current[field], id],
    }))
  }

  const toggleAction = (action: "use" | "edit" | "share") => {
    if (action === "use") return
    setShareForm((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((value) => value !== action)
        : [...current.actions, action],
    }))
  }

  const save = async () => {
    if (!selected) return
    try {
      setIsSaving(true)
      await api.put(
        `/template-access/${selected.resourceType}/${selected.resourceId}`,
        shareForm,
      )
      await load()
      setSelected(null)
      await Swal.fire({
        icon: "success",
        title: "Template access updated",
        timer: 1600,
        showConfirmButton: false,
      })
    } catch (error: any) {
      Swal.fire("Unable to save access", error.response?.data?.message || "Server error occurred", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = (access: ResourceAccess | null) => {
    if (!access) return 0
    if (access.visibility === "company") return users.length
    return access.userIds.length + access.roleIds.length + access.teamIds.length
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Template Access"
        description="Share approved Email and WhatsApp templates without giving employees full marketing access."
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
          />
        </div>
        <Select value={channel} onValueChange={(value: typeof channel) => setChannel(value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email_template">Email templates</SelectItem>
            <SelectItem value="whatsapp_template">WhatsApp templates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border py-20">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-14 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No templates found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create templates in Email or WhatsApp Marketing, then share them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((template) => {
            const isEmail = template.resourceType === "email_template"
            const ChannelIcon = isEmail ? Mail : MessageSquare
            return (
              <article key={`${template.resourceType}:${template.resourceId}`} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isEmail ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      <ChannelIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{template.name}</h3>
                        <Badge variant="outline">{template.status || "unknown"}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {template.subject || template.category || template.language || "Reusable message template"}
                      </p>
                    </div>
                  </div>
                  {canManageTemplate(template) && <Button size="sm" onClick={() => openShare(template)} className="shrink-0 gap-2">
                    <Share2 className="h-4 w-4" /> Manage
                  </Button>}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
                  {template.access ? (
                    <>
                      <Badge variant={template.access.visibility === "company" ? "default" : "secondary"}>
                        {template.access.visibility === "company" ? "Entire company" : "Restricted"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {selectedCount(template.access)} access assignment{selectedCount(template.access) === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="capitalize text-muted-foreground">{template.access.actions.join(", ")}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Admin only — not shared yet</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Share {selected?.name}</DialogTitle>
            <DialogDescription>
              Employees will only see this template if their role also includes “Use shared templates”.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-3">
            <div className="grid gap-2">
              <Label>Visibility</Label>
              <Select
                value={shareForm.visibility}
                onValueChange={(visibility: "restricted" | "company") => setShareForm({ ...shareForm, visibility })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted">Selected roles, teams and users</SelectItem>
                  <SelectItem value="company">Entire company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Allowed actions</Label>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(["use", "edit", "share"] as const).map((action) => (
                  <label key={action} className="flex items-center gap-3 rounded-lg border p-3 capitalize">
                    <Checkbox
                      checked={shareForm.actions.includes(action)}
                      disabled={action === "use"}
                      onCheckedChange={() => toggleAction(action)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>

            {shareForm.visibility === "restricted" && (
              <div className="grid gap-5 lg:grid-cols-3">
                <ShareOptions
                  title="Roles"
                  options={roles}
                  selectedIds={shareForm.roleIds}
                  onToggle={(id) => toggleId("roleIds", id)}
                />
                <ShareOptions
                  title="Teams"
                  options={teams}
                  selectedIds={shareForm.teamIds}
                  onToggle={(id) => toggleId("teamIds", id)}
                />
                <ShareOptions
                  title="Individual Users"
                  options={users}
                  selectedIds={shareForm.userIds}
                  onToggle={(id) => toggleId("userIds", id)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={save} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Sharing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShareOptions({
  title,
  options,
  selectedIds,
  onToggle,
}: {
  title: string
  options: Option[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <Label>{title}</Label>
        <Badge variant="outline">{selectedIds.length}</Badge>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border p-2">
        {options.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No options available</p>
        ) : options.map((option) => (
          <label key={option._id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-muted/50">
            <Checkbox
              checked={selectedIds.includes(option._id)}
              onCheckedChange={() => onToggle(option._id)}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{option.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {option.email || option.level || option.role || option.status}
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
