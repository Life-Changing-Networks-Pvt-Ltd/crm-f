// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@whatsapp/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@whatsapp/components/ui/table";
import { Button } from "@whatsapp/components/ui/button";
import { Badge } from "@whatsapp/components/ui/badge";
import { Input } from "@whatsapp/components/ui/input";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { RefreshCw, Users, Search, Mail, Phone, User, Download, Send, MessageSquare, CheckCircle, Clock, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { useToast } from "@whatsapp/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@whatsapp/components/ui/dialog";
import { Checkbox } from "@whatsapp/components/ui/checkbox";

interface Lead {
  id: string;
  fbLeadId: string;
  formId: string;
  formName: string;
  fieldData: Record<string, string>;
  createdTime: string;
  syncedAt: string;
  phone?: string;
  email?: string;
  name?: string;
  autoReplySent?: boolean;
  autoReplyMessage?: string;
  autoReplySentAt?: string;
}

interface LeadForm {
  id: string;
  fbFormId: string;
  name: string;
}

export default function Leads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [targetLead, setTargetLead] = useState<Lead | null>(null);
  const [processingAutoReply, setProcessingAutoReply] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/facebook/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/facebook/forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (lead.name?.toLowerCase().includes(searchLower) || false) ||
      (lead.email?.toLowerCase().includes(searchLower) || false) ||
      (lead.phone?.includes(searchTerm) || false) ||
      lead.formName.toLowerCase().includes(searchLower);
    
    const matchesForm = selectedForm === "all" || lead.formId === selectedForm;
    
    return matchesSearch && matchesForm;
  });

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const exportToCSV = () => {
    const leadsToExport = selectedLeads.size > 0 
      ? filteredLeads.filter(l => selectedLeads.has(l.id))
      : filteredLeads;

    if (leadsToExport.length === 0) {
      toast({
        title: "No Leads to Export",
        description: "Please select leads or ensure there are leads to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Name", "Email", "Phone", "Form Name", "Created Date", "Auto Reply Sent", "Auto Reply Message"];
    const rows = leadsToExport.map(lead => [
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.formName,
      new Date(lead.createdTime).toLocaleString(),
      lead.autoReplySent ? "Yes" : "No",
      lead.autoReplyMessage || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${leadsToExport.length} leads to CSV.`,
    });
  };

  const openSendMessageDialog = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: "No Phone Number",
        description: "This lead does not have a phone number.",
        variant: "destructive",
      });
      return;
    }
    setTargetLead(lead);
    setMessageText(`Hi ${lead.name || "there"}! Thank you for your interest. How can we help you today?`);
    setMessageDialogOpen(true);
  };

  const sendIndividualMessage = async () => {
    if (!targetLead || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/leads/auto-reply/send/${targetLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: `Message sent to ${targetLead.name || targetLead.phone}`,
        });
        setMessageDialogOpen(false);
        fetchLeads();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Send",
          description: error.error || "Could not send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const processAllAutoReply = async () => {
    setProcessingAutoReply(true);
    try {
      const response = await fetch("/api/leads/auto-reply/process-all", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Auto-Reply Processing Complete",
          description: `Processed ${result.processed} leads. Successful: ${result.successful}, Failed: ${result.failed}`,
        });
        fetchLeads();
      } else {
        const error = await response.json();
        toast({
          title: "Processing Failed",
          description: error.error || "Could not process leads",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingAutoReply(false);
    }
  };

  const pendingLeadsCount = leads.filter(l => l.phone && !l.autoReplySent).length;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Lead Management</h2>
            <p className="text-muted-foreground">View, export, and send messages to leads from Facebook forms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export {selectedLeads.size > 0 ? `(${selectedLeads.size})` : "All"}
            </Button>
            <Button 
              variant="outline" 
              onClick={processAllAutoReply}
              disabled={processingAutoReply || pendingLeadsCount === 0}
            >
              <Send className={`h-4 w-4 mr-2 ${processingAutoReply ? "animate-pulse" : ""}`} />
              Auto-Reply ({pendingLeadsCount})
            </Button>
            <Button onClick={fetchLeads} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.filter(l => l.phone).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Auto-Reply Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.autoReplySent).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingLeadsCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.fbFormId}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads ({filteredLeads.length})
            </CardTitle>
            <CardDescription>
              All leads collected from your Facebook lead forms. Select leads to export or send messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leads found. Sync your lead forms to fetch new leads.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {lead.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">{lead.email || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {lead.phone || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                          {lead.formName.replace("SellersLogin Networks's form - ", "")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.autoReplySent ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : lead.phone ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Phone</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openSendMessageDialog(lead)}
                          disabled={!lead.phone}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send WhatsApp Message</DialogTitle>
              <DialogDescription>
                Send a message to {targetLead?.name || targetLead?.phone}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Phone: {targetLead?.phone}</p>
              </div>
              <Textarea
                placeholder="Enter your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendIndividualMessage} disabled={sendingMessage || !messageText.trim()}>
                {sendingMessage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
