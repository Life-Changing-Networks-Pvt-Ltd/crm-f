// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@whatsapp/components/ui/card";
import { Switch } from "@whatsapp/components/ui/switch";
import { Label } from "@whatsapp/components/ui/label";
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import { Bell, Mail, Smartphone } from "lucide-react";

export default function NewLeads() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">New Lead Alerts</h2>
           <p className="text-muted-foreground">Notify your team when a new lead comes in.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6" />
                   </div>
                   <div>
                     <CardTitle>Email Notifications</CardTitle>
                     <CardDescription>Send an email to admins.</CardDescription>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                   <Label>Enable Email Alerts</Label>
                   <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                   <Label>Recipient Email(s)</Label>
                   <Input defaultValue="admin@acme.com, sales@acme.com" />
                   <p className="text-xs text-muted-foreground">Comma separated for multiple emails.</p>
                </div>
             </CardContent>
             <CardFooter>
                <Button>Save Settings</Button>
             </CardFooter>
           </Card>

           <Card>
             <CardHeader>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-6 w-6" />
                   </div>
                   <div>
                     <CardTitle>WhatsApp Admin Alert</CardTitle>
                     <CardDescription>Send a WhatsApp message to your phone.</CardDescription>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                   <Label>Enable WhatsApp Alerts</Label>
                   <Switch />
                </div>
                <div className="grid gap-2">
                   <Label>Admin Phone Number</Label>
                   <Input placeholder="+1 555 123 4567" />
                </div>
             </CardContent>
             <CardFooter>
                <Button>Save Settings</Button>
             </CardFooter>
           </Card>
        </div>
      </div>
    </>
  );
}
