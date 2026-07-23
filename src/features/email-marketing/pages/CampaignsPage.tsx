import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Repeat2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEmailMarketingStore } from "../EmailMarketingStore"
import { CampaignPresetDialog } from "../components/CampaignPresetDialog"
import {
  EmptyPanel,
  ModulePage,
  PageContainer,
  SearchField,
  StatusPill,
  formatDate,
} from "../components/PageElements"
import { getEmailMarketingPath } from "../navigation"
import type { CampaignStatus, EmailCampaign } from "../types"
import { campaignTypeLabels, formatDateTime } from "./campaignUtils"

const statusTabs: CampaignStatus[] = [
  "draft",
  "scheduled",
  "active",
  "sending",
  "sent",
  "paused",
  "failed",
  "archived",
]

type CampaignScope = "all" | "recurring" | "broadcast" | "drip"
type CreateMode = "campaign" | "drip" | null

interface CampaignsPageProps {
  initialCreateMode?: Exclude<CreateMode, null>
}

const PAGE_SIZE = 10

function audienceLabel(campaign: EmailCampaign) {
  if (campaign.audienceMode === "segment") return "Saved segment"
  if (campaign.audienceMode === "selected") return "Selected contacts"
  return "All subscribers"
}

function scheduleLabel(campaign: EmailCampaign) {
  if (campaign.type === "drip_campaign") return `${campaign.dripSteps.length} email step(s)`
  if (campaign.status === "sent") return "Sent"
  if (!campaign.scheduledAt) return "Not scheduled"
  return formatDateTime(campaign.scheduledAt)
}

export function CampaignsPage({ initialCreateMode }: CampaignsPageProps) {
  const navigate = useNavigate()
  const { campaigns, duplicateCampaign, setCampaignStatus, deleteCampaign } = useEmailMarketingStore()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<CampaignStatus | "all">("all")
  const [scope, setScope] = useState<CampaignScope>("all")
  const [createMode, setCreateMode] = useState<CreateMode>(initialCreateMode || null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const filterRowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    setCreateMode(initialCreateMode || null)
  }, [initialCreateMode])

  useEffect(() => {
    setPage(1)
  }, [query, status, scope])

  useEffect(() => {
    const row = filterRowRef.current
    if (!row) return
    const updateScrollState = () => {
      setCanScrollLeft(row.scrollLeft > 2)
      setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 2)
    }
    updateScrollState()
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(row)
    window.addEventListener("resize", updateScrollState)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateScrollState)
    }
  }, [])

  const filtered = useMemo(() => campaigns.filter((campaign) => {
    const searchValue = `${campaign.name} ${campaign.subject} ${campaign.fromEmail}`.toLowerCase()
    const matchesScope = scope === "all"
      || (scope === "recurring" && campaign.isRecurring)
      || (scope === "broadcast" && campaign.type === "broadcast")
      || (scope === "drip" && campaign.type === "drip_campaign")

    return (!query || searchValue.includes(query.toLowerCase()))
      && (status === "all" || campaign.status === status)
      && matchesScope
  }), [campaigns, query, scope, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleCampaigns = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const handleDialogChange = (open: boolean) => {
    if (open) return
    setCreateMode(null)
    if (initialCreateMode) {
      void navigate({ to: getEmailMarketingPath("/campaigns") as never })
    }
  }

  const runAction = async (action: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    setActionId(null)
    try {
      await action()
      toast.success(successMessage)
    } catch {
      toast.error(errorMessage)
    }
  }

  const duplicate = (campaign: EmailCampaign) => {
    void runAction(
      () => duplicateCampaign(campaign.id),
      "Campaign duplicated",
      "Campaign could not be duplicated.",
    )
  }

  const changeStatus = (campaign: EmailCampaign, nextStatus: CampaignStatus) => {
    void runAction(
      () => setCampaignStatus(campaign.id, nextStatus),
      `Campaign moved to ${nextStatus}.`,
      `Campaign could not be moved to ${nextStatus}.`,
    )
  }

  const remove = (campaign: EmailCampaign) => {
    setActionId(null)
    if (!window.confirm(`Delete ${campaign.name}?`)) return
    void runAction(
      () => deleteCampaign(campaign.id),
      "Campaign deleted",
      "Only eligible draft, failed, or archived campaigns can be deleted.",
    )
  }

  const scrollFilters = (direction: "left" | "right") => {
    filterRowRef.current?.scrollBy({
      left: direction === "right" ? 320 : -320,
      behavior: "smooth",
    })
  }

  const filterClass = (active: boolean) => `shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
  }`

  return (
    <ModulePage>
      <PageContainer>
        <section className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by campaign name, subject, or sender"
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateMode("drip")}>
              <Repeat2 className="mr-2 h-4 w-4" />
              Create drip
            </Button>
            <Button size="sm" onClick={() => setCreateMode("campaign")}>
              <Plus className="mr-2 h-4 w-4" />
              Create campaign
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="relative border-b">
            <div className="flex items-center">
              <span className="flex w-8 shrink-0 items-center justify-center">
                {canScrollLeft ? (
                  <button
                    type="button"
                    aria-label="Show previous campaign filters"
                    className="p-1 text-muted-foreground transition hover:text-primary"
                    onClick={() => scrollFilters("left")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}
              </span>
              <div
                ref={filterRowRef}
                onScroll={() => {
                  const row = filterRowRef.current
                  if (!row) return
                  setCanScrollLeft(row.scrollLeft > 2)
                  setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 2)
                }}
                className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
              <button
                type="button"
                onClick={() => {
                  setStatus("all")
                  setScope("all")
                }}
                className={filterClass(status === "all" && scope === "all")}
              >
                All campaigns
              </button>
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatus(tab)
                  setScope("all")
                }}
                className={filterClass(status === tab && scope === "all")}
              >
                <span className="capitalize">{tab}</span>
              </button>
            ))}
            {([
              ["recurring", "Recurring campaigns"],
              ["broadcast", "Broadcast campaigns"],
              ["drip", "Drip campaigns"],
            ] as Array<[Exclude<CampaignScope, "all">, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filterClass(scope === value && status === "all")}
                onClick={() => {
                  setScope(value)
                  setStatus("all")
                }}
              >
                {label}
              </button>
            ))}
              </div>
              <span className="flex w-8 shrink-0 items-center justify-center">
                {canScrollRight ? (
                  <button
                    type="button"
                    aria-label="Show more campaign filters"
                    className="p-1 text-muted-foreground transition hover:text-primary"
                    onClick={() => scrollFilters("right")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : null}
              </span>
            </div>
          </div>

          {visibleCampaigns.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Campaign</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead className="min-w-[150px]">Audience</TableHead>
                  <TableHead className="min-w-[170px]">Schedule</TableHead>
                  <TableHead className="min-w-[160px]">Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        to={getEmailMarketingPath(`/campaigns/${campaign.id}`) as never}
                        className="font-semibold hover:text-primary"
                      >
                        {campaign.name}
                      </Link>
                      <p className="mt-1 max-w-[320px] truncate text-xs text-muted-foreground">
                        {campaign.subject || "No subject added"}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {campaignTypeLabels[campaign.type]}
                        {campaign.isRecurring ? " · Recurring" : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Created {formatDate(campaign.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize">{campaign.goal}</TableCell>
                    <TableCell>
                      <p>{audienceLabel(campaign)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{campaign.totalRecipients} recipient(s)</p>
                    </TableCell>
                    <TableCell>
                      <p>{scheduleLabel(campaign)}</p>
                      {campaign.type !== "drip_campaign" && campaign.timezone ? (
                        <p className="mt-1 text-xs text-muted-foreground">{campaign.timezone}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p>{campaign.metrics.delivered} delivered</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.metrics.opens} opens · {campaign.metrics.clicks} clicks
                      </p>
                    </TableCell>
                    <TableCell><StatusPill status={campaign.status} /></TableCell>
                    <TableCell className="relative text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Actions for ${campaign.name}`}
                        onClick={() => setActionId(actionId === campaign.id ? null : campaign.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {actionId === campaign.id ? (
                        <div className="absolute right-4 top-14 z-30 w-48 rounded-xl border bg-popover p-1 text-left shadow-lg">
                          <Link
                            to={getEmailMarketingPath(`/campaigns/${campaign.id}`) as never}
                            className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => setActionId(null)}
                          >
                            View details
                          </Link>
                          {["draft", "scheduled", "paused"].includes(campaign.status) ? (
                            <Link
                              to={getEmailMarketingPath(`/campaigns/${campaign.id}/edit`) as never}
                              className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => setActionId(null)}
                            >
                              Edit campaign
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => duplicate(campaign)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </button>
                          {["active", "scheduled"].includes(campaign.status) ? (
                            <button
                              type="button"
                              className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => changeStatus(campaign, "paused")}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </button>
                          ) : campaign.status === "paused" ? (
                            <button
                              type="button"
                              className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => changeStatus(campaign, campaign.type === "drip_campaign" ? "active" : "scheduled")}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </button>
                          ) : null}
                          {campaign.status !== "archived" ? (
                            <button
                              type="button"
                              className="flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => changeStatus(campaign, "archived")}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </button>
                          ) : null}
                          {["draft", "failed", "archived"].includes(campaign.status) ? (
                            <button
                              type="button"
                              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              onClick={() => remove(campaign)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <EmptyPanel
                title={campaigns.length ? "No matching campaigns" : "Create your first campaign"}
                description={campaigns.length
                  ? "Try another status, campaign type, goal, or search term."
                  : "Choose a ready-made campaign or start from scratch."}
                action={!campaigns.length ? (
                  <Button onClick={() => setCreateMode("campaign")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create campaign
                  </Button>
                ) : undefined}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {visibleCampaigns.length} of {filtered.length} matching campaign(s) · {campaigns.length} total
            </span>
            <div className="flex items-center gap-2">
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </PageContainer>

      <CampaignPresetDialog
        open={Boolean(createMode)}
        drip={createMode === "drip"}
        onOpenChange={handleDialogChange}
      />
    </ModulePage>
  )
}
