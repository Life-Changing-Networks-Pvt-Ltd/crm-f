// @ts-nocheck
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Button } from "@whatsapp/components/ui/button";
import { Input } from "@whatsapp/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@whatsapp/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@whatsapp/components/ui/tabs";
import {
  Upload,
  Download,
  Send,
  Users,
  Loader2,
  Check,
  Calendar,
  FileSpreadsheet,
  Bot,
  MessageSquare,
  Plus,
  Search,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { PhonePreview } from "@whatsapp/components/ui/phone-preview";
import { Label } from "@whatsapp/components/ui/label";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { Checkbox } from "@whatsapp/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@whatsapp/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@whatsapp/components/ui/dialog";
import { Alert, AlertDescription } from "@whatsapp/components/ui/alert";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Swal from "sweetalert2"; // ✅ Added SweetAlert2
import type {
  Agent,
  BroadcastList,
  BroadcastResponse,
  Contact,
  ImportedContact,
  SavedContact,
  Template,
} from "./type";

const REQUIRED_EXCEL_COLUMNS = [
  "Name",
  "WhatsApp Number",
];

const SAMPLE_TEMPLATE_ROW: Record<string, string> = {
  Name: "John Doe",
  "WhatsApp Number": "919876543210",
};

const MANUAL_LIST_SELECT_VALUE = "__manual__";

export default function Broadcast() {
  const [, setLocation] = useLocation();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [messageType, setMessageType] = useState<
    "template" | "custom" | "ai_agent"
  >("template");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showCreateList, setShowCreateList] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExcelFormatDialog, setShowExcelFormatDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: regularContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: savedImportedContacts = [] } = useQuery<SavedContact[]>({
    queryKey: ["/api/broadcast/imported-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/broadcast/imported-contacts");
      if (!res.ok) throw new Error("Failed to fetch imported contacts");
      return res.json();
    },
  });

  const contacts: Contact[] = useMemo(
    () => [
      ...regularContacts,
      ...savedImportedContacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        tags: c.tags || [],
      })),
    ],
    [regularContacts, savedImportedContacts]
  );

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(q) ||
        contact.phone.includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  const { data: broadcastLists = [] } = useQuery<BroadcastList[]>({
    queryKey: ["/api/broadcast/lists"],
    queryFn: async () => {
      const res = await fetch("/api/broadcast/lists");
      if (!res.ok) throw new Error("Failed to fetch broadcast lists");
      return res.json();
    },
  });

  const approvedTemplates = templates.filter((t) => t.status === "approved");
  const activeAgents = agents.filter((a) => a.isActive);

  const importExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/broadcast/import-excel", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import file");
      }
      return data;
    },
    onSuccess: (data) => {
      setImportedContacts(data.contacts);
      queryClient.invalidateQueries({
        queryKey: ["/api/broadcast/imported-contacts"],
      });
      if (data.errors && data.errors.length > 0) {
        toast.warning(
          `Imported ${data.validContacts} of ${data.totalRows} rows. ${data.errors.length} rows had issues.`
        );
      } else {
        toast.success(
          `Successfully imported ${data.validContacts} contacts from ${data.totalRows} rows`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Failed to import file. Check that your file has 'Name' and 'WhatsApp Number' columns."
      );
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { name: string; contacts: ImportedContact[] }) => {
      const res = await fetch("/api/broadcast/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast/lists"] });
      toast.success("Broadcast list created successfully");
      setShowCreateList(false);
      setNewListName("");
    },
    onError: () => {
      toast.error("Failed to create broadcast list");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importExcelMutation.mutate(file);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const rows = [
      REQUIRED_EXCEL_COLUMNS,
      [SAMPLE_TEMPLATE_ROW.Name, SAMPLE_TEMPLATE_ROW["WhatsApp Number"]],
      ...Array.from({ length: 499 }, () => ["", ""]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 28 }, { wch: 24 }];
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    for (let row = 2; row <= 501; row++) {
      const nameCell = worksheet[`A${row}`];
      const phoneCell = worksheet[`B${row}`];
      if (nameCell) {
        nameCell.t = "s";
        nameCell.z = "@";
      }
      if (phoneCell) {
        phoneCell.t = "s";
        phoneCell.z = "@";
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Broadcast_Import_Template"
    );
    XLSX.writeFile(workbook, "Broadcast_Import_Sample_Template.xlsx");
    toast.success("Sample template downloaded");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === "hello_world") {
      setSelectedTemplateName("hello_world");
      setMessage(
        "Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta."
      );
    } else {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplateName(template.name);
        setMessage(template.content);
      }
    }
  };

  const toggleContact = (
    contactId: string,
    checked: boolean | "indeterminate"
  ) => {
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedContactIds((prev) => [...prev, contactId]);
    } else {
      setSelectedContactIds((prev) => prev.filter((id) => id !== contactId));
    }
  };

  const selectAllContacts = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id));
    }
  };

  const handleSendBroadcast = async () => {
    // VALIDATION: Campaign name is now REQUIRED
    if (!campaignName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Missing Campaign Name",
        text: "Please enter a campaign name to track your broadcast.",
        confirmButtonText: "OK",
      });
      return;
    }

    let targetContacts: Array<{ name: string; phone: string }> = [];

    if (selectedListId) {
      const list = broadcastLists.find((l) => l.id === selectedListId);
      if (list) {
        targetContacts = list.contacts;
      }
    } else if (importedContacts.length > 0) {
      targetContacts = importedContacts;
    } else if (selectedContactIds.length > 0) {
      targetContacts = contacts
        .filter((c) => selectedContactIds.includes(c.id))
        .map((c) => ({ name: c.name, phone: c.phone }));
    }

    if (targetContacts.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Contacts Selected",
        text: "Please select contacts, import from Excel, or choose a list.",
        confirmButtonText: "OK",
      });
      return;
    }

    if (messageType === "template" && !selectedTemplateId) {
      Swal.fire({
        icon: "error",
        title: "Template Required",
        text: "Please select a WhatsApp template.",
        confirmButtonText: "OK",
      });
      return;
    }

    if (messageType === "custom" && !message.trim()) {
      Swal.fire({
        icon: "error",
        title: "Message Required",
        text: "Please enter your custom message.",
        confirmButtonText: "OK",
      });
      return;
    }

    if (messageType === "ai_agent" && !selectedAgentId) {
      Swal.fire({
        icon: "error",
        title: "AI Agent Required",
        text: "Please select an active AI agent.",
        confirmButtonText: "OK",
      });
      return;
    }

    if (isScheduled) {
      if (!scheduledTime) {
        Swal.fire({
          icon: "error",
          title: "Schedule Time Missing",
          text: "Please select a future date and time.",
          confirmButtonText: "OK",
        });
        return;
      }
      const scheduledDate = new Date(scheduledTime);
      const now = new Date();
      if (scheduledDate <= now) {
        Swal.fire({
          icon: "error",
          title: "Invalid Time",
          text: "Scheduled time must be in the future.",
          confirmButtonText: "OK",
        });
        return;
      }
    }

    setIsSending(true);

    const userDataString = sessionStorage.getItem("whatsapp_auth_user");
    if (!userDataString) {
      Swal.fire({
        icon: "error",
        title: "Not Logged In",
        text: "User session missing. Please log in again.",
        confirmButtonText: "OK",
      });
      setIsSending(false);
      return;
    }

    const userData = JSON.parse(userDataString);
    const userId = userData.id;

    try {
      const payload = {
        contacts: targetContacts,
        messageType,
        templateName:
          messageType === "template"
            ? selectedTemplateName || "hello_world"
            : undefined,
        customMessage: messageType === "custom" ? message : undefined,
        agentId: messageType === "ai_agent" ? selectedAgentId : undefined,
        campaignName: campaignName.trim(),
        isScheduled,
        senderId: userId,
        scheduledTime: isScheduled
          ? new Date(scheduledTime).toISOString()
          : undefined,
      };

      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: BroadcastResponse = await res.json();

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Broadcast Failed",
          text: result.error || `Failed to send broadcast (${res.status})`,
          confirmButtonText: "OK",
        });
        setIsSending(false);
        return;
      }

      // ✅ SUCCESS: Show Swal alert based on result
      if (isScheduled) {
        Swal.fire({
          icon: "success",
          title: "Broadcast Scheduled!",
          text: `Your message will be sent on ${new Date(
            scheduledTime
          ).toLocaleString()}`,
          confirmButtonText: "OK",
        });
      } else if (result.failed > 0) {
        let htmlMessage = `<p><strong>${result.successful}</strong> messages sent successfully.</p>
                          <p><strong>${result.failed}</strong> failed.</p>`;

        if (result.failedContacts && result.failedContacts.length > 0) {
          const failedList = result.failedContacts
            .map((c) => `${c.name} (${c.phone})`)
            .join("<br>");
          htmlMessage += `<br><strong>Failed contacts:</strong><br>${failedList}`;
        }

        Swal.fire({
          icon: "warning",
          title: "Partially Sent",
          html: htmlMessage,
          confirmButtonText: "Close",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Broadcast Sent!",
          text: `Successfully delivered to ${result.successful} contacts.`,
          confirmButtonText: "Great!",
        });
      }

      // Reset form after success
      setSelectedContactIds([]);
      setImportedContacts([]);
      setCampaignName("");
      setSelectedTemplateId("");
      setSelectedTemplateName("");
      setMessage("");
      setIsScheduled(false);
      setScheduledTime("");
    } catch (error: any) {
      console.error("❌ Broadcast error:", error);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: error.message || "Failed to send broadcast. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    let listContacts: ImportedContact[] = [];
    if (importedContacts.length > 0) {
      listContacts = importedContacts;
    } else if (selectedContactIds.length > 0) {
      listContacts = contacts
        .filter((c) => selectedContactIds.includes(c.id))
        .map((c) => ({ name: c.name, phone: c.phone }));
    }

    if (listContacts.length === 0) {
      toast.error("No contacts to add to the list");
      return;
    }

    createListMutation.mutate({ name: newListName, contacts: listContacts });
  };

  const selectedBroadcastList = useMemo(
    () => broadcastLists.find((list) => list.id === selectedListId),
    [broadcastLists, selectedListId]
  );

  const selectedListContacts = selectedBroadcastList?.contacts || [];

  const totalSelected = selectedListId
    ? selectedListContacts.length
    : importedContacts.length > 0
    ? importedContacts.length
    : selectedContactIds.length;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Send Broadcast</h2>
          <p className="text-muted-foreground">
            Send bulk messages to your contact lists.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Campaign name is required</strong> to track and analyze your
            broadcasts.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>
            Campaign Name <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="e.g., Black Friday Sale, Product Launch 2024"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className={
              !campaignName.trim()
                ? "border-red-300 focus-visible:ring-red-500"
                : ""
            }
          />
          {!campaignName.trim() && (
            <p className="text-sm text-red-500">
              Campaign name is required to send broadcasts
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                1. Select Audience
              </CardTitle>
              <CardDescription>
                Choose who will receive this message. Selected: {totalSelected}{" "}
                contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowExcelFormatDialog(true)}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import Excel/CSV
                </Button>
                <Dialog
                  open={showExcelFormatDialog}
                  onOpenChange={setShowExcelFormatDialog}
                >
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Excel File Format Required</DialogTitle>
                      <DialogDescription>
                        Keep the file simple with these two columns
                        <strong> exactly as shown</strong>. Include the country
                        code in every WhatsApp number.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 border rounded-md p-3 bg-muted/50">
                      <ul className="list-disc pl-5 text-sm space-y-1 max-h-48 overflow-y-auto">
                        {REQUIRED_EXCEL_COLUMNS.map((col) => (
                          <li key={col} className="font-mono">
                            {col}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Example number: 919876543210. Keep the WhatsApp Number
                        column as Text in Excel so long numbers are not changed
                        to 9.19E+11 format.
                      </AlertDescription>
                    </Alert>

                    <DialogFooter className="mt-4 !flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDownloadSampleTemplate}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample Template
                      </Button>

                      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowExcelFormatDialog(false)}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setShowExcelFormatDialog(false);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 100);
                          }}
                        >
                          Proceed to Upload
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" type="button">
                      <Plus className="mr-2 h-4 w-4" />
                      Save as List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Broadcast List</DialogTitle>
                      <DialogDescription>
                        Save selected contacts as a reusable list
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>List Name</Label>
                        <Input
                          placeholder="e.g., VIP Customers"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This will save{" "}
                        {importedContacts.length > 0
                          ? importedContacts.length
                          : selectedContactIds.length}{" "}
                        contacts to the list.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        onClick={handleCreateList}
                        disabled={createListMutation.isPending}
                      >
                        {createListMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create List
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {broadcastLists.length > 0 && (
                <div className="space-y-2">
                  <Label>Or Select Existing List</Label>
                  <Select
                    value={selectedListId || MANUAL_LIST_SELECT_VALUE}
                    onValueChange={(value) => {
                      if (value === MANUAL_LIST_SELECT_VALUE) {
                        setSelectedListId("");
                      } else {
                        setSelectedListId(value);
                        setSelectedContactIds([]);
                        setImportedContacts([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a broadcast list..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MANUAL_LIST_SELECT_VALUE}>
                        None (Select manually)
                      </SelectItem>
                      {broadcastLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name} ({list.contacts.length} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedBroadcastList && (
                    <div className="rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                        <p className="text-sm font-medium">
                          {selectedBroadcastList.name} numbers
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {selectedListContacts.length} contacts
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {selectedListContacts.length > 0 ? (
                          selectedListContacts.map((contact, index) => (
                            <div
                              key={`${contact.phone}-${index}`}
                              className="flex items-center gap-3 px-3 py-2 text-sm border-b last:border-b-0"
                            >
                              <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {contact.name || "Unnamed contact"}
                                </p>
                                <p className="truncate text-muted-foreground">
                                  {contact.phone}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                            No numbers found in this list.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importedContacts.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center justify-between gap-3 border-b border-green-200 px-3 py-2 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {importedContacts.length} contacts imported from Excel
                    </p>
                    <span className="text-xs text-green-700 dark:text-green-300">
                      {importedContacts.length} numbers
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {importedContacts.map((contact, index) => (
                      <div
                        key={`${contact.phone}-${index}`}
                        className="flex items-center gap-3 border-b border-green-200 px-3 py-2 text-sm last:border-b-0 dark:border-green-800"
                      >
                        <Smartphone className="h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-green-950 dark:text-green-100">
                            {contact.name || "Unnamed contact"}
                          </p>
                          <p className="truncate text-green-700 dark:text-green-300">
                            {contact.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="m-2 text-xs text-green-900 hover:text-green-950 dark:text-green-100 dark:hover:text-green-50"
                    onClick={() => setImportedContacts([])}
                  >
                    Clear imported
                  </Button>
                </div>
              )}

              {!selectedListId && importedContacts.length === 0 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts by name or phone..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={selectAllContacts}
                    >
                      {selectedContactIds.length === filteredContacts.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {filteredContacts.length} contacts found
                    </span>
                  </div>

                  <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            toggleContact(
                              contact.id,
                              !selectedContactIds.includes(contact.id)
                            )
                          }
                        >
                          <Checkbox
                            checked={selectedContactIds.includes(contact.id)}
                            onCheckedChange={(checked) =>
                              toggleContact(contact.id, checked === true)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {contact.phone}
                            </div>
                          </div>
                          {selectedContactIds.includes(contact.id) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        No contacts match your search.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                2. Compose Message
              </CardTitle>
              <CardDescription>
                Select a template, write custom message, or use AI Agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={messageType}
                onValueChange={(v) => setMessageType(v as any)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="template" className="flex-1">
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">
                    Custom
                  </TabsTrigger>
                  <TabsTrigger value="ai_agent" className="flex-1">
                    <Bot className="mr-1 h-4 w-4" />
                    AI Agent
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hello_world">
                          hello_world (Default)
                        </SelectItem>
                        {approvedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTemplateId && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Smartphone className="h-4 w-4" />
                        Preview: {selectedTemplateName}
                      </div>
                      <PhonePreview body={message} className="py-2" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Message Text</Label>
                    <Textarea
                      placeholder="Type your message here... Use {{name}} for personalization"
                      className="min-h-[120px]"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Note: Custom messages require the recipient to have
                      messaged you first (24-hour window rule).
                    </p>
                  </div>
                  {message && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Smartphone className="h-4 w-4" />
                        Preview
                      </div>
                      <PhonePreview body={message} className="py-2" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ai_agent" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select AI Agent</Label>
                    <Select
                      value={selectedAgentId}
                      onValueChange={setSelectedAgentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an AI agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAgents.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No active agents. Create one first.
                          </SelectItem>
                        ) : (
                          activeAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedAgentId && (
                      <p className="text-sm text-muted-foreground">
                        The AI agent will generate personalized messages for
                        each recipient using the hello_world template.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Checkbox
                  id="schedule"
                  checked={isScheduled}
                  onCheckedChange={(checked) =>
                    setIsScheduled(checked === true)
                  }
                />
                <Label htmlFor="schedule" className="cursor-pointer">
                  Schedule for later
                </Label>
              </div>

              {isScheduled && (
                <div className="space-y-2">
                  <Label>Schedule Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {scheduledTime && new Date(scheduledTime) <= new Date() && (
                    <p className="text-xs text-red-500">
                      Time must be in the future
                    </p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                type="button"
                onClick={handleSendBroadcast}
                disabled={isSending || !campaignName.trim()}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isScheduled ? (
                  <Calendar className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending
                  ? "Processing..."
                  : isScheduled
                  ? "Schedule Broadcast"
                  : `Send to ${totalSelected} Contacts`}
              </Button>
              {!campaignName.trim() && (
                <p className="text-xs text-red-500 text-center">
                  Please enter a campaign name to send
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
