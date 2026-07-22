// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Download,
  MessageSquare,
  RefreshCw,
  Reply,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { Badge } from "@whatsapp/components/ui/badge";
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@whatsapp/components/ui/dialog";
import { Input } from "@whatsapp/components/ui/input";
import { getAuthHeaders } from "@whatsapp/contexts/AuthContext";

const SINGLE_MESSAGE_CAMPAIGN_NAME = "Single Message";

interface SingleMessageLog {
  id: string;
  campaignName: string;
  contactName: string;
  contactPhone: string;
  messageType: "template" | "custom" | "ai_agent";
  templateName?: string;
  message?: string;
  status: "sent" | "delivered" | "read" | "failed" | "pending";
  messageId?: string;
  error?: string;
  timestamp: string;
  replied?: boolean;
  repliedAt?: string;
}

const formatDate = (value?: string, pattern = "MMM d, yyyy HH:mm") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, pattern);
};

const isSentStatus = (status: string) =>
  status === "sent" || status === "delivered" || status === "read";

const isDeliveredStatus = (status: string) =>
  status === "delivered" || status === "read";

export default function SingleMessageReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [failureLog, setFailureLog] = useState<SingleMessageLog | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery<SingleMessageLog[]>({
    queryKey: ["/api/broadcast/logs", "single-message-report"],
    queryFn: async () => {
      const res = await fetch(
        `/api/broadcast/logs?limit=1000&campaignName=${encodeURIComponent(SINGLE_MESSAGE_CAMPAIGN_NAME)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch single message logs");
      const data = await res.json();
      return Array.isArray(data)
        ? data.filter((log) => log.campaignName === SINGLE_MESSAGE_CAMPAIGN_NAME)
        : [];
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [
        log.contactName,
        log.contactPhone,
        log.status,
        log.messageType,
        log.templateName,
        log.message,
        log.messageId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [logs, searchQuery]);

  const stats = useMemo(
    () => ({
      total: logs.length,
      sent: logs.filter((log) => isSentStatus(log.status)).length,
      delivered: logs.filter((log) => isDeliveredStatus(log.status)).length,
      read: logs.filter((log) => log.status === "read").length,
      failed: logs.filter((log) => log.status === "failed").length,
      pending: logs.filter((log) => log.status === "pending").length,
      replied: logs.filter((log) => log.replied).length,
    }),
    [logs]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500"><CheckCircle className="mr-1 h-3 w-3" />Sent</Badge>;
      case "delivered":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Delivered</Badge>;
      case "read":
        return <Badge className="bg-indigo-600"><CheckCircle className="mr-1 h-3 w-3" />Read</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "Contact Name",
      "Phone",
      "Message Type",
      "Template",
      "Message",
      "Status",
      "Replied",
      "Replied At",
      "Message ID",
      "Error",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          formatDate(log.timestamp, "yyyy-MM-dd HH:mm:ss"),
          `"${log.contactName || ""}"`,
          log.contactPhone,
          log.messageType,
          log.templateName || "",
          `"${log.message || ""}"`,
          log.status,
          log.replied ? "Yes" : "No",
          log.repliedAt ? formatDate(log.repliedAt, "yyyy-MM-dd HH:mm:ss") : "",
          log.messageId || "",
          `"${log.error || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `single-message-report-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Single Message Reports</h2>
            <p className="text-muted-foreground">Full delivery report for one-off WhatsApp messages.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.sent}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats.delivered}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <CheckCircle className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-indigo-600">{stats.read}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div></CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replied</CardTitle>
              <Reply className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">{stats.replied}</div></CardContent>
          </Card>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Message Logs</CardTitle>
            <CardDescription>Search by contact, phone, status, template, message, or message ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search single message reports..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <div className="overflow-hidden rounded-lg border">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>No single message reports found.</p>
                  <p className="text-sm">Send a single message to see delivery status here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Message</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Replied</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Sent At</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Message ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 text-sm font-medium">{log.contactName || "Unknown"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{log.contactPhone}</td>
                          <td className="px-4 py-3 text-sm capitalize text-muted-foreground">
                            {log.messageType.replace("_", " ")}
                          </td>
                          <td className="max-w-[260px] px-4 py-3 text-sm">
                            <div className="truncate" title={log.message || log.templateName || ""}>
                              {log.message || log.templateName || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(log.status)}
                              {log.status === "failed" && (
                                <button
                                  type="button"
                                  className="text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
                                  onClick={() => setFailureLog(log)}
                                >
                                  Reason
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.replied ? (
                              <Badge className="bg-purple-500"><Reply className="mr-1 h-3 w-3" />Yes</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">No</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(log.timestamp, "MMM d, HH:mm")}</td>
                          <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-muted-foreground">
                            <div className="truncate" title={log.messageId || ""}>{log.messageId || "-"}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(failureLog)} onOpenChange={(open) => !open && setFailureLog(null)}>
        <DialogContent className="max-w-lg rounded-lg p-0">
          <DialogHeader className="border-b px-6 py-5 pr-14">
            <DialogTitle className="text-xl">Failed message reason</DialogTitle>
            <DialogDescription className="text-sm">
              {failureLog?.contactName || "Unknown"} - {failureLog?.contactPhone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div>
              <div className="mb-2 text-sm font-medium text-muted-foreground">Reason</div>
              <div className="max-h-44 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
                {failureLog?.error || "No failure reason was provided by WhatsApp webhook."}
              </div>
            </div>
            {failureLog?.messageId && (
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">Message ID</div>
                <div className="break-all rounded-md border bg-muted/40 p-3 font-mono text-xs leading-5 text-muted-foreground">
                  {failureLog.messageId}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
