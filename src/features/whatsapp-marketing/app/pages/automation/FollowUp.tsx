// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import { Label } from "@whatsapp/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { Clock, Plus, Trash2 } from "lucide-react";

export default function FollowUp() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-bold tracking-tight">Follow-up Messages</h2>
             <p className="text-muted-foreground">Re-engage leads who haven't responded.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Follow-up
          </Button>
        </div>

        <div className="grid gap-4">
           {/* Follow up item 1 */}
           <Card>
             <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                   <Clock className="h-6 w-6" />
                </div>
                <div className="flex-1 grid gap-4 md:grid-cols-3 items-start">
                   <div className="space-y-2">
                     <Label className="text-muted-foreground">Trigger</Label>
                     <div className="font-medium">After 24 Hours of Inactivity</div>
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <Label className="text-muted-foreground">Message</Label>
                     <div className="p-3 bg-muted rounded-md text-sm">
                       Hi there! Just wanted to check if you had any further questions? We are here to help!
                     </div>
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <Button variant="outline" size="sm">Edit</Button>
                   <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                </div>
             </CardContent>
           </Card>
           
           {/* Follow up item 2 */}
           <Card>
             <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                   <Clock className="h-6 w-6" />
                </div>
                <div className="flex-1 grid gap-4 md:grid-cols-3 items-start">
                   <div className="space-y-2">
                     <Label className="text-muted-foreground">Trigger</Label>
                     <div className="font-medium">After 48 Hours of No Reply</div>
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <Label className="text-muted-foreground">Message</Label>
                     <div className="p-3 bg-muted rounded-md text-sm">
                       Hey! We noticed you haven't completed your profile. Need any assistance?
                     </div>
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <Button variant="outline" size="sm">Edit</Button>
                   <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}
