// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@whatsapp/components/ui/card";
import { Switch } from "@whatsapp/components/ui/switch";
import { Label } from "@whatsapp/components/ui/label";
import { Button } from "@whatsapp/components/ui/button";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { PanelsTopLeft as Facebook, Camera as Instagram, Globe, MessageSquare } from "lucide-react";

export default function AutoLeads() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auto-messages to Leads</h2>
          <p className="text-muted-foreground">Configure automatic welcome messages for new leads from different sources.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                     <Facebook className="h-6 w-6" />
                   </div>
                   <div>
                     <CardTitle>Facebook Leads</CardTitle>
                     <CardDescription>Leads from FB Lead Forms</CardDescription>
                   </div>
                 </div>
                 <Switch defaultChecked />
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-2">
                 <Label>Welcome Message</Label>
                 <Textarea 
                   defaultValue="Hi {{name}}, thanks for your interest in our product! We have received your inquiry and will get back to you shortly."
                   className="min-h-[100px]"
                 />
               </div>
            </CardContent>
            <CardFooter>
               <Button>Save Settings</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-pink-600 flex items-center justify-center text-white">
                     <Instagram className="h-6 w-6" />
                   </div>
                   <div>
                     <CardTitle>Instagram Leads</CardTitle>
                     <CardDescription>Leads from IG Direct</CardDescription>
                   </div>
                 </div>
                 <Switch />
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-2">
                 <Label>Welcome Message</Label>
                 <Textarea 
                   defaultValue="Hello {{name}}! Thanks for reaching out on Instagram."
                   className="min-h-[100px]"
                 />
               </div>
            </CardContent>
            <CardFooter>
               <Button>Save Settings</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                     <Globe className="h-6 w-6" />
                   </div>
                   <div>
                     <CardTitle>Website Form</CardTitle>
                     <CardDescription>Leads from your website</CardDescription>
                   </div>
                 </div>
                 <Switch defaultChecked />
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-2">
                 <Label>Welcome Message</Label>
                 <Textarea 
                   defaultValue="Thanks for signing up on our website, {{name}}!"
                   className="min-h-[100px]"
                 />
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
