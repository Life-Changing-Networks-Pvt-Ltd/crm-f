// @ts-nocheck
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import { Label } from "@whatsapp/components/ui/label";
import { Switch } from "@whatsapp/components/ui/switch";
import { Separator } from "@whatsapp/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@whatsapp/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@whatsapp/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@whatsapp/components/ui/tabs";
import { Bell, Lock, User, Smartphone, Globe, CreditCard, PanelsTopLeft as Facebook } from "lucide-react";

export default function Settings() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business Profile</TabsTrigger>
            <TabsTrigger value="api">API & Webhooks</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account profile details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" defaultValue="Acme Inc Admin" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="admin@acme.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the dashboard looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark mode for the dashboard.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business Profile</CardTitle>
                <CardDescription>This information will be visible to your customers on WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Business Name</Label>
                  <Input defaultValue="Acme Corporation" />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input defaultValue="We provide the best widgets in the world." />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input defaultValue="123 Widget St, Tech City" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input defaultValue="support@acme.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Website</Label>
                  <Input defaultValue="https://acme.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update Profile</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>Manage your API keys and authentication tokens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Phone Number ID</Label>
                  <div className="flex gap-2">
                    <Input value="10928374655" readOnly className="font-mono bg-muted" />
                    <Button variant="outline" size="icon"><Lock className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>WhatsApp Business Account ID</Label>
                  <div className="flex gap-2">
                     <Input value="19283746556" readOnly className="font-mono bg-muted" />
                     <Button variant="outline" size="icon"><Lock className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Permanent Access Token</Label>
                  <div className="flex gap-2">
                     <Input value="EAABw..." type="password" readOnly className="font-mono bg-muted" />
                     <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                 <CardTitle>Integrations</CardTitle>
                 <CardDescription>Connect with other platforms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          <Facebook className="h-6 w-6" />
                       </div>
                       <div>
                          <h4 className="font-medium">Facebook Leads</h4>
                          <p className="text-sm text-muted-foreground">Sync leads from Facebook & Instagram Ads.</p>
                       </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                 </div>
              </CardContent>
            </Card>

            <Card>
               <CardHeader>
                 <CardTitle>Webhooks</CardTitle>
                 <CardDescription>Configure where we send real-time events.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid gap-2">
                   <Label>Callback URL</Label>
                   <Input placeholder="https://your-domain.com/webhook" />
                 </div>
                 <div className="grid gap-2 mt-4">
                   <Label>Verify Token</Label>
                   <Input placeholder="random_string" />
                 </div>
               </CardContent>
               <CardFooter>
                 <Button>Save Webhook</Button>
               </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle>Email Notifications</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label>Weekly Reports</Label>
                     <p className="text-sm text-muted-foreground">Receive a summary of your activity every Monday.</p>
                   </div>
                   <Switch defaultChecked />
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label>System Alerts</Label>
                     <p className="text-sm text-muted-foreground">Get notified about API errors or downtime.</p>
                   </div>
                   <Switch defaultChecked />
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
