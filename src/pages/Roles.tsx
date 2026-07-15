import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Role {
  _id: string;
  name: string;
  level: string;
  usersCount: number;
  createdBy: {
    _id: string;
    name: string;
  };
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleLevel, setNewRoleLevel] = useState("Level 4")

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/roles')
      setRoles(res.data.data)
    } catch (error: any) {
      console.error("Failed to fetch roles:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load roles from the server.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return

    try {
      setIsSaving(true)
      const res = await api.post('/roles', {
        name: newRoleName,
        level: newRoleLevel
      })
      
      setRoles([...roles, res.data.data])
      setNewRoleName("")
      setNewRoleLevel("Level 4")
      setIsDialogOpen(false)
      
      Swal.fire({
        icon: 'success',
        title: 'Role Created',
        text: 'Role has been successfully saved to the database.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error: any) {
      console.error("Failed to create role:", error)
      Swal.fire({
        icon: 'error',
        title: 'Failed to create role',
        text: error.response?.data?.message || 'Server error occurred'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRole = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      })

      if (result.isConfirmed) {
        await api.delete(`/roles/${id}`)
        setRoles(roles.filter(role => role._id !== id))
        Swal.fire(
          'Deleted!',
          'Role has been deleted.',
          'success'
        )
      }
    } catch (error: any) {
      console.error("Failed to delete role:", error)
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.message || 'Server error occurred'
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Roles & Permissions" 
          description="Manage access levels and permissions for your team members." 
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Add a new role and assign its priority level. You can configure detailed permissions later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Senior Manager" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Priority Level</Label>
                <Select value={newRoleLevel} onValueChange={setNewRoleLevel}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level 2">Level 2 (High Priority)</SelectItem>
                    <SelectItem value="Level 3">Level 3 (Medium Priority)</SelectItem>
                    <SelectItem value="Level 4">Level 4 (Standard Priority)</SelectItem>
                    <SelectItem value="Level 5">Level 5 (Restricted Priority)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleCreateRole} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Role Name</TableHead>
              <TableHead>Priority Level</TableHead>
              <TableHead>Assigned Users</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading roles...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Shield className="h-8 w-8 opacity-20" />
                    <p>No roles found. Create one to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.level.includes("1") ? "destructive" : role.level.includes("2") ? "default" : "secondary"}>
                      {role.level}
                    </Badge>
                  </TableCell>
                  <TableCell>{role.usersCount} users</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {role.createdBy?.name || "System"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRole(role._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
