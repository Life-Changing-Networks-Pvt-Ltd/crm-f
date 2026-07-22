// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  CalendarDays,
  CheckCheck,
  Eye,
  IndianRupee,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@whatsapp/components/ui/badge";
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Input } from "@whatsapp/components/ui/input";
import { Progress } from "@whatsapp/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@whatsapp/components/ui/table";
import { fetchWithAuth } from "@whatsapp/lib/fetchWithAuth";

type ReportType = "messages" | "templates" | "pricing";

interface UsageReportPageProps {
  type: ReportType;
}

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value || 0);

const statusClass: Record<string, string> = {
  read: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  failed: "bg-red-100 text-red-700 hover:bg-red-100",
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

const sourceLabel: Record<string, string> = {
  inbox: "WhatsApp Inbox",
  broadcast: "Broadcast",
  drip: "Drip Campaign",
  otp: "Platform OTP",
  voice_marketing: "Voice Marketing",
  platform: "Platform Message",
  platform_template: "Platform Template",
  account_marketing: "Account Marketing",
  account_service: "Account Service",
};

const pageCopy = {
  messages: {
    title: "Message Usage",
    description:
      "Account-wise message activity with recipient, direction, delivery status, date and time.",
  },
  templates: {
    title: "Template Usage",
    description:
      "Template sends, delivery, reads, failures and recipient-level usage for this account.",
  },
  pricing: {
    title: "Pricing Usage",
    description:
      "Chargeable template usage calculated at ₹0.85 per successful template message.",
  },
};

export default function UsageReportPage({ type }: UsageReportPageProps) {
  const today = useMemo(() => new Date(), []);
  const monthAgo = useMemo(
    () => new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
    [today]
  );
  const [filters, setFilters] = useState({
    search: "",
    fromDate: toInputDate(monthAgo),
    toDate: toInputDate(today),
    status: "all",
    direction: "all",
    source: "all",
    template: "all",
    page: 1,
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== "all") params.set(key, String(value));
    });
    params.set("limit", "25");
    return params.toString();
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["/api/usage", type, queryString],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/usage/${type}?${queryString}`);
      if (!response.ok) throw new Error("Failed to load usage report");
      return response.json();
    },
    staleTime: 15000,
  });

  const updateFilter = (key: string, value: string) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const summary = data?.summary || {};
  const timelineMax = Math.max(
    1,
    ...(data?.timeline || []).map((point: any) =>
      type === "pricing" ? point.cost : point.total
    )
  );
  const title = pageCopy[type];

  const summaryCards =
    type === "pricing"
      ? [
          ["Total Cost", money(summary.totalCost), IndianRupee, "text-emerald-600"],
          ["Chargeable Templates", summary.chargeableTemplates || 0, Send, "text-blue-600"],
          ["Unit Price", money(summary.unitPrice || 0.85), IndianRupee, "text-violet-600"],
          ["Recipients", summary.uniqueRecipients || 0, Users, "text-orange-600"],
        ]
      : [
          [
            type === "templates" ? "Template Sends" : "Total Messages",
            type === "templates"
              ? summary.templateMessages || 0
              : summary.totalMessages || 0,
            MessageSquare,
            "text-blue-600",
          ],
          ["Delivered", summary.delivered || 0, CheckCheck, "text-emerald-600"],
          ["Read", summary.read || 0, Eye, "text-violet-600"],
          ["Failed", summary.failed || 0, XCircle, "text-red-600"],
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title.title}</h1>
          <p className="mt-1 text-muted-foreground">{title.description}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Name, phone, campaign or message"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </div>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(event) => updateFilter("fromDate", event.target.value)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.toDate}
              onChange={(event) => updateFilter("toDate", event.target.value)}
              aria-label="To date"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            {type === "messages" ? (
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.direction}
                  onChange={(event) => updateFilter("direction", event.target.value)}
                >
                  <option value="all">All directions</option>
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.source}
                  onChange={(event) => updateFilter("source", event.target.value)}
                >
                  <option value="all">All sources</option>
                  {(data?.filters?.sources || []).map((source: string) => (
                    <option key={source} value={source}>
                      {sourceLabel[source] || source.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.template}
                  onChange={(event) => updateFilter("template", event.target.value)}
                >
                  <option value="all">All templates</option>
                  {(data?.filters?.templates || []).map((template: string) => (
                    <option key={template} value={template.toLowerCase()}>
                      {template}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.source}
                  onChange={(event) => updateFilter("source", event.target.value)}
                >
                  <option value="all">All sources</option>
                  {(data?.filters?.sources || []).map((source: string) => (
                    <option key={source} value={source}>
                      {sourceLabel[source] || source.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([label, value, Icon, color]) => (
          <Card key={String(label)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {type !== "pricing" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-bold">{summary.deliveryRate || 0}%</div>
              <Progress value={summary.deliveryRate || 0} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Read Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-bold">{summary.readRate || 0}%</div>
              <Progress value={summary.readRate || 0} />
              <p className="mt-2 text-xs text-muted-foreground">
                Read ÷ delivered messages, reconciled from Meta webhook events.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {type === "pricing" ? "Daily Cost" : "Activity by Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.timeline || []).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity for selected filters.
                </p>
              )}
              {(data?.timeline || []).map((point: any) => {
                const value = type === "pricing" ? point.cost : point.total;
                return (
                  <div key={point.date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{new Date(`${point.date}T00:00:00`).toLocaleDateString("en-IN")}</span>
                      <span className="font-medium">
                        {type === "pricing" ? money(value) : `${value} messages`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${Math.max(3, (value / timelineMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {type === "messages" ? "Usage by Recipient" : "Usage by Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{type === "messages" ? "Recipient" : "Template"}</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                  {type !== "messages" && <TableHead className="text-right">Cost</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(type === "messages" ? data?.byRecipient : data?.byTemplate)
                  ?.slice(0, 10)
                  .map((row: any) => (
                    <TableRow key={row.contactPhone || row.templateName}>
                      <TableCell>
                        <div className="font-medium">
                          {row.contactName || row.templateName}
                        </div>
                        {row.contactPhone && (
                          <div className="text-xs text-muted-foreground">
                            {row.contactPhone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">{row.delivered}</TableCell>
                      <TableCell className="text-right">{row.read}</TableCell>
                      {type !== "messages" && (
                        <TableCell className="text-right">{money(row.cost)}</TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Usage</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? (
            <p className="py-10 text-center text-sm text-red-600">
              Usage report could not be loaded.
            </p>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  {type !== "messages" && <TableHead>Template</TableHead>}
                  <TableHead>Campaign / Source</TableHead>
                  {type === "messages" && <TableHead>Direction</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  {type === "pricing" && <TableHead className="text-right">Charge</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.rows || []).map((row: any) => (
                  <TableRow key={`${row.source}-${row.id}`}>
                    <TableCell>
                      <div className="font-medium">{row.contactName || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{row.contactPhone || "—"}</div>
                    </TableCell>
                    {type !== "messages" && (
                      <TableCell>{row.templateName || "Unknown template"}</TableCell>
                    )}
                    <TableCell>
                      <div>{row.campaignName || row.source}</div>
                      <div className="text-xs text-muted-foreground">
                        {sourceLabel[row.source] || row.source?.replaceAll("_", " ")}
                      </div>
                    </TableCell>
                    {type === "messages" && (
                      <TableCell className="capitalize">{row.direction}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[row.status] || ""}>{row.status}</Badge>
                        {row.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const parts = [];
                              if (row.errorTitle) parts.push(row.errorTitle);
                              if (row.errorMessage) parts.push(row.errorMessage);
                              if (row.errorDetails) parts.push(row.errorDetails);
                              if (row.failureReason) parts.push(row.failureReason);
                              if (row.failure_reason) parts.push(row.failure_reason);
                              if (row.error) parts.push(row.error);
                              if (row.reason) parts.push(row.reason);
                              if (row.errorCode) parts.push(`Error Code: ${row.errorCode}`);
                              
                              // Check if there's any specific error string embedded in an object if needed
                              const reason = parts.filter(Boolean).join(" | ") || "No detailed reason provided by the provider.";
                              
                              Swal.fire({
                                title: "Failure Reason",
                                text: reason,
                                icon: "error",
                                confirmButtonColor: "#3085d6",
                              });
                            }}
                          >
                            See Reason
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(row.timestamp)}
                    </TableCell>
                    {type === "pricing" && (
                      <TableCell className="text-right font-medium">
                        {row.status === "failed" || row.status === "pending"
                          ? money(0)
                          : money(summary.unitPrice || 0.85)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(data?.rows || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      No usage found for selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
                {data.pagination.total} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.max(1, current.page - 1),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= data.pagination.totalPages}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: current.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
