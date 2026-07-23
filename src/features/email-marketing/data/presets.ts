import type { EmailBlock, SegmentCondition, TemplateType } from "../types"

export interface TemplatePreset {
  id: string
  name: string
  description: string
  category: string
  type: TemplateType
  subject: string
  preheader: string
  blocks: EmailBlock[]
}

export const templatePresets: TemplatePreset[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "A warm first message for new subscribers.",
    category: "Onboarding",
    type: "visual",
    subject: "Welcome to {{company_name}}",
    preheader: "We are glad you are here.",
    blocks: [
      { id: "welcome-heading", type: "heading", content: "Welcome, {{first_name}}!", align: "center" },
      { id: "welcome-text", type: "text", content: "Thanks for joining us. We are excited to keep you updated.", align: "center" },
      { id: "welcome-button", type: "button", content: "Explore now", href: "https://example.com", align: "center" },
    ],
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Announce a new product with a clear call to action.",
    category: "Promotion",
    type: "visual",
    subject: "Meet our latest launch",
    preheader: "Something new has arrived.",
    blocks: [
      { id: "launch-heading", type: "heading", content: "Something new is here", align: "center" },
      { id: "launch-image", type: "image", content: "https://placehold.co/800x360/f5eadc/9a5a13?text=Product+Launch", align: "center" },
      { id: "launch-text", type: "text", content: "Discover the features designed to make your work simpler.", align: "center" },
      { id: "launch-button", type: "button", content: "View product", href: "https://example.com", align: "center" },
    ],
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    description: "Share updates, stories, and useful links.",
    category: "Newsletter",
    type: "simple",
    subject: "Your monthly update",
    preheader: "News and highlights from this month.",
    blocks: [
      { id: "news-heading", type: "heading", content: "This month at {{company_name}}", align: "left" },
      { id: "news-text", type: "text", content: "Add your latest news, customer stories, and upcoming announcements here.", align: "left" },
    ],
  },
]

export interface SegmentPreset {
  id: string
  name: string
  description: string
  logic: "and" | "or"
  conditions: SegmentCondition[]
}

export const segmentPresets: SegmentPreset[] = [
  {
    id: "active-subscribers",
    name: "Active subscribers",
    description: "Everyone who is currently eligible to receive emails.",
    logic: "and",
    conditions: [{ id: "active-status", field: "status", operator: "equals", value: "subscribed" }],
  },
  {
    id: "recent-signups",
    name: "Recent signups",
    description: "Subscribers added during the last 30 days.",
    logic: "and",
    conditions: [{ id: "recent-created", field: "createdAt", operator: "within_days", value: "30" }],
  },
  {
    id: "crm-leads",
    name: "CRM leads",
    description: "Contacts synchronized from CRM lead sources.",
    logic: "or",
    conditions: [
      { id: "crm-customer", field: "source", operator: "equals", value: "CRM Customer" },
      { id: "crm-company", field: "source", operator: "equals", value: "CRM Company" },
      { id: "crm-lead", field: "source", operator: "equals", value: "CRM Lead" },
    ],
  },
]
