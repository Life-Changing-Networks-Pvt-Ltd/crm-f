import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/store"
import { setSettings } from "@/store/slices/settingsSlice"
import api from "@/services/api"
import { toast } from "sonner"
import { Moon, Sun, Laptop } from "lucide-react"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const dispatch = useDispatch()
  const currentSettings = useSelector((state: RootState) => state.settings)
  
  const [formData, setFormData] = useState({
    systemName: '',
    companyName: '',
    contactEmail: '',
    contactPhone: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({
      systemName: currentSettings.systemName || '',
      companyName: currentSettings.companyName || '',
      contactEmail: currentSettings.contactEmail || '',
      contactPhone: currentSettings.contactPhone || ''
    })
  }, [currentSettings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const res = await api.put('/settings', formData)
      dispatch(setSettings(res.data.data))
      toast.success("Settings updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Settings" description="Manage global system settings." />
      <Tabs defaultValue="general" className="w-full max-w-4xl">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your general system branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input 
                  id="systemName" 
                  name="systemName"
                  value={formData.systemName} 
                  onChange={handleChange}
                  placeholder="e.g. Antigravity CRM" 
                />
                <p className="text-sm text-muted-foreground">
                  This name is displayed in the sidebar and page headers.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Manage your company contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName"
                  value={formData.companyName} 
                  onChange={handleChange}
                  placeholder="Company LLC" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input 
                  id="contactEmail" 
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail} 
                  onChange={handleChange}
                  placeholder="admin@company.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input 
                  id="contactPhone" 
                  name="contactPhone"
                  value={formData.contactPhone} 
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 mb-6">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the theme you prefer for the CRM interface.
                </p>
                <div className="flex gap-4">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    className="flex-1 h-20 flex-col gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-6 w-6" />
                    Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    className="flex-1 h-20 flex-col gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'outline'} 
                    className="flex-1 h-20 flex-col gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Laptop className="h-6 w-6" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Security settings placeholder.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">Security features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Notification settings placeholder.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">Global notification preferences coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
