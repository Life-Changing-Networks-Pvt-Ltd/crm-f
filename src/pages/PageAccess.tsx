import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Shield, Loader2, Save, CheckSquare } from "lucide-react"
import api from "../services/api"
import Swal from "sweetalert2"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface RoleData {
  _id: string;
  name: string;
  level: string;
  permissions?: string[];
}

const AVAILABLE_PAGES = [
  { id: '/', label: 'Dashboard', category: 'Dashboard' },
  
  { id: '/leads', label: 'Leads', category: 'CRM' },
  { id: '/employees', label: 'Employees', category: 'CRM' },
  
  { id: '/deals', label: 'Deals', category: 'Sales' },
  { id: '/pipeline', label: 'Pipeline', category: 'Sales' },
  { id: '/quotes', label: 'Quotes', category: 'Sales' },
  { id: '/invoices', label: 'Invoices', category: 'Sales' },

  { id: '/campaigns', label: 'Campaigns', category: 'Marketing' },
  { id: '/email-marketing', label: 'Email Marketing', category: 'Marketing' },
  { id: '/whatsapp-marketing', label: 'WhatsApp', category: 'Marketing' },
  { id: '/landing-pages', label: 'Landing Pages', category: 'Marketing' },

  { id: '/messages', label: 'Messages', category: 'Communication' },
  { id: '/email-inbox', label: 'Email Inbox', category: 'Communication' },
  { id: '/meetings', label: 'Meetings', category: 'Communication' },

  { id: '/tasks', label: 'Tasks', category: 'Tasks' },
  { id: '/calendar', label: 'Calendar', category: 'Tasks' },
  { id: '/notes', label: 'Notes', category: 'Tasks' },
  
  { id: '/reports/dashboard', label: 'Dashboard Reports', category: 'Reports' },
  { id: '/reports/sales', label: 'Sales Reports', category: 'Reports' },
  { id: '/reports/marketing', label: 'Marketing Reports', category: 'Reports' },
  { id: '/reports/users', label: 'User Reports', category: 'Reports' },
  { id: '/reports/attendance', label: 'Attendance Reports', category: 'Reports' },
  
  { id: '/users', label: 'Users', category: 'Administration' },
  { id: '/roles', label: 'Roles & Permissions', category: 'Administration' },
  { id: '/page-access', label: 'Page Access', category: 'Administration' },
  { id: '/teams', label: 'Teams', category: 'Administration' },
  { id: '/settings', label: 'Settings', category: 'Administration' },

  { id: '/profile', label: 'Profile', category: 'System' },
  { id: '/notifications', label: 'Notifications', category: 'System' },
  { id: '/integrations', label: 'Integrations', category: 'System' },
  { id: '/audit-logs', label: 'Audit Logs', category: 'System' },
];

export default function PageAccess() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
      Swal.fire('Error', 'Failed to load roles', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId)
    const role = roles.find(r => r._id === roleId)
    if (role && role.permissions) {
      setPermissions(role.permissions)
    } else {
      setPermissions([])
    }
  }

  const handleTogglePermission = (pageId: string) => {
    setPermissions(prev => 
      prev.includes(pageId) 
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    )
  }

  const handleSelectAll = (category: string) => {
    const categoryPages = AVAILABLE_PAGES.filter(p => p.category === category).map(p => p.id)
    const allSelected = categoryPages.every(id => permissions.includes(id))
    
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !categoryPages.includes(p)))
    } else {
      const newPermissions = [...permissions]
      categoryPages.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id)
        }
      })
      setPermissions(newPermissions)
    }
  }

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      setIsSaving(true)
      await api.put(`/roles/${selectedRole}/permissions`, {
        permissions
      })

      // Update local state
      setRoles(roles.map(r => r._id === selectedRole ? { ...r, permissions } : r))

      Swal.fire({
        icon: 'success',
        title: 'Permissions Saved',
        text: 'The page access permissions have been updated for this role.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error: any) {
      console.error("Failed to save permissions:", error)
      Swal.fire('Error', error.response?.data?.message || 'Failed to save permissions', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Group pages by category
  const groupedPages = AVAILABLE_PAGES.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = []
    }
    acc[page.category].push(page)
    return acc
  }, {} as Record<string, typeof AVAILABLE_PAGES>)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Page Access Control" 
          description="Manage which sidebar pages are visible to different roles." 
        />
        {selectedRole && (
          <Button onClick={handleSave} disabled={isSaving} className="shrink-0 gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Permissions
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* Left Column: Role Selector */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Select Role
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role to configure" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name} <span className="text-muted-foreground text-xs ml-1">({role.level})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Select a role from the dropdown above to view and edit their access to the application's pages. 
              <br/><br/>
              <strong>Note:</strong> Super Admins (Admin role) have unrestricted access to all pages by default.
            </p>
          </div>
        </div>

        {/* Right Column: Permissions List */}
        <div className="space-y-6">
          {!selectedRole ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No Role Selected</h3>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Please select a role from the sidebar to configure its page access permissions.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {Object.entries(groupedPages).map(([category, pages]) => {
                const categoryPages = pages.map(p => p.id)
                const allSelected = categoryPages.every(id => permissions.includes(id))

                return (
                  <div key={category} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                    <div className="bg-muted/40 p-4 border-b flex items-center justify-between">
                      <h4 className="font-semibold">{category}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSelectAll(category)}
                        className="h-8 text-xs gap-1"
                      >
                        <CheckSquare className="h-3 w-3" />
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="p-4 grid sm:grid-cols-2 gap-4">
                      {pages.map((page) => (
                        <div key={page.id} className="flex items-center space-x-3 bg-muted/10 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                          <Checkbox 
                            id={`perm-${page.id}`} 
                            checked={permissions.includes(page.id)}
                            onCheckedChange={() => handleTogglePermission(page.id)}
                          />
                          <Label 
                            htmlFor={`perm-${page.id}`} 
                            className="flex-1 cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {page.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
