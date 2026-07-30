import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { KeyRound, Loader2, Pencil, Plus, Shield, Trash2 } from "lucide-react"
import Swal from "sweetalert2"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/services/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { can } from "@/lib/accessControl"

interface Role {
  _id: string
  name: string
  level: string
  usersCount: number
  status?: "active" | "inactive"
  isSystemRole?: boolean
  grants?: string[]
  effectiveGrants?: string[]
  createdBy?: { _id: string; name: string }
}

const defaultForm = {
  name: "",
  level: "Level 4",
  status: "active" as "active" | "inactive",
}

export default function Roles() {
  const user = useSelector((state: RootState) => state.auth.user)
  const canManage = can(user, "admin.roles.manage")
  const navigate = useNavigate()
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState(defaultForm)

  const loadRoles = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/roles")
      setRoles(response.data.data || [])
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Failed to load roles", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRoles()
  }, [])

  const openCreate = () => {
    setEditingRole(null)
    setForm(defaultForm)
    setIsDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    setForm({
      name: role.name,
      level: role.level,
      status: role.status || "active",
    })
    setIsDialogOpen(true)
  }

  const saveRole = async () => {
    if (!form.name.trim()) {
      Swal.fire("Role name required", "Please enter a role name.", "warning")
      return
    }
    try {
      setIsSaving(true)
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, form)
      } else {
        await api.post("/roles", form)
      }
      await loadRoles()
      setIsDialogOpen(false)
      await Swal.fire({
        icon: "success",
        title: editingRole ? "Role updated" : "Role created",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error: any) {
      Swal.fire("Unable to save role", error.response?.data?.message || "Server error occurred", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRole = async (role: Role) => {
    const result = await Swal.fire({
      title: `Delete ${role.name}?`,
      text: "A role assigned to users cannot be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete role",
      confirmButtonColor: "#dc2626",
    })
    if (!result.isConfirmed) return

    try {
      await api.delete(`/roles/${role._id}`)
      setRoles((current) => current.filter((item) => item._id !== role._id))
      void Swal.fire("Deleted", "Role has been deleted.", "success")
    } catch (error: any) {
      void Swal.fire("Delete failed", error.response?.data?.message || "Unable to delete role", "error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Roles & Permissions"
          description="Create reusable job roles, then configure their actions and data visibility."
        />
        <div className="flex flex-wrap gap-2">
          {canManage && <Button variant="outline" className="gap-2" onClick={() => navigate({ to: "/page-access" })}>
            <KeyRound className="h-4 w-4" />
            Configure Access
          </Button>}
          {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
                <DialogDescription>
                  Define the role identity here. Detailed access is configured separately.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-3">
                <div className="grid gap-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Sales Executive"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Priority Level</Label>
                  <Select value={form.level} onValueChange={(level) => setForm({ ...form, level })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 2">Level 2 — High</SelectItem>
                      <SelectItem value="Level 3">Level 3 — Medium</SelectItem>
                      <SelectItem value="Level 4">Level 4 — Standard</SelectItem>
                      <SelectItem value="Level 5">Level 5 — Restricted</SelectItem>
                    </SelectContent>
                  </Select>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveRole} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? "Save Changes" : "Create Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Allowed Actions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No roles found. Create the first role to continue.
                </TableCell>
              </TableRow>
            ) : roles.map((role) => (
              <TableRow key={role._id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-primary" />
                    {role.name}
                    {role.isSystemRole && <Badge variant="outline">System</Badge>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{role.level}</Badge></TableCell>
                <TableCell>{role.usersCount || 0}</TableCell>
                <TableCell>{role.effectiveGrants?.length || role.grants?.length || 0}</TableCell>
                <TableCell>
                  <Badge variant={role.status === "inactive" ? "outline" : "default"}>
                    {role.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {canManage && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={role.isSystemRole}
                      onClick={() => deleteRole(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
