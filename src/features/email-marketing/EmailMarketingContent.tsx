import { Construction, LoaderCircle, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react"

import { useEmailMarketingStore } from "./EmailMarketingStore"
import { getEmailMarketingModulePath, getEmailMarketingPageMeta, getEmailMarketingRequiredPermission } from "./navigation"
import { AudiencePage } from "./pages/AudiencePage"
import { AnalyticsPage } from "./pages/AnalyticsPage"
import { AutomationDetailsPage, AutomationFormPage, AutomationsPage } from "./pages/AutomationPages"
import { BillingPage } from "./pages/BillingPage"
import { CampaignDetailsPage } from "./pages/CampaignDetailsPage"
import { CampaignFormPage } from "./pages/CampaignFormPage"
import { CampaignsPage } from "./pages/CampaignsPage"
import { DomainConnectionPage } from "./pages/DomainConnectionPage"
import { DeliverabilityPage } from "./pages/DeliverabilityPage"
import { OverviewPage } from "./pages/OverviewPage"
import { ReportsPage } from "./pages/ReportsPage"
import { SegmentFormPage, SegmentPresetsPage, SegmentsPage } from "./pages/SegmentsPage"
import { SubscriberDetailsPage, SubscriberFormPage } from "./pages/SubscriberPages"
import { SuppressionsPage } from "./pages/SuppressionsPage"
import { TemplateEditorPage } from "./pages/TemplateEditorPage"
import { TemplatesPage } from "./pages/TemplatesPage"
import { TeamUsersPage } from "./pages/TeamUsersPage"

interface EmailMarketingContentProps {
  pathname: string
}

export function EmailMarketingContent({ pathname }: EmailMarketingContentProps) {
  const { loading, syncError, permissions, refresh } = useEmailMarketingStore()
  if (loading) {
    return <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin text-primary" />Syncing Email Marketing workspace...</div></main>
  }
  if (syncError) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-background p-6">
        <section className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <TriangleAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-card-foreground">Email Marketing could not be loaded</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{syncError}</p>
          <button
            type="button"
            onClick={() => void refresh().catch(() => undefined)}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" />Retry
          </button>
        </section>
      </main>
    )
  }
  const modulePath = getEmailMarketingModulePath(pathname)
  const requiredPermission = getEmailMarketingRequiredPermission(modulePath)
  if (!permissions.includes(requiredPermission)) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-background p-6">
        <section className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-card-foreground">Access restricted</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your CRM role does not include permission to open this Email Marketing section.
          </p>
        </section>
      </main>
    )
  }
  if (modulePath === "/overview") return <OverviewPage />

  if (modulePath === "/automations") return <AutomationsPage />
  if (modulePath === "/automations/new") return <AutomationFormPage />
  const automationEditMatch = modulePath.match(/^\/automations\/([^/]+)\/edit$/)
  if (automationEditMatch) return <AutomationFormPage id={automationEditMatch[1]} />
  const automationExecutionsMatch = modulePath.match(/^\/automations\/([^/]+)\/executions$/)
  if (automationExecutionsMatch) return <AutomationDetailsPage id={automationExecutionsMatch[1]} executionsOnly />
  const automationDetailsMatch = modulePath.match(/^\/automations\/([^/]+)$/)
  if (automationDetailsMatch) return <AutomationDetailsPage id={automationDetailsMatch[1]} />

  if (modulePath === "/analytics") return <AnalyticsPage view="overview" />
  if (modulePath === "/analytics/email-opened-clicked") return <AnalyticsPage view="engagement" />
  if (modulePath === "/analytics/conversion-revenue") return <AnalyticsPage view="conversion" />
  if (modulePath === "/analytics/device-location") return <AnalyticsPage view="device" />
  if (modulePath === "/analytics/time-analytics") return <AnalyticsPage view="time" />
  if (modulePath === "/analytics/campaign-analytics") return <AnalyticsPage view="campaign" />

  if (modulePath === "/deliverability" || modulePath === "/deliverability/bounces") return <DeliverabilityPage view="bounces" />
  if (modulePath === "/deliverability/complaints-suppressions") return <DeliverabilityPage view="complaints" />
  if (modulePath === "/deliverability/unsubscribes") return <DeliverabilityPage view="unsubscribes" />
  if (modulePath === "/deliverability/blocked-future-emails") return <DeliverabilityPage view="blocked" />

  if (modulePath === "/reports") return <ReportsPage />
  if (modulePath === "/billing" || modulePath === "/billing/buy-credits") return <BillingPage view="buy" />
  if (modulePath === "/billing/total-usage") return <BillingPage view="usage" />
  if (modulePath === "/team-users") return <TeamUsersPage />

  if (modulePath === "/campaigns") return <CampaignsPage />
  if (modulePath === "/campaigns/create") return <CampaignsPage initialCreateMode="campaign" />
  if (modulePath === "/campaigns/drip/create") return <CampaignsPage initialCreateMode="drip" />
  const dripNewMatch = modulePath.match(/^\/campaigns\/drip\/new(?:\/([^/]+))?$/)
  if (dripNewMatch) return <CampaignFormPage drip presetKey={dripNewMatch[1]} />
  const campaignNewMatch = modulePath.match(/^\/campaigns\/new(?:\/([^/]+))?$/)
  if (campaignNewMatch) return <CampaignFormPage presetKey={campaignNewMatch[1]} />
  const campaignEditMatch = modulePath.match(/^\/campaigns\/([^/]+)\/edit$/)
  if (campaignEditMatch) return <CampaignFormPage id={campaignEditMatch[1]} />
  const campaignDetailsMatch = modulePath.match(/^\/campaigns\/([^/]+)$/)
  if (campaignDetailsMatch) return <CampaignDetailsPage id={campaignDetailsMatch[1]} />

  if (modulePath === "/connect-domain" || modulePath === "/connect-domain/my-domains") return <DomainConnectionPage view="domains" />
  if (modulePath === "/connect-domain/dns-records") return <DomainConnectionPage view="dns" />
  if (modulePath === "/connect-domain/domain-health") return <DomainConnectionPage view="health" />
  if (modulePath === "/connect-domain/dedicated-ip") return <DomainConnectionPage view="dedicated-ip" />

  if (modulePath === "/audience") return <AudiencePage />
  if (modulePath === "/audience/new") return <SubscriberFormPage />

  const subscriberEditMatch = modulePath.match(/^\/audience\/([^/]+)\/edit$/)
  if (subscriberEditMatch) return <SubscriberFormPage id={subscriberEditMatch[1]} />
  const subscriberMatch = modulePath.match(/^\/audience\/([^/]+)$/)
  if (subscriberMatch) return <SubscriberDetailsPage id={subscriberMatch[1]} />

  if (modulePath === "/templates" || modulePath === "/templates/new") return <TemplatesPage />
  const visualEditorMatch = modulePath.match(/^\/email-builder(?:\/([^/]+))?$/)
  if (visualEditorMatch) return <TemplateEditorPage mode="visual" id={visualEditorMatch[1] === "new" ? undefined : visualEditorMatch[1]} />
  const simpleEditorMatch = modulePath.match(/^\/simple-editor(?:\/([^/]+))?$/)
  if (simpleEditorMatch) return <TemplateEditorPage mode="simple" id={simpleEditorMatch[1] === "new" ? undefined : simpleEditorMatch[1]} />
  const htmlEditorMatch = modulePath.match(/^\/html-editor(?:\/([^/]+))?$/)
  if (htmlEditorMatch) return <TemplateEditorPage mode="html" id={htmlEditorMatch[1] === "new" ? undefined : htmlEditorMatch[1]} />

  if (modulePath === "/segments") return <SegmentsPage />
  if (modulePath === "/segments/presets") return <SegmentPresetsPage />
  if (modulePath === "/segments/new") return <SegmentFormPage />
  const segmentEditMatch = modulePath.match(/^\/segments\/([^/]+)\/edit$/)
  if (segmentEditMatch) return <SegmentFormPage id={segmentEditMatch[1]} />

  if (modulePath === "/suppressions") return <SuppressionsPage />

  const page = getEmailMarketingPageMeta(pathname)

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{page.label}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{page.description}</p>
        </section>

        <section className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed bg-card p-6 shadow-sm md:min-h-[520px]">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Construction className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-card-foreground">
              {page.label} is planned for the next frontend part
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This route remains safely connected to the Email Marketing shell. Its complete interface will be added without affecting the finished Part 2 screens.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
