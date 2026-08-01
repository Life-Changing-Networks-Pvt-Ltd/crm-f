import { useEffect, useRef, useState } from "react"
import { Loader2, Pencil, Plus, Users2, UserRound, XCircle } from "lucide-react"
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
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea"
import api from "@/services/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { can } from "@/lib/accessControl"
import { useRolesQuery, useTeamsQuery, useUsersQuery } from "@/hooks/useCrmReferenceData"

interface UserOption {
  _id: string
  name: string
  email: string
  role: string
  status?: string
}

interface RoleOption {
  _id: string
  name: string
  level: string
}

interface Team {
  _id: string
  name: string
  description?: string
  manager?: UserOption | null
  members: UserOption[]
  defaultRole?: RoleOption | null
  status: "active" | "inactive"
}

const emptyForm = {
  name: "",
  description: "",
  managerId: "",
  memberIds: [] as string[],
  defaultRoleId: "",
  status: "active" as "active" | "inactive",
}

export default function Teams() {
  const user = useSelector((state: RootState) => state.auth.user)
  const canManage = can(user, "admin.teams.manage")
  const teamsQuery = useTeamsQuery<Team[]>("all")
  const usersQuery = useUsersQuery<UserOption[]>("team")
  const rolesQuery = useRolesQuery<RoleOption[]>()
  const teams = teamsQuery.data || []
  const users = usersQuery.data || []
  const roles = rolesQuery.data || []
  const isLoading = teamsQuery.isLoading || usersQuery.isLoading || rolesQuery.isLoading
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [form, setForm] = useState(emptyForm)
  const dialogContentRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    await Promise.all([teamsQuery.refetch(), usersQuery.refetch(), rolesQuery.refetch()])
  }

  useEffect(() => {
    const error = teamsQuery.error || usersQuery.error || rolesQuery.error
    if (error) {
      const requestError = error as any
      void Swal.fire("Error", requestError.response?.data?.message || "Failed to load teams", "error")
    }
  }, [rolesQuery.error, teamsQuery.error, usersQuery.error])

  const openCreate = () => {
    setEditingTeam(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditingTeam(team)
    setForm({
      name: team.name,
      description: team.description || "",
      managerId: team.manager?._id || "",
      memberIds: team.members?.map((member) => member._id) || [],
      defaultRoleId: team.defaultRole?._id || "",
      status: team.status,
    })
    setIsDialogOpen(true)
  }

  const toggleMember = (userId: string) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(userId)
        ? current.memberIds.filter((id) => id !== userId)
        : [...current.memberIds, userId],
    }))
  }

  const save = async () => {
    if (!form.name.trim()) {
      await Swal.fire({
        target: dialogContentRef.current || document.body,
        title: "Team name required",
        text: "Please enter a team name.",
        icon: "warning",
      })
      return
    }
    try {
      setIsSaving(true)
      const payload = {
        ...form,
        managerId: form.managerId || null,
        defaultRoleId: form.defaultRoleId || null,
      }
      if (editingTeam) {
        await api.put(`/teams/${editingTeam._id}`, payload)
      } else {
        await api.post("/teams", payload)
      }
      await load()
      setIsDialogOpen(false)
      await Swal.fire({
        icon: "success",
        title: editingTeam ? "Team updated" : "Team created",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error: any) {
      await Swal.fire({
        target: dialogContentRef.current || document.body,
        title: "Unable to save team",
        text: error.response?.data?.message || "Server error occurred",
        icon: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deactivate = async (team: Team) => {
    const result = await Swal.fire({
      title: `Deactivate ${team.name}?`,
      text: "Members will be removed from this team's data scope.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Deactivate",
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/teams/${team._id}`)
      await load()
    } catch (error: any) {
      Swal.fire("Unable to deactivate", error.response?.data?.message || "Server error occurred", "error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Teams"
          description="Group employees for team-level lead visibility and template sharing."
        />
        {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogContentRef} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team" : "Create Team"}</DialogTitle>
              <DialogDescription>
                Select a manager, members, and an optional default role.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. North India Sales"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(status: "active" | "inactive") => setForm({ ...form, status })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="What this team handles..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Team Manager</Label>
                  <Select
                    value={form.managerId || "none"}
                    onValueChange={(value) => setForm({ ...form, managerId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Default Role</Label>
                  <Select
                    value={form.defaultRoleId || "none"}
                    onValueChange={(value) => setForm({ ...form, defaultRoleId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name} ({role.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <Label>Team Members</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {form.memberIds.length} employees selected
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({
                      ...form,
                      memberIds: form.memberIds.length === users.length ? [] : users.map((user) => user._id),
                    })}
                  >
                    {form.memberIds.length === users.length ? "Clear all" : "Select all"}
                  </Button>
                </div>
                <div className="grid max-h-60 gap-2 overflow-y-auto rounded-xl border p-3 sm:grid-cols-2">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={form.memberIds.includes(user._id)}
                        onCheckedChange={() => toggleMember(user._id)}
                      />
                      <span>
                        <span className="block text-sm font-medium">{user.name}</span>
                        <span className="block text-xs text-muted-foreground">{user.role} · {user.email}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTeam ? "Save Changes" : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      </div>

      {isLoading ? (
        <div className="rounded-xl border py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-dashed p-14 text-center">
          <Users2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No teams created</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a team to enable team-level lead visibility and template access.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team) => (
            <article key={team._id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      <Badge variant={team.status === "active" ? "default" : "outline"}>
                        {team.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.description || "No description"}
                    </p>
                  </div>
                </div>
                {canManage && <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(team)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {team.status === "active" && (
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deactivate(team)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>}
              </div>

              <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Manager</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    <UserRound className="h-3.5 w-3.5" />
                    {team.manager?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Members</p>
                  <p className="mt-1 text-sm font-medium">{team.members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Default Role</p>
                  <p className="mt-1 text-sm font-medium">{team.defaultRole?.name || "None"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
