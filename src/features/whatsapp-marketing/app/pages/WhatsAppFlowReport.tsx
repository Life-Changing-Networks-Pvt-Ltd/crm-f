// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Eye, Download, Clock, MessageSquare, Send, CheckCheck } from "lucide-react";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Input } from "@whatsapp/components/ui/input";
import { Button } from "@whatsapp/components/ui/button";
import { Badge } from "@whatsapp/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@whatsapp/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@whatsapp/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@whatsapp/components/ui/dialog";

const fetchJson = async (path: string) => {
  const response = await fetchWithAuth(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || data?.message || "Request failed");
  return data;
};

const dateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : format(date, "dd MMM yyyy, HH:mm:ss");
};

const jsonText = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const badgeClass = (status: string) => {
  const value = String(status || "").toLowerCase();
  if (["published", "delivered", "read", "responded", "accepted"].includes(value))
    return "bg-emerald-100 text-emerald-800";
  if (["failed", "blocked"].includes(value)) return "bg-red-100 text-red-800";
  if (["draft", "attempted", "sent"].includes(value)) return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
};

export default function WhatsAppFlowReport() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailSearch, setDetailSearch] = useState("");
  const [trace, setTrace] = useState<any>(null);

  const params = useMemo(() => {
    const value = new URLSearchParams({
      page: String(page),
      limit: "10",
      sortBy,
      sortOrder,
    });
    if (search) value.set("search", search);
    if (status !== "all") value.set("status", status);
    if (fromDate) value.set("fromDate", fromDate);
    if (toDate) value.set("toDate", toDate);
    return value;
  }, [page, search, status, fromDate, toDate, sortBy, sortOrder]);

  const listQuery = useQuery({
    queryKey: ["whatsapp-flow-reports", params.toString()],
    queryFn: () => fetchJson(`/api/webhook/whatsapp/flows/reports?${params}`),
    refetchInterval: 15_000,
  });

  const detailParams = useMemo(() => {
    const value = new URLSearchParams();
    if (detailSearch) value.set("search", detailSearch);
    if (fromDate) value.set("fromDate", fromDate);
    if (toDate) value.set("toDate", toDate);
    return value;
  }, [detailSearch, fromDate, toDate]);

  const detailsQuery = useQuery({
    queryKey: ["whatsapp-flow-report-details", selectedFlow?._id, detailParams.toString()],
    queryFn: () =>
      fetchJson(
        `/api/webhook/whatsapp/flows/reports/${selectedFlow?._id}/details?${detailParams}`
      ),
    enabled: detailsOpen && Boolean(selectedFlow?._id),
    refetchInterval: 15_000,
  });

  const rows = listQuery.data?.data || [];
  const totalPages = Math.max(
    1,
    Math.ceil((listQuery.data?.meta?.total || 0) / (listQuery.data?.meta?.limit || 10))
  );

  const summary = rows.reduce(
    (acc: any, row: any) => {
      const metrics = row.reportMetrics || {};
      acc.sent += metrics.accepted || 0;
      acc.responses += metrics.responses || 0;
      acc.conversations += metrics.totalConversations || 0;
      acc.read += metrics.read || 0;
      return acc;
    },
    { sent: 0, responses: 0, conversations: 0, read: 0 }
  );

  const openDetails = (flow: any) => {
    setSelectedFlow(flow);
    setDetailSearch("");
    setDetailsOpen(true);
  };

  const downloadJson = (value: unknown, filename: string) => {
    const url = URL.createObjectURL(
      new Blob([jsonText(value)], { type: "application/json" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Flow Reports</h1>
        <p className="text-muted-foreground">
          Complete send, delivery, conversation and customer response timeline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Accepted Sends", summary.sent, Send],
          ["Customer Responses", summary.responses, MessageSquare],
          ["Conversations", summary.conversations, Clock],
          ["Read", summary.read, CheckCheck],
        ].map(([label, value, Icon]: any) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>
              <Icon className="h-6 w-6 text-violet-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Flow name or Meta ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
            <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="createdAt">Created At</SelectItem><SelectItem value="updatedAt">Updated At</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="desc">Newest First</SelectItem><SelectItem value="asc">Oldest First</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); setFromDate(""); setToDate(""); setPage(1); }}>Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow</TableHead><TableHead>Status</TableHead>
                <TableHead>Attempted</TableHead><TableHead>Accepted</TableHead>
                <TableHead>Delivered</TableHead><TableHead>Read</TableHead>
                <TableHead>Responses</TableHead><TableHead>Conversations</TableHead>
                <TableHead>Last Activity</TableHead><TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((flow: any) => {
                const m = flow.reportMetrics || {};
                return (
                  <TableRow key={flow._id}>
                    <TableCell><div className="font-medium">{flow.name}</div><div className="text-xs text-muted-foreground">{flow.flowId}</div></TableCell>
                    <TableCell><Badge className={badgeClass(flow.status)}>{flow.status}</Badge></TableCell>
                    <TableCell>{m.attempted || 0}</TableCell><TableCell>{m.accepted || 0}</TableCell>
                    <TableCell>{m.delivered || 0}</TableCell><TableCell>{m.read || 0}</TableCell>
                    <TableCell>{m.responses || 0}</TableCell><TableCell>{m.totalConversations || 0}</TableCell>
                    <TableCell>{dateTime(m.lastResponseAt || m.lastSentAt || flow.updatedAt)}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => openDetails(flow)}><Eye className="mr-2 h-4 w-4" />Details</Button></TableCell>
                  </TableRow>
                );
              })}
              {!listQuery.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No Flow report data found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-y-auto xl:max-w-7xl">
          <DialogHeader><DialogTitle>{selectedFlow?.name} — Complete Flow Report</DialogTitle></DialogHeader>
          <Input placeholder="Search phone, name, message ID or Flow token" value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} />
          {detailsQuery.data && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
                {Object.entries(detailsQuery.data.totals || {}).map(([key, value]) => (
                  <div key={key} className="rounded-lg border p-3"><div className="text-xl font-bold">{String(value)}</div><div className="text-xs capitalize text-muted-foreground">{key.replaceAll("_", " ")}</div></div>
                ))}
              </div>
              <div className="space-y-4">
                {(detailsQuery.data.conversations || []).map((item: any, index: number) => (
                  <Card key={item.send?.id || item.response?.id || index}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><CardTitle className="text-base">{item.send?.contactName || item.response?.contactName || item.send?.contactPhone || item.response?.contactPhone}</CardTitle><div className="text-xs text-muted-foreground">{item.send?.contactPhone || item.response?.contactPhone} · {item.send?.messageId || "Historical response"}</div></div>
                        <div className="flex items-center gap-2"><Badge className={badgeClass(item.response ? "responded" : item.send?.status)}>{item.response ? "responded" : item.send?.status || "response only"}</Badge><Badge variant="outline">{item.durationMinutes} min</Badge></div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative space-y-3 border-l-2 border-violet-200 pl-5">
                        {(item.timeline || []).map((event: any, eventIndex: number) => (
                          <div key={eventIndex} className="relative">
                            <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-violet-600" />
                            <div className="flex flex-wrap items-center gap-2"><Badge className={badgeClass(event.status)}>{event.status}</Badge><span className="text-sm font-medium">{event.detail}</span><span className="text-xs text-muted-foreground">{dateTime(event.at)}</span></div>
                            {(event.conversationId || event.pricingCategory) && <div className="mt-1 text-xs text-muted-foreground">Conversation: {event.conversationId || "-"} · Pricing: {event.pricingCategory || "-"}</div>}
                          </div>
                        ))}
                      </div>
                      {item.response && <div><div className="mb-2 font-medium">Customer Response</div><div className="grid gap-2 md:grid-cols-2">{Object.entries(item.response.responseJson || {}).map(([key, value]) => <div key={key} className="rounded-md border bg-muted/30 p-3"><div className="text-xs uppercase text-muted-foreground">{key.replaceAll("_", " ")}</div><div className="mt-1 break-words text-sm">{typeof value === "object" ? jsonText(value) : String(value)}</div></div>)}</div></div>}
                      <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setTrace(item)}>Full Trace</Button><Button size="sm" variant="outline" onClick={() => downloadJson(item, `flow-trace-${index + 1}.json`)}><Download className="mr-2 h-4 w-4" />JSON</Button></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(trace)} onOpenChange={(open) => !open && setTrace(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Complete Technical Trace</DialogTitle></DialogHeader>
          <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">{jsonText(trace)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
