export type SubscriberStatus = "subscribed" | "unsubscribed" | "suppressed"
export type TemplateType = "visual" | "simple" | "html"
export type TemplateStatus = "draft" | "active" | "archived"
export type SuppressionType = "manual" | "unsubscribe" | "bounce" | "complaint"
export type CampaignType = "promotional" | "broadcast" | "newsletter" | "product_launch" | "win_back" | "drip_campaign"
export type CampaignStatus = "draft" | "active" | "scheduled" | "sending" | "sent" | "paused" | "failed" | "archived"
export type CampaignGoal = "clicks" | "orders" | "revenue" | "reactivation"
export type AudienceMode = "all" | "segment" | "selected"
export type DomainStatus = "pending" | "verified" | "failed"
export type AutomationStatus = "draft" | "active" | "inactive" | "archived"
export type AutomationTrigger = "welcome_signup" | "welcome_series" | "order_confirmation" | "payment_success" | "shipping_update" | "delivery_confirmation" | "abandoned_cart" | "browse_abandonment" | "order_followup" | "review_request" | "win_back" | "price_drop" | "back_in_stock" | "inactive_subscriber" | "reminder_email" | "discount_offer"
export type AutomationStepType = "delay" | "condition" | "send_email" | "add_tag" | "remove_tag" | "webhook" | "exit"
export type TeamPermission = "view_dashboard" | "view_shared_templates" | "create_content" | "manage_campaigns" | "edit_content" | "share_content" | "manage_audience" | "manage_automations" | "view_analytics" | "view_reports" | "manage_sending_domains" | "view_billing" | "manage_team_access" | "manage_settings"

export interface EmailMarketingSender {
  fromName: string
  fromEmail: string
  replyTo: string
}

export interface Subscriber {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  status: SubscriberStatus
  source: string
  tags: string[]
  notes: string
  blocked: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailBlock {
  id: string
  type: "heading" | "text" | "button" | "image" | "video" | "dynamic" | "logo" | "social" | "html" | "divider" | "product" | "navigation" | "spacer"
  content: string
  href?: string
  align?: "left" | "center" | "right"
  alt?: string
  imageUrl?: string
  subtitle?: string
  price?: string
  buttonText?: string
  items?: Array<{ label: string; url: string }>
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  preheader: string
  type: TemplateType
  status: TemplateStatus
  category: string
  htmlContent: string
  blocks: EmailBlock[]
  createdAt: string
  updatedAt: string
}

export type SegmentField = "status" | "tag" | "source" | "email" | "createdAt"
export type SegmentOperator = "equals" | "not_equals" | "contains" | "not_contains" | "within_days"

export interface SegmentCondition {
  id: string
  field: SegmentField
  operator: SegmentOperator
  value: string
}

export interface Segment {
  id: string
  name: string
  description: string
  logic: "and" | "or"
  conditions: SegmentCondition[]
  createdAt: string
  updatedAt: string
}

export interface Suppression {
  id: string
  email: string
  type: SuppressionType
  reason: string
  createdAt: string
}

export interface DripStep {
  id: string
  title: string
  delayValue: number
  delayUnit: "hours" | "days" | "weeks"
  templateId: string
  subject: string
}

export interface CampaignActivity {
  id: string
  action: string
  detail: string
  createdAt: string
}

export interface CampaignMetrics {
  sent: number
  delivered: number
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
}

export interface EmailCampaign {
  id: string
  name: string
  type: CampaignType
  goal: CampaignGoal
  subject: string
  previewText: string
  fromName: string
  fromEmail: string
  replyTo: string
  templateId: string
  audienceMode: AudienceMode
  segmentId: string
  subscriberIds: string[]
  status: CampaignStatus
  scheduledAt: string
  timezone: string
  isRecurring: boolean
  recurrenceInterval: number
  recurrenceUnit: "day" | "week" | "month"
  recurrenceEndAt: string
  dripTargetAudience: "all" | "new_only"
  dripSteps: DripStep[]
  totalRecipients: number
  metrics: CampaignMetrics
  activity: CampaignActivity[]
  createdAt: string
  updatedAt: string
}

export interface DnsRecord {
  id: string
  type: "TXT" | "CNAME" | "MX"
  name: string
  value: string
  purpose: string
  status: "pending" | "verified" | "missing" | "incorrect" | "failed"
}

export interface SendingDomain {
  id: string
  domain: string
  trackingSubdomain: string
  status: DomainStatus
  dnsRecords: DnsRecord[]
  lastCheckedAt: string
  health: {
    reputation: number
    deliveryRate: number
    bounceRate: number
    complaintRate: number
  }
  dedicatedIp: {
    status: "not_requested" | "requested" | "approved"
    notes: string
    ipAddress: string
  }
  createdAt: string
  updatedAt: string
}

export interface AutomationStep {
  id: string
  type: AutomationStepType
  title: string
  delayValue: number
  delayUnit: "minutes" | "hours" | "days"
  templateId: string
  subject: string
  field: string
  operator: string
  value: string
}

export interface AutomationExecution {
  id: string
  subscriberEmail: string
  status: "pending" | "running" | "completed" | "failed" | "exited" | "cancelled"
  currentStep: number
  startedAt: string
  completedAt: string
}

export interface EmailAutomation {
  id: string
  name: string
  description: string
  trigger: AutomationTrigger
  status: AutomationStatus
  segmentId: string
  replyTo: string
  notes: string
  steps: AutomationStep[]
  executions: AutomationExecution[]
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: string
  type: "purchase" | "campaign_send" | "automation_send" | "adjustment" | "refund"
  credits: number
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
}

export interface BillingProfile {
  creditBalance: number
  billingName: string
  billingEmail: string
  companyName: string
  gstin: string
  address: string
  transactions: CreditTransaction[]
}

export interface TeamUser {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  permissions: TeamPermission[]
  invitedAt: string
  lastLoginAt: string
}

export interface EmailMarketingState {
  subscribers: Subscriber[]
  templates: EmailTemplate[]
  segments: Segment[]
  suppressions: Suppression[]
  campaigns: EmailCampaign[]
  domains: SendingDomain[]
  automations: EmailAutomation[]
  billing: BillingProfile
  teamUsers: TeamUser[]
}

export type SubscriberInput = Omit<Subscriber, "id" | "createdAt" | "updatedAt">
export type TemplateInput = Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">
export type SegmentInput = Omit<Segment, "id" | "createdAt" | "updatedAt">
export type CampaignInput = Omit<EmailCampaign, "id" | "createdAt" | "updatedAt" | "activity" | "metrics">
export type AutomationInput = Omit<EmailAutomation, "id" | "createdAt" | "updatedAt" | "executions">
export type TeamUserInput = Omit<TeamUser, "id" | "invitedAt" | "lastLoginAt">
