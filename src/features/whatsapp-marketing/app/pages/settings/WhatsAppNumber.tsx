// @ts-nocheck
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@whatsapp/components/ui/card";
import { Input } from "@whatsapp/components/ui/input";
import { Label } from "@whatsapp/components/ui/label";
import { Badge } from "@whatsapp/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@whatsapp/components/ui/alert";
import { CheckCircle2, AlertCircle, Phone } from "lucide-react";

export default function WhatsAppNumber() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Number Settings</h2>
          <p className="text-muted-foreground">Manage your connected phone numbers.</p>
        </div>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  +1 (555) 123-4567
                </CardTitle>
                <CardDescription>Default Sending Number</CardDescription>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Quality Rating</span>
                 <span className="font-medium text-green-600">High</span>
               </div>
               <div className="h-2 bg-secondary rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 w-full"></div>
               </div>
            </div>
            <div className="grid gap-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Messaging Limit</span>
                 <span className="font-medium">1,000 conversations / 24h</span>
               </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm">Verify</Button>
            <Button variant="destructive" size="sm">Disconnect</Button>
          </CardFooter>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>Add New Number</CardTitle>
             <CardDescription>Connect another WhatsApp Business number.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid gap-2">
               <Label>Phone Number</Label>
               <Input placeholder="+1 (555) 000-0000" />
             </div>
             <Button>Send Verification Code</Button>
           </CardContent>
        </Card>
      </div>
    </>
  );
}
