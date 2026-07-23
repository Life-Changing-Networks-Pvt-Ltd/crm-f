import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { AlertTriangle, Ban, MailX, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { emailMarketingRequest } from "../emailMarketingApi"
import { EmptyPanel, MetricCard, ModulePage, PageContainer, PageHeading, SearchField, StatusPill, formatDate } from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import { aggregateCampaigns, number, rate } from "./analyticsUtils"

type DeliverabilityView = "bounces" | "complaints" | "unsubscribes" | "blocked"
const tabs: Array<[DeliverabilityView, string, string]> = [["bounces", "Bounce emails", "/deliverability/bounces"], ["complaints", "Complaints & suppressions", "/deliverability/complaints-suppressions"], ["unsubscribes", "Unsubscribes", "/deliverability/unsubscribes"], ["blocked", "Blocked recipients", "/deliverability/blocked-future-emails"]]

export function DeliverabilityPage({ view }: { view: DeliverabilityView }) {
  const { campaigns, suppressions, subscribers } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const fallbackTotals = useMemo(() => aggregateCampaigns(campaigns), [campaigns])
  const [tracked, setTracked] = useState<{
    totals: Record<string, number>
    rates: { deliveryRate: number; bounceRate: number }
  } | null>(null)
  useEffect(() => {
    void emailMarketingRequest<{
      totals: Record<string, number>
      rates: { deliveryRate: number; bounceRate: number }
    }>("get", "/analytics/deliverability?days=30")
      .then(setTracked)
      .catch(() => setTracked(null))
  }, [])
  const totals = {
    ...fallbackTotals,
    sent: tracked?.totals.send ?? fallbackTotals.sent,
    delivered: tracked?.totals.delivery ?? fallbackTotals.delivered,
    bounces: tracked?.totals.bounce ?? fallbackTotals.bounces,
  }
  const relevant = suppressions.filter((item) => view === "bounces" ? item.type === "bounce" : view === "complaints" ? ["complaint", "manual"].includes(item.type) : view === "unsubscribes" ? item.type === "unsubscribe" : true).filter((item) => !query || `${item.email} ${item.reason}`.toLowerCase().includes(query.toLowerCase()))
  const blocked = subscribers.filter((item) => item.blocked || item.status === "suppressed")
  return <ModulePage><PageContainer><PageHeading title="Deliverability metrics" description="Monitor bounces, complaints, unsubscribes, suppressions, and recipients blocked from future sends." />
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2">{tabs.map(([key, label, path]) => <Button key={key} variant={view === key ? "default" : "ghost"} size="sm" asChild><Link to={getEmailMarketingPath(path) as never}>{label}</Link></Button>)}</nav>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Delivery rate" value={rate(totals.delivered, totals.sent)} helper={`${number(totals.delivered)} of ${number(totals.sent)} delivered`} icon={<MailX className="h-5 w-5" />} tone="success" /><MetricCard label="Bounce rate" value={rate(totals.bounces, totals.sent)} helper={`${number(totals.bounces)} send events`} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" /><MetricCard label="Complaint records" value={suppressions.filter((item) => item.type === "complaint").length} helper="Suppression-based complaints" icon={<ShieldAlert className="h-5 w-5" />} /><MetricCard label="Blocked recipients" value={blocked.length} helper="Excluded from future sends" icon={<Ban className="h-5 w-5" />} tone="muted" /></section>
    <section className="rounded-2xl border bg-card"><div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">{tabs.find(([key]) => key === view)?.[1]}</h3><p className="mt-1 text-xs text-muted-foreground">Frontend records from subscriber and suppression management.</p></div><SearchField value={query} onChange={setQuery} placeholder="Search email or reason..." className="md:w-80" /></div>
      {(view === "blocked" ? blocked : relevant).length ? <div className="divide-y">{view === "blocked" ? blocked.map((item) => <div key={item.id} className="grid gap-2 p-5 text-sm md:grid-cols-4"><div><p className="font-medium">{item.email}</p><p className="text-xs text-muted-foreground">{item.firstName} {item.lastName}</p></div><StatusPill status="blocked" /><span className="text-muted-foreground">{item.source || "Unknown source"}</span><span className="text-muted-foreground">Updated {formatDate(item.updatedAt)}</span></div>) : relevant.map((item) => <div key={item.id} className="grid gap-2 p-5 text-sm md:grid-cols-4"><div><p className="font-medium">{item.email}</p><p className="text-xs text-muted-foreground">Recipient</p></div><StatusPill status={item.type} /><span className="text-muted-foreground">{item.reason || "No reason recorded"}</span><span className="text-muted-foreground">{formatDate(item.createdAt)}</span></div>)}</div> : <div className="p-5"><EmptyPanel title="No deliverability records" description="Relevant bounce, complaint, unsubscribe, or block records will appear here." /></div>}
    </section><p className="text-xs text-muted-foreground">Delivery, bounce, and complaint metrics are populated from tracked backend events and SES webhooks.</p>
  </PageContainer></ModulePage>
}
