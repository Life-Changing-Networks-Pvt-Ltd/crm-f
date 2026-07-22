// @ts-nocheck
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Badge } from "@whatsapp/components/ui/badge";
import { Plus, Image, FileText, Video, MapPin } from "lucide-react";

const templates = [
  {
    id: 1,
    name: "welcome_message",
    language: "en_US",
    status: "Approved",
    category: "Marketing",
    type: "text",
    preview: "Hi {{1}}, welcome to our store! We're excited to have you here. Check out our latest collection here: {{2}}",
  },
  {
    id: 2,
    name: "order_confirmation",
    language: "en_US",
    status: "Approved",
    category: "Utility",
    type: "text",
    preview: "Hello {{1}}, your order #{{2}} has been confirmed and will be shipped soon.",
  },
  {
    id: 3,
    name: "promo_image_header",
    language: "es_ES",
    status: "Pending",
    category: "Marketing",
    type: "image",
    preview: "Hola {{1}}, ¡tenemos una oferta especial para ti! 20% de descuento en tu próxima compra.",
  },
  {
    id: 4,
    name: "shipping_update",
    language: "en_US",
    status: "Rejected",
    category: "Utility",
    type: "text",
    preview: "Your package is on the way! Track it here: {{1}}",
  },
  {
    id: 5,
    name: "appointment_reminder",
    language: "en_US",
    status: "Approved",
    category: "Utility",
    type: "text",
    preview: "Hi {{1}}, just a reminder for your appointment tomorrow at {{2}}.",
  }
];

export default function Templates() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Message Templates</h2>
            <p className="text-muted-foreground">Create and manage WhatsApp message templates.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      {template.type === 'image' ? <Image className="h-4 w-4 text-muted-foreground" /> : 
                       template.type === 'video' ? <Video className="h-4 w-4 text-muted-foreground" /> :
                       template.type === 'location' ? <MapPin className="h-4 w-4 text-muted-foreground" /> :
                       <FileText className="h-4 w-4 text-muted-foreground" />}
                      <CardTitle className="text-base font-medium truncate">{template.name}</CardTitle>
                   </div>
                   <Badge variant={
                     template.status === 'Approved' ? 'default' : 
                     template.status === 'Pending' ? 'secondary' : 'destructive'
                   } className={template.status === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                     {template.status}
                   </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs font-normal">{template.language}</Badge>
                  <Badge variant="outline" className="text-xs font-normal">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground border border-border h-full">
                  {template.preview}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                 <Button variant="ghost" size="sm" className="w-full">Edit Template</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
