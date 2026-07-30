import { useEffect, useMemo, useState } from "react"
import { CheckSquare, Loader2, Save, Shield, Users } from "lucide-react"
import Swal from "sweetalert2"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

interface PermissionDefinition {
  key: string
  label: string
}

interface PermissionGroup {
  id: string
  label: string
  supportsScope?: boolean
  permissions: PermissionDefinition[]
}

interface PermissionCatalog {
  groups: PermissionGroup[]
  dataScopes: string[]
  version: number
}

interface RoleData {
  _id: string
  name: string
  level: string
  usersCount: number
  grants?: string[]
  effectiveGrants?: string[]
  dataScopes?: Record<string, string>
  status?: "active" | "inactive"
}

const scopeLabels: Record<string, string> = {
  none: "No data",
  own: "Own records",
  team: "Team records",
  hierarchy: "Reporting hierarchy",
  all: "All company records",
}

export default function PageAccess() {
  const user = useSelector((state: RootState) => state.auth.user)
  const canManage = can(user, "admin.roles.manage")
  const [roles, setRoles] = useState<RoleData[]>([])
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [grants, setGrants] = useState<string[]>([])
  const [dataScopes, setDataScopes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const selectedRole = useMemo(
    () => roles.find((role) => role._id === selectedRoleId),
    [roles, selectedRoleId],
  )

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const [rolesResponse, catalogResponse] = await Promise.all([
          api.get("/roles"),
          api.get("/roles/catalog"),
        ])
        setRoles(rolesResponse.data.data || [])
        setCatalog(catalogResponse.data.data)
      } catch (error: any) {
        Swal.fire("Error", error.response?.data?.message || "Failed to load access controls", "error")
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  const selectRole = (roleId: string) => {
    const role = roles.find((item) => item._id === roleId)
    setSelectedRoleId(roleId)
    setGrants(role?.effectiveGrants || role?.grants || [])
    setDataScopes(role?.dataScopes || {})
  }

  const toggleGrant = (key: string) => {
    setGrants((current) => (
      current.includes(key)
        ? current.filter((grant) => grant !== key)
        : [...current, key]
    ))
  }

  const toggleGroup = (group: PermissionGroup) => {
    const keys = group.permissions.map((permission) => permission.key)
    const allSelected = keys.every((key) => grants.includes(key))
    setGrants((current) => (
      allSelected
        ? current.filter((grant) => !keys.includes(grant))
        : Array.from(new Set([...current, ...keys]))
    ))
  }

  const save = async () => {
    if (!selectedRoleId) return
    try {
      setIsSaving(true)
      const response = await api.put(`/roles/${selectedRoleId}/access`, {
        grants,
        dataScopes,
      })
      const saved = response.data.data as RoleData
      setRoles((current) => current.map((role) => (
        role._id === selectedRoleId
          ? { ...role, ...saved, effectiveGrants: saved.grants || [] }
          : role
      )))
      await Swal.fire({
        icon: "success",
        title: "Access updated",
        text: "Role permissions and data visibility have been saved.",
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Failed to save access", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Access Control"
          description="Control what each role can do and which company records it can access."
        />
        {selectedRole && canManage && (
          <Button onClick={save} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Access
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
        Page visibility and backend actions now use the same permission set. Data scope controls whether the role sees its own, team, hierarchy, or all company records.
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            Select role
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role._id}
                  type="button"
                  onClick={() => selectRole(role._id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedRoleId === role._id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{role.name}</span>
                    {role.status === "inactive" && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{role.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {role.usersCount || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Admin users always retain unrestricted access, even if no role is selected here.
          </p>
        </aside>

        <main>
          {!selectedRole || !catalog ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-14 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-semibold">Select a role to configure</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Permissions and data scope will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {catalog.groups.map((group) => {
                const keys = group.permissions.map((permission) => permission.key)
                const allSelected = keys.every((key) => grants.includes(key))
                return (
                  <section key={group.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <header className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{group.label}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {group.permissions.filter((permission) => grants.includes(permission.key)).length} of {group.permissions.length} actions allowed
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.supportsScope && (
                          <Select
                            disabled={!canManage}
                            value={dataScopes[group.id] || "own"}
                            onValueChange={(value) => setDataScopes((current) => ({
                              ...current,
                              [group.id]: value,
                            }))}
                          >
                            <SelectTrigger className="h-9 w-48 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {catalog.dataScopes.map((scope) => (
                                <SelectItem key={scope} value={scope}>
                                  {scopeLabels[scope] || scope}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {canManage && <Button variant="ghost" size="sm" onClick={() => toggleGroup(group)} className="gap-1.5">
                          <CheckSquare className="h-4 w-4" />
                          {allSelected ? "Clear" : "Allow all"}
                        </Button>}
                      </div>
                    </header>
                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-start gap-3 rounded-lg border bg-background p-3"
                        >
                          <Checkbox
                            disabled={!canManage}
                            id={`permission-${permission.key}`}
                            checked={grants.includes(permission.key)}
                            onCheckedChange={() => toggleGrant(permission.key)}
                          />
                          <Label htmlFor={`permission-${permission.key}`} className="cursor-pointer">
                            <span className="block font-medium">{permission.label}</span>
                            <span className="mt-1 block font-mono text-[11px] font-normal text-muted-foreground">
                              {permission.key}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
