import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "@tanstack/react-router"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/shared/DataPagination"
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  parent?: { _id: string; name: string; role: string } | string | null;
  status?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
}

interface RoleData {
  _id: string;
  name: string;
  level: string;
}

export default function Users() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<RoleData[]>([])
  const [managerOptions, setManagerOptions] = useState<UserData[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [parent, setParent] = useState("")
  const [status, setStatus] = useState("active")
  const [showPassword, setShowPassword] = useState(false)
  const { data, isLoading, refetch } = usePaginatedQuery<UserData>({
    endpoint: "/users/paged",
    page,
    limit: 25,
    params: { search: debouncedSearch || undefined },
  })
  const users = data?.items || []

  useEffect(() => {
    if (!currentUser) return; // Wait for hydration
    if (currentUser.role !== 'admin') {
      navigate({ to: '/' })
      return
    }
    fetchReferenceData()
  }, [currentUser])

  const fetchReferenceData = async () => {
    try {
      const [rolesRes, managersRes] = await Promise.all([
        api.get('/roles'),
        api.get('/users/options', { params: { purpose: "manager" } }),
      ])
      setRoles(rolesRes.data.data)
      setManagerOptions(managersRes.data.data || [])
    } catch (error: any) {
      console.error("Failed to fetch data:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load roles and manager options from the server.'
      })
    }
  }

  const openEditDialog = (u: UserData) => {
    setEditingUserId(u._id)
    setName(u.name)
    setEmail(u.email)
    setPassword("")
    setRole(u.role)
    setPhone(u.phone || "")
    setParent(typeof u.parent === "string" ? u.parent : u.parent?._id || "")
    setStatus(u.status || (u.isActive ? "active" : "inactive"))
    setShowPassword(false)
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!name.trim() || !email.trim() || !role) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields (Name, Email, Role).'
      })
      return
    }

    if (!editingUserId && !password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Password is required when creating a new user.'
      })
      return
    }

    try {
      setIsSaving(true)
      
      const payload: any = { name, email, role, phone, parent: parent || null, status }
      if (password.trim()) {
        payload.password = password
      }

      if (editingUserId) {
        // Update existing user
        await api.put(`/users/${editingUserId}`, payload)
        Swal.fire({
          icon: 'success',
          title: 'User Updated',
          text: 'User details have been successfully updated.',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        // Create new user
        await api.post('/users', payload)
        Swal.fire({
          icon: 'success',
          title: 'User Created',
          text: 'New user has been successfully created.',
          timer: 2000,
          showConfirmButton: false
        })
      }
      
      await Promise.all([refetch(), fetchReferenceData()])
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save user:", error)
      Swal.fire({
        icon: 'error',
        title: 'Failed to save user',
        text: error.response?.data?.message || 'Server error occurred'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete user!'
      })

      if (result.isConfirmed) {
        await api.delete(`/users/${id}`)
        await Promise.all([refetch(), fetchReferenceData()])
        Swal.fire(
          'Deleted!',
          'User has been deleted.',
          'success'
        )
      }
    } catch (error: any) {
      console.error("Failed to delete user:", error)
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
          title="Users Management" 
          description="Manage your team members and assign roles." 
        />
        {currentUser?.role === 'admin' && (
          <>
            <Button className="shrink-0 gap-2" onClick={() => navigate({ to: '/employees/new' })}>
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
              <DialogTitle>{editingUserId ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {editingUserId 
                  ? 'Update the user details below.' 
                  : 'Fill in the details below to create a new user account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="Agent phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password 
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 ? (
                      <SelectItem value="none" disabled>No roles available. Create one first.</SelectItem>
                    ) : (
                      roles.map(r => (
                        <SelectItem key={r._id} value={r.name}>{r.name} ({r.level})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parent">Reports To</Label>
                <Select value={parent || "none"} onValueChange={(value) => setParent(value === "none" ? "" : value)}>
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {managerOptions
                      .filter(u => u._id !== editingUserId)
                      .map(u => (
                        <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveUser} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingUserId ? 'Save Changes' : 'Create User')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>

      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder="Search users by name, email or role..."
        className="max-w-sm"
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Reports To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading users...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-8 w-8 opacity-20" />
                    <p>No users found. Create one to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof u.parent === "object" && u.parent ? u.parent.name : "-"}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {currentUser?.role === 'admin' ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u.role === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">No access</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data?.pagination && (
          <DataPagination pagination={data.pagination} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
