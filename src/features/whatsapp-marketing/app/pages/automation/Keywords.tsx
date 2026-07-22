// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@whatsapp/components/ui/table";
import { Badge } from "@whatsapp/components/ui/badge";
import { Switch } from "@whatsapp/components/ui/switch";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@whatsapp/components/ui/dialog";
import { Label } from "@whatsapp/components/ui/label";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { toast } from "sonner";

interface Automation {
  id: string;
  name: string;
  type: "keyword" | "welcome" | "follow_up" | "drip";
  trigger: string;
  message: string;
  delay?: number;
  delayUnit?: "minutes" | "hours" | "days";
  isActive: boolean;
  createdAt: string;
}

export default function Keywords() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    trigger: "",
    message: "",
  });
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
    queryFn: async () => {
      const res = await fetch("/api/automations");
      if (!res.ok) throw new Error("Failed to fetch automations");
      return res.json();
    },
  });

  const keywordAutomations = automations.filter(a => a.type === "keyword");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type: "keyword",
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to create automation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Keyword rule created successfully");
    },
    onError: () => {
      toast.error("Failed to create keyword rule");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update automation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      setIsEditDialogOpen(false);
      setSelectedAutomation(null);
      toast.success("Keyword rule updated successfully");
    },
    onError: () => {
      toast.error("Failed to update keyword rule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete automation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast.success("Keyword rule deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete keyword rule");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle automation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
    },
    onError: () => {
      toast.error("Failed to toggle automation");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", trigger: "", message: "" });
  };

  const openEditDialog = (automation: Automation) => {
    setSelectedAutomation(automation);
    setFormData({
      name: automation.name,
      trigger: automation.trigger,
      message: automation.message,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.trigger || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedAutomation) return;
    updateMutation.mutate({
      id: selectedAutomation.id,
      data: formData,
    });
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-bold tracking-tight">Keyword Auto-replies</h2>
             <p className="text-muted-foreground">Set up triggers for specific words in incoming messages.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
               <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                 <Plus className="mr-2 h-4 w-4" />
                 Add New Rule
               </Button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                 <DialogTitle>New Keyword Rule</DialogTitle>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label>Rule Name</Label>
                   <Input 
                     placeholder="e.g., Price Inquiry"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   />
                 </div>
                 <div className="grid gap-2">
                   <Label>Keyword Trigger</Label>
                   <Input 
                     placeholder="e.g., price, pricing, cost"
                     value={formData.trigger}
                     onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                   />
                   <p className="text-xs text-muted-foreground">
                     Enter the word or phrase that triggers this response
                   </p>
                 </div>
                 <div className="grid gap-2">
                   <Label>Reply Message</Label>
                   <Textarea 
                     placeholder="The automated response..."
                     value={formData.message}
                     onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                     rows={4}
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                 <Button onClick={handleCreate} disabled={createMutation.isPending}>
                   {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Save Rule
                 </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
             <CardTitle>Active Rules</CardTitle>
             <CardDescription>Messages that trigger an automatic response.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : keywordAutomations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No keyword rules yet. Create your first rule to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Reply Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywordAutomations.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{rule.trigger}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[300px]">{rule.message}</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Keyword Rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Rule Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Keyword Trigger</Label>
              <Input 
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Reply Message</Label>
              <Textarea 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
