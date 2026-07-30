import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  FileBarChart,
  Gauge,
  Globe2,
  Home,
  LayoutTemplate,
  ListFilter,
  Send,
  Settings,
  ShieldBan,
  UserPlus,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react"
import type { TeamPermission } from "./types"

export interface EmailMarketingNavItem {
  label: string
  path: string
  description: string
  icon: LucideIcon
  children?: Array<{
    label: string
    path: string
    description?: string
  }>
}

export interface EmailMarketingNavGroup {
  label: string
  items: EmailMarketingNavItem[]
}

export const emailMarketingNavigation: EmailMarketingNavGroup[] = [
  {
    label: "Core",
    items: [
      {
        label: "Home",
        path: "/overview",
        description: "A focused snapshot of campaign performance and list growth.",
        icon: Home,
      },
      {
        label: "Connect Your Domain",
        path: "/connect-domain",
        description: "Connect and verify your business domain for trusted email sending.",
        icon: Globe2,
        children: [
          { label: "My Domains", path: "/connect-domain/my-domains" },
          { label: "Setup DNS Records", path: "/connect-domain/dns-records" },
          { label: "Domain Health", path: "/connect-domain/domain-health" },
          { label: "Dedicated IP", path: "/connect-domain/dedicated-ip" },
        ],
      },
      {
        label: "Campaigns",
        path: "/campaigns",
        description: "Create, schedule, and monitor email campaigns.",
        icon: Send,
        children: [
          { label: "All Campaigns", path: "/campaigns" },
          { label: "Create Campaign", path: "/campaigns/create" },
          { label: "Create Drip Campaign", path: "/campaigns/drip/create" },
        ],
      },
      {
        label: "Templates",
        path: "/templates",
        description: "Build and manage reusable email content.",
        icon: LayoutTemplate,
      },
    ],
  },
  {
    label: "Audience",
    items: [
      {
        label: "Audience",
        path: "/audience",
        description: "Review contacts, list hygiene, and subscriber growth.",
        icon: Users,
      },
      {
        label: "Segmentation",
        path: "/segments",
        description: "Define audience rules for targeted campaigns.",
        icon: ListFilter,
        children: [
          { label: "All Segments", path: "/segments" },
          { label: "Create New Segment", path: "/segments/new" },
          { label: "Ready-made Segments", path: "/segments/presets" },
        ],
      },
      {
        label: "Suppressions",
        path: "/suppressions",
        description: "Review unsubscribed and suppressed recipients.",
        icon: ShieldBan,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics & Reporting",
        path: "/analytics",
        description: "Track opens, clicks, conversions, devices, and campaign performance.",
        icon: BarChart3,
        children: [
          { label: "Email Opened / Clicked", path: "/analytics/email-opened-clicked" },
          { label: "Conversion / Revenue", path: "/analytics/conversion-revenue" },
          { label: "Device & Location", path: "/analytics/device-location" },
          { label: "Time Analytics", path: "/analytics/time-analytics" },
          { label: "Campaign Analytics", path: "/analytics/campaign-analytics" },
        ],
      },
      {
        label: "Deliverability Metrics",
        path: "/deliverability",
        description: "Review bounces, complaints, suppressions, and unsubscribes.",
        icon: Gauge,
        children: [
          { label: "Bounce Emails", path: "/deliverability/bounces" },
          { label: "Complaints & Suppressions", path: "/deliverability/complaints-suppressions" },
          { label: "Unsubscribe Emails", path: "/deliverability/unsubscribes" },
          { label: "Blocked Recipients", path: "/deliverability/blocked-future-emails" },
        ],
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Automations",
        path: "/automations",
        description: "Build lifecycle journeys and trigger-based email flows.",
        icon: Workflow,
      },
      {
        label: "Reports",
        path: "/reports",
        description: "Review and export campaign performance summaries.",
        icon: FileBarChart,
      },
      {
        label: "Billing / Credits",
        path: "/billing",
        description: "Review wallet credits, usage, and credit packs.",
        icon: WalletCards,
        children: [
          { label: "Buy Credits", path: "/billing/buy-credits" },
          { label: "Total Usage", path: "/billing/total-usage" },
        ],
      },
      {
        label: "Team Access",
        path: "/team-users",
        description: "Grant Email Marketing access to existing CRM users.",
        icon: UserPlus,
      },
      {
        label: "Settings",
        path: "/settings",
        description: "Configure sender details and workspace preferences.",
        icon: Settings,
      },
    ],
  },
]

const allItems = emailMarketingNavigation.flatMap((group) => group.items)

const permissionByPath: Array<[prefix: string, permission: TeamPermission]> = [
  ["/connect-domain", "manage_sending_domains"],
  ["/campaigns", "manage_campaigns"],
  ["/templates", "view_shared_templates"],
  ["/audience", "manage_audience"],
  ["/segments", "manage_audience"],
  ["/suppressions", "manage_audience"],
  ["/analytics", "view_analytics"],
  ["/deliverability", "view_analytics"],
  ["/automations", "manage_automations"],
  ["/reports", "view_reports"],
  ["/billing", "view_billing"],
  ["/team-users", "manage_team_access"],
  ["/settings", "manage_settings"],
  ["/overview", "view_dashboard"],
]

export function getEmailMarketingRequiredPermission(modulePath: string) {
  if (/^\/(email-builder|simple-editor|html-editor)\/new$/.test(modulePath)) {
    return "create_content"
  }
  if (/^\/(email-builder|simple-editor|html-editor)(?:\/|$)/.test(modulePath)) {
    return "edit_content"
  }
  return permissionByPath.find(([prefix]) =>
    modulePath === prefix || modulePath.startsWith(`${prefix}/`),
  )?.[1] || "view_dashboard"
}

export function getEmailMarketingPath(path: string) {
  return `/email-marketing${path}`
}

export function getEmailMarketingModulePath(pathname: string) {
  const modulePath = pathname.replace(/^\/email-marketing/, "")
  return modulePath && modulePath !== "/" ? modulePath : "/overview"
}

export function getEmailMarketingPageMeta(pathname: string) {
  const modulePath = getEmailMarketingModulePath(pathname)

  if (modulePath.startsWith("/email-builder")) {
    return { label: "Visual Email Builder", description: "Design reusable emails with content blocks and live preview.", path: "/email-builder" }
  }
  if (modulePath.startsWith("/simple-editor")) {
    return { label: "Simple Email Editor", description: "Create a clean, text-focused email with live preview.", path: "/simple-editor" }
  }
  if (modulePath.startsWith("/html-editor")) {
    return { label: "Custom HTML Editor", description: "Write and preview complete HTML email source.", path: "/html-editor" }
  }

  for (const item of allItems) {
    const child = item.children?.find((entry) => entry.path === modulePath)
    if (child) {
      return {
        label: child.label,
        description: child.description || item.description,
        path: child.path,
      }
    }

    if (modulePath === item.path || modulePath.startsWith(`${item.path}/`)) {
      return item
    }
  }

  return allItems[0]
}
