import { useEffect, useState } from "react"
import {
  Activity,
  Eye,
  ListFilter,
  MailCheck,
  MousePointerClick,
  Send,
  ShieldAlert,
  UserMinus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { emailMarketingRequest } from "../emailMarketingApi"
import { MetricCard, ModulePage, PageContainer } from "../components/PageElements"

const ranges = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Custom range"] as const
type DashboardRange = (typeof ranges)[number]

interface AnalyticsTotals {
  delivered: number
  uniqueOpens: number
  uniqueClicks: number
  unsubscribes: number
}

interface AnalyticsOverview {
  totals: AnalyticsTotals
  recentEvents: TrackingEvent[]
}

interface TrackingEvent {
  id: string
  campaignId: string
  campaignName: string
  recipientEmail: string
  eventType: string
  timestamp: string
}

const emptyTotals: AnalyticsTotals = {
  delivered: 0,
  uniqueOpens: 0,
  uniqueClicks: 0,
  unsubscribes: 0,
}

function getRangeParams(range: DashboardRange) {
  const now = new Date()
  const params = new URLSearchParams()

  if (range === "Today") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    params.set("from", start.toISOString())
    params.set("to", now.toISOString())
  } else if (range === "Yesterday") {
    const end = new Date(now)
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(start.getDate() - 1)
    params.set("from", start.toISOString())
    params.set("to", end.toISOString())
  } else {
    params.set("days", range === "Last 7 days" ? "7" : "30")
  }

  return params
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value))
}

export function OverviewPage() {
  const { subscribers, templates, segments, suppressions, campaigns } = useEmailMarketingStore()
  const [range, setRange] = useState<DashboardRange>("Last 7 days")
  const [analytics, setAnalytics] = useState<AnalyticsTotals>(emptyTotals)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])

  const subscribed = subscribers.filter((subscriber) => subscriber.status === "subscribed").length
  const unsubscribed = subscribers.filter((subscriber) => subscriber.status === "unsubscribed").length
  const suppressed = subscribers.filter((subscriber) => subscriber.status === "suppressed").length
  useEffect(() => {
    let cancelled = false
    const params = getRangeParams(range)

    const loadDashboardData = async () => {
      try {
        const response = await emailMarketingRequest<AnalyticsOverview>(
          "get",
          `/analytics/overview?${params.toString()}`,
        )
        if (!cancelled) {
          setAnalytics({ ...emptyTotals, ...response.totals })
          setTrackingEvents(response.recentEvents || [])
        }
      } catch {
        if (!cancelled) {
          setAnalytics({
            delivered: campaigns.reduce((sum, campaign) => sum + campaign.metrics.delivered, 0),
            uniqueOpens: campaigns.reduce((sum, campaign) => sum + campaign.metrics.opens, 0),
            uniqueClicks: campaigns.reduce((sum, campaign) => sum + campaign.metrics.clicks, 0),
            unsubscribes: campaigns.reduce((sum, campaign) => sum + campaign.metrics.unsubscribes, 0),
          })
          setTrackingEvents([])
        }
      }
    }

    void loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [campaigns, range])

  const metrics = [
    { label: "Campaigns", value: campaigns.length, helper: `${campaigns.filter((campaign) => campaign.status === "scheduled").length} scheduled`, icon: <Send className="h-5 w-5" />, tone: "primary" as const },
    { label: "Delivered", value: analytics.delivered, helper: `${analytics.delivered} delivery events recorded`, icon: <MailCheck className="h-5 w-5" />, tone: "success" as const },
    { label: "Opens", value: analytics.uniqueOpens, helper: `${analytics.uniqueOpens} unique opens`, icon: <Eye className="h-5 w-5" />, tone: "success" as const },
    { label: "Clicks", value: analytics.uniqueClicks, helper: `${analytics.uniqueClicks} unique clicks`, icon: <MousePointerClick className="h-5 w-5" />, tone: "primary" as const },
    { label: "Active audience", value: subscribed, helper: `${subscribers.length} total contacts`, icon: <Users className="h-5 w-5" />, tone: "primary" as const },
    { label: "Unsubscribes", value: Math.max(unsubscribed, analytics.unsubscribes), helper: "Audience opt-outs", icon: <UserMinus className="h-5 w-5" />, tone: "warning" as const },
    { label: "Suppressions", value: Math.max(suppressed, suppressions.length), helper: "Blocked from future sends", icon: <ShieldAlert className="h-5 w-5" />, tone: "warning" as const },
    { label: "Saved segments", value: segments.length, helper: `${templates.length} email templates`, icon: <ListFilter className="h-5 w-5" />, tone: "muted" as const },
  ]

  return (
    <ModulePage>
      <PageContainer>
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Email Marketing Dashboard
          </h2>
          <div className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <Button
                key={item}
                variant={range === item ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setRange(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Audience growth</h3>
              <p className="mt-1 text-xs text-muted-foreground">Subscriber status distribution</p>
            </div>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-[160px_1fr] md:items-center">
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[16px] border-primary/15">
              <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-t-primary" />
              <div className="text-center">
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-[11px] text-muted-foreground">Total contacts</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                ["Subscribed", subscribed, "bg-emerald-500"],
                ["Unsubscribed", unsubscribed, "bg-amber-500"],
                ["Suppressed", suppressed, "bg-destructive"],
              ].map(([label, value, color]) => {
                const count = Number(value)
                const percent = subscribers.length ? Math.round((count / subscribers.length) * 100) : 0
                return (
                  <div key={String(label)}>
                    <div className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="text-muted-foreground">{count} · {percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Recent activity
            </p>
            <h3 className="mt-1 text-base font-semibold text-card-foreground">Latest email events</h3>
          </div>
          {trackingEvents.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Recipient</TableHead>
                  <TableHead className="text-xs">Campaign</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="py-3 text-xs font-medium capitalize">
                      {event.eventType.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {event.recipientEmail || "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {event.campaignName || campaigns.find((campaign) => campaign.id === event.campaignId)?.name || "Campaign"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-xs text-muted-foreground">
                      {formatEventTime(event.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-36 items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Email delivery, open, click, bounce, complaint, and unsubscribe events will appear here.
            </div>
          )}
        </section>
      </PageContainer>
    </ModulePage>
  )
}
