// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Switch } from "@whatsapp/components/ui/switch";
import { Label } from "@whatsapp/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@whatsapp/components/ui/tabs";

export default function Permissions() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Permissions</h2>
          <p className="text-muted-foreground">Control access levels for different roles.</p>
        </div>

        <Tabs defaultValue="agent" className="w-full">
          <TabsList>
            <TabsTrigger value="admin">Admin Role</TabsTrigger>
            <TabsTrigger value="agent">Agent Role</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agent" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Module Access</CardTitle>
                <CardDescription>Define which modules agents can access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dashboard</Label>
                    <p className="text-sm text-muted-foreground">View analytics and overview stats.</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inbox</Label>
                    <p className="text-sm text-muted-foreground">Read and reply to messages.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Campaigns</Label>
                    <p className="text-sm text-muted-foreground">Create and send broadcasts.</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contacts</Label>
                    <p className="text-sm text-muted-foreground">View and edit contact details.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Settings</Label>
                    <p className="text-sm text-muted-foreground">Access global settings.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card>
               <CardContent className="pt-6">
                 <p className="text-sm text-muted-foreground">Admins have full access to all modules by default.</p>
               </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
