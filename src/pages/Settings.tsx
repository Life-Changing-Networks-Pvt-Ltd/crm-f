import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/ThemeProvider"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/store"
import { setSettings } from "@/store/slices/settingsSlice"
import api from "@/services/api"
import { toast } from "sonner"
import { Moon, Sun, Laptop, RefreshCw, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Unplug, Loader2 } from "lucide-react"
import { queryClient } from "@/lib/queryClient"
import { referenceQueryKeys } from "@/hooks/useCrmReferenceData"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const dispatch = useDispatch()
  const currentSettings = useSelector((state: RootState) => state.settings)
  const currentUser = useSelector((state: RootState) => state.auth.user)
  
  const [formData, setFormData] = useState({
    systemName: '',
    companyName: '',
    contactEmail: '',
    contactPhone: ''
  })
  const [loading, setLoading] = useState(false)

  // IndiaMART Integration State
  const [imLoading, setImLoading] = useState(false)
  const [imSyncing, setImSyncing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [imForm, setImForm] = useState({
    mobileNumber: '',
    apiKey: '',
  })
  const [imConfig, setImConfig] = useState<{
    mobileNumber?: string;
    maskedApiKey?: string;
    hasApiKey?: boolean;
    syncStatus?: string;
    autoSync?: boolean;
    lastSyncAt?: string | null;
    lastError?: string;
  }>({
    syncStatus: 'disconnected',
  })

  useEffect(() => {
    setFormData({
      systemName: currentSettings.systemName || '',
      companyName: currentSettings.companyName || '',
      contactEmail: currentSettings.contactEmail || '',
      contactPhone: currentSettings.contactPhone || ''
    })
  }, [currentSettings])

  const fetchIndiaMartConfig = async () => {
    try {
      setImLoading(true)
      const res = await api.get('/integrations/indiamart')
      if (res.data.data) {
        setImConfig(res.data.data)
        setImForm({
          mobileNumber: res.data.data.mobileNumber || '',
          apiKey: '',
        })
      }
    } catch {
      // Non-blocking
    } finally {
      setImLoading(false)
    }
  }

  useEffect(() => {
    fetchIndiaMartConfig()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const res = await api.put('/settings', formData)
      dispatch(setSettings(res.data.data))
      queryClient.setQueryData(referenceQueryKeys.settings, res.data.data)
      toast.success("Settings updated successfully")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handleConnectIndiaMart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imForm.mobileNumber || !imForm.apiKey) {
      toast.error("Please enter both Registered Mobile Number and CRM Key")
      return
    }

    try {
      setImLoading(true)
      const res = await api.post('/integrations/indiamart', {
        mobileNumber: imForm.mobileNumber,
        apiKey: imForm.apiKey,
        autoSync: true,
      })
      toast.success(res.data.message || "IndiaMART connected successfully!")
      fetchIndiaMartConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect IndiaMART")
    } finally {
      setImLoading(false)
    }
  }

  const handleSyncNow = async () => {
    try {
      setImSyncing(true)
      const res = await api.post('/integrations/indiamart/sync')
      toast.success(res.data.message || "Leads synced successfully!")
      fetchIndiaMartConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sync leads")
    } finally {
      setImSyncing(false)
    }
  }

  const handleDisconnectIndiaMart = async () => {
    if (!window.confirm("Are you sure you want to disconnect IndiaMART? Automatic lead sync will be stopped.")) {
      return
    }

    try {
      setImLoading(true)
      await api.delete('/integrations/indiamart')
      toast.success("IndiaMART disconnected")
      setImConfig({ syncStatus: 'disconnected' })
      setImForm({ mobileNumber: '', apiKey: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disconnect")
    } finally {
      setImLoading(false)
    }
  }

  const isVendor = String(currentUser?.role || '').toLowerCase() === 'vendor'
  const defaultTab = isVendor ? "integrations" : "general"

  return (
    <div className="flex flex-col gap-6 pb-8 h-full">
      <PageHeader title="Settings" description="Manage global system settings and vendor integrations." />
      <Tabs defaultValue={defaultTab} className="w-full max-w-4xl">
        <TabsList className="mb-4">
          {!isVendor && <TabsTrigger value="general">General</TabsTrigger>}
          <TabsTrigger value="integrations">Integrations (IndiaMART)</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          {!isVendor && <TabsTrigger value="security">Security</TabsTrigger>}
          {!isVendor && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
        </TabsList>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">IndiaMART Lead Manager Integration</CardTitle>
                    {imConfig.syncStatus === 'connected' ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-300">
                        ● Connected
                      </Badge>
                    ) : imConfig.syncStatus === 'error' ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Error
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1.5">
                    Connect your IndiaMART vendor CRM key to automatically stream buyer inquiries into your CRM leads pipeline every 5 minutes.
                  </CardDescription>
                </div>
                {imConfig.syncStatus === 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={imSyncing}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${imSyncing ? 'animate-spin' : ''}`} />
                    {imSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-5">
                {imConfig.syncStatus === 'connected' && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300">Active Connection: </span>
                      <span className="text-emerald-800 dark:text-emerald-400">
                        Auto-syncing for Mobile: <strong>+91 {imConfig.mobileNumber}</strong>
                      </span>
                      {imConfig.lastSyncAt && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Last Synced: {new Date(imConfig.lastSyncAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectIndiaMart}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto gap-1"
                    >
                      <Unplug className="h-3.5 w-3.5" /> Disconnect
                    </Button>
                  </div>
                )}

                {imConfig.syncStatus === 'error' && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Sync Error: {imConfig.lastError || "Authentication failed. Please verify your CRM Key."}</span>
                  </div>
                )}

                <form onSubmit={handleConnectIndiaMart} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="imMobile">
                      IndiaMART Registered Mobile Number
                    </Label>
                    <Input
                      id="imMobile"
                      placeholder="e.g. 9876543210 (10 digits without +91)"
                      value={imForm.mobileNumber}
                      onChange={(e) => setImForm({ ...imForm, mobileNumber: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The primary mobile number registered with your IndiaMART seller profile.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imKey">
                      IndiaMART CRM Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="imKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder={imConfig.hasApiKey ? `Saved: ${imConfig.maskedApiKey} (Enter new key to change)` : "Paste your IndiaMART GLUSR_CRM_KEY here"}
                        value={imForm.apiKey}
                        onChange={(e) => setImForm({ ...imForm, apiKey: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Found in IndiaMART Seller Panel &rarr; Lead Manager &rarr; CRM Integration.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="submit" disabled={imLoading} className="gap-2">
                      {imLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <KeyRound className="h-4 w-4" />
                      {imConfig.syncStatus === 'connected' ? "Update & Reconnect" : "Test & Connect IndiaMART"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Manage your company profile and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="e.g. Antigravity Inc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail" 
                    name="contactEmail" 
                    type="email" 
                    value={formData.contactEmail} 
                    onChange={handleChange} 
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input 
                    id="contactPhone" 
                    name="contactPhone" 
                    value={formData.contactPhone} 
                    onChange={handleChange} 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the theme and appearance of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" /> Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" /> Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'outline'} 
                    onClick={() => setTheme('system')}
                    className="flex items-center gap-2"
                  >
                    <Laptop className="h-4 w-4" /> System
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
