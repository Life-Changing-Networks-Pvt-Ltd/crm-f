/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { emailMarketingRequest } from "./emailMarketingApi"
import type {
  AutomationInput,
  AutomationStatus,
  CampaignInput,
  CampaignStatus,
  DomainStatus,
  EmailCampaign,
  EmailAutomation,
  EmailMarketingState,
  EmailMarketingSender,
  EmailTemplate,
  Segment,
  SegmentCondition,
  SegmentInput,
  SendingDomain,
  Subscriber,
  SubscriberInput,
  Suppression,
  SuppressionType,
  TemplateInput,
  TeamUser,
  TeamUserInput,
  TeamPermission,
} from "./types"

const STORAGE_KEY = "crm_email_marketing_frontend_v1"
const EMPTY_BILLING: EmailMarketingState["billing"] = {
  creditBalance: 0,
  billingName: "",
  billingEmail: "",
  companyName: "",
  gstin: "",
  address: "",
  transactions: [],
}
const EMPTY_STATE: EmailMarketingState = {
  subscribers: [],
  templates: [],
  segments: [],
  suppressions: [],
  campaigns: [],
  domains: [],
  automations: [],
  billing: EMPTY_BILLING,
  teamUsers: [],
}
const EMPTY_PLATFORM_SENDER: EmailMarketingSender = {
  fromName: "SellersLogin",
  fromEmail: "",
  replyTo: "",
}
const EMPTY_CAMPAIGN_METRICS: EmailCampaign["metrics"] = {
  sent: 0,
  delivered: 0,
  opens: 0,
  clicks: 0,
  bounces: 0,
  unsubscribes: 0,
}

function normalizeCampaign(campaign: EmailCampaign, previous?: EmailCampaign): EmailCampaign {
  const candidate = campaign as Partial<EmailCampaign>
  return {
    ...campaign,
    metrics: {
      ...EMPTY_CAMPAIGN_METRICS,
      ...(previous?.metrics || {}),
      ...(candidate.metrics || {}),
    },
    activity: Array.isArray(candidate.activity)
      ? candidate.activity
      : previous?.activity || [],
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function readCachedState(): EmailMarketingState {
  if (typeof window === "undefined") return EMPTY_STATE
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<EmailMarketingState>
    return {
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      segments: Array.isArray(parsed.segments) ? parsed.segments : [],
      suppressions: Array.isArray(parsed.suppressions) ? parsed.suppressions : [],
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns.map((campaign) => normalizeCampaign(campaign)) : [],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      automations: Array.isArray(parsed.automations) ? parsed.automations : [],
      billing: parsed.billing && typeof parsed.billing === "object"
        ? { ...EMPTY_BILLING, ...parsed.billing, transactions: Array.isArray(parsed.billing.transactions) ? parsed.billing.transactions : [] }
        : EMPTY_BILLING,
      teamUsers: Array.isArray(parsed.teamUsers) ? parsed.teamUsers : [],
    }
  } catch {
    return EMPTY_STATE
  }
}

function conditionMatches(subscriber: Subscriber, condition: SegmentCondition) {
  const value = condition.value.trim().toLowerCase()
  if (!value) return true
  if (condition.field === "createdAt" && condition.operator === "within_days") {
    const days = Number(value)
    return Number.isFinite(days) && days >= 0 &&
      Date.now() - new Date(subscriber.createdAt).getTime() <= days * 86400000
  }
  const raw = condition.field === "tag"
    ? subscriber.tags.join(",")
    : String(subscriber[condition.field] || "")
  const current = raw.toLowerCase()
  if (condition.operator === "equals") return current === value || (condition.field === "tag" && subscriber.tags.some((tag) => tag.toLowerCase() === value))
  if (condition.operator === "not_equals") return current !== value
  if (condition.operator === "contains") return current.includes(value)
  if (condition.operator === "not_contains") return !current.includes(value)
  return false
}

function campaignPayload(input: Partial<CampaignInput>) {
  const {
    status: _status,
    scheduledAt: _scheduledAt,
    totalRecipients: _totalRecipients,
    dripSteps,
    ...payload
  } = input
  return {
    ...payload,
    ...(Object.hasOwn(payload, "templateId")
      ? { templateId: payload.templateId || "" }
      : {}),
    ...(Object.hasOwn(payload, "segmentId")
      ? { segmentId: payload.segmentId || "" }
      : {}),
    ...(dripSteps
      ? {
          dripSteps: dripSteps.map(({ id: _id, ...step }) => step),
        }
      : {}),
  }
}

function automationPayload(input: Partial<AutomationInput>) {
  return {
    ...input,
    ...(input.steps
      ? { steps: input.steps.map(({ id: _id, ...step }) => step) }
      : {}),
  }
}

interface EmailMarketingStoreValue extends EmailMarketingState {
  loading: boolean
  syncError: string
  permissions: TeamPermission[]
  platformSender: EmailMarketingSender
  refresh: () => Promise<void>
  createSubscriber: (input: SubscriberInput) => Promise<Subscriber>
  updateSubscriber: (id: string, updates: Partial<SubscriberInput>) => Promise<Subscriber | null>
  deleteSubscribers: (ids: string[]) => Promise<void>
  importSubscribers: (rows: Array<Partial<SubscriberInput> & { email: string }>) => Promise<{ added: number; skipped: number }>
  bulkUpdateSubscribers: (ids: string[], action: "unsubscribe" | "suppress" | "reactivate", tags?: string[]) => Promise<void>
  createTemplate: (input: TemplateInput) => Promise<EmailTemplate>
  updateTemplate: (id: string, updates: Partial<TemplateInput>) => Promise<EmailTemplate | null>
  duplicateTemplate: (id: string) => Promise<EmailTemplate | null>
  deleteTemplate: (id: string) => Promise<void>
  createSegment: (input: SegmentInput) => Promise<Segment>
  updateSegment: (id: string, updates: Partial<SegmentInput>) => Promise<Segment | null>
  deleteSegment: (id: string) => Promise<void>
  getSegmentSubscribers: (segment: Pick<Segment, "logic" | "conditions">) => Subscriber[]
  addSuppression: (email: string, type: SuppressionType, reason: string) => Promise<Suppression>
  removeSuppression: (id: string) => Promise<void>
  createCampaign: (input: CampaignInput) => Promise<EmailCampaign>
  updateCampaign: (id: string, updates: Partial<CampaignInput>) => Promise<EmailCampaign | null>
  duplicateCampaign: (id: string) => Promise<EmailCampaign | null>
  setCampaignStatus: (id: string, status: CampaignStatus, detail?: string) => Promise<EmailCampaign | null>
  deleteCampaign: (id: string) => Promise<void>
  addDomain: (domain: string) => Promise<SendingDomain>
  updateDomain: (id: string, updates: Partial<Omit<SendingDomain, "id" | "createdAt" | "updatedAt">>) => Promise<SendingDomain | null>
  setDomainStatus: (id: string, status: DomainStatus) => Promise<SendingDomain | null>
  deleteDomain: (id: string) => Promise<void>
  createAutomation: (input: AutomationInput) => Promise<EmailAutomation>
  updateAutomation: (id: string, updates: Partial<AutomationInput>) => Promise<EmailAutomation | null>
  duplicateAutomation: (id: string) => Promise<EmailAutomation | null>
  setAutomationStatus: (id: string, status: AutomationStatus) => Promise<EmailAutomation | null>
  runAutomationTest: (id: string, subscriberEmail: string) => Promise<EmailAutomation | null>
  deleteAutomation: (id: string) => Promise<void>
  purchaseCredits: (credits: number, amount: number) => Promise<void>
  updateBillingProfile: (updates: Partial<Omit<EmailMarketingState["billing"], "transactions" | "creditBalance">>) => Promise<void>
  createTeamUser: (input: TeamUserInput) => Promise<TeamUser>
  updateTeamUser: (id: string, updates: Partial<TeamUserInput>) => Promise<TeamUser | null>
  deleteTeamUser: (id: string) => Promise<void>
}

const EmailMarketingStoreContext = createContext<EmailMarketingStoreValue | null>(null)

export function EmailMarketingStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmailMarketingState>(readCachedState)
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState("")
  const [permissions, setPermissions] = useState<TeamPermission[]>([])
  const [platformSender, setPlatformSender] = useState<EmailMarketingSender>(
    EMPTY_PLATFORM_SENDER,
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const snapshot = await emailMarketingRequest<{
        state: EmailMarketingState
        permissions: TeamPermission[]
        config: { platformSender: EmailMarketingSender }
      }>("get", "/integration/snapshot")
      setState({
        ...EMPTY_STATE,
        ...snapshot.state,
        campaigns: (snapshot.state.campaigns || []).map((campaign) => normalizeCampaign(campaign)),
        billing: { ...EMPTY_BILLING, ...snapshot.state.billing },
      })
      setPermissions(snapshot.permissions)
      setPlatformSender(snapshot.config.platformSender)
      setSyncError("")
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Email Marketing sync failed")
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh().catch(() => undefined)
  }, [refresh])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const replace = useCallback(<T extends { id: string }>(key: keyof EmailMarketingState, item: T) => {
    setState((current) => ({
      ...current,
      [key]: (current[key] as unknown as T[]).map((entry) => entry.id === item.id ? item : entry),
    }))
  }, [])

  const createSubscriber = useCallback(async (input: SubscriberInput) => {
    const item = await emailMarketingRequest<Subscriber>("post", "/subscribers", input)
    setState((current) => ({ ...current, subscribers: [item, ...current.subscribers] }))
    return item
  }, [])

  const updateSubscriber = useCallback(async (id: string, updates: Partial<SubscriberInput>) => {
    const item = await emailMarketingRequest<Subscriber>("patch", `/subscribers/${id}`, updates)
    replace("subscribers", item)
    return item
  }, [replace])

  const deleteSubscribers = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    await emailMarketingRequest("patch", "/subscribers/bulk", { ids, action: "delete" })
    const selected = new Set(ids)
    setState((current) => ({ ...current, subscribers: current.subscribers.filter((item) => !selected.has(item.id)) }))
  }, [])

  const importSubscribers = useCallback(async (rows: Array<Partial<SubscriberInput> & { email: string }>) => {
    const result = await emailMarketingRequest<{ added?: number; created?: number; skipped?: number }>("post", "/subscribers/import", { rows, updateExisting: false })
    await refresh()
    return { added: result.added ?? result.created ?? 0, skipped: result.skipped ?? 0 }
  }, [refresh])

  const bulkUpdateSubscribers = useCallback(async (ids: string[], action: "unsubscribe" | "suppress" | "reactivate", tags: string[] = []) => {
    await emailMarketingRequest("patch", "/subscribers/bulk", { ids, action, ...(tags.length ? { tags } : {}) })
    await refresh()
  }, [refresh])

  const createTemplate = useCallback(async (input: TemplateInput) => {
    const item = await emailMarketingRequest<EmailTemplate>("post", "/templates", input)
    setState((current) => ({ ...current, templates: [item, ...current.templates] }))
    return item
  }, [])
  const updateTemplate = useCallback(async (id: string, updates: Partial<TemplateInput>) => {
    const item = await emailMarketingRequest<EmailTemplate>("patch", `/templates/${id}`, updates)
    replace("templates", item)
    return item
  }, [replace])
  const duplicateTemplate = useCallback(async (id: string) => {
    const item = await emailMarketingRequest<EmailTemplate>("post", `/templates/${id}/duplicate`)
    setState((current) => ({ ...current, templates: [item, ...current.templates] }))
    return item
  }, [])
  const deleteTemplate = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/templates/${id}`)
    setState((current) => ({ ...current, templates: current.templates.filter((item) => item.id !== id) }))
  }, [])

  const createSegment = useCallback(async (input: SegmentInput) => {
    const item = await emailMarketingRequest<Segment>("post", "/segments", input)
    setState((current) => ({ ...current, segments: [item, ...current.segments] }))
    return item
  }, [])
  const updateSegment = useCallback(async (id: string, updates: Partial<SegmentInput>) => {
    const item = await emailMarketingRequest<Segment>("patch", `/segments/${id}`, updates)
    replace("segments", item)
    return item
  }, [replace])
  const deleteSegment = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/segments/${id}`)
    setState((current) => ({ ...current, segments: current.segments.filter((item) => item.id !== id) }))
  }, [])
  const getSegmentSubscribers = useCallback((segment: Pick<Segment, "logic" | "conditions">) => {
    if (!segment.conditions.length) return state.subscribers
    return state.subscribers.filter((subscriber) => {
      const matches = segment.conditions.map((condition) => conditionMatches(subscriber, condition))
      return segment.logic === "and" ? matches.every(Boolean) : matches.some(Boolean)
    })
  }, [state.subscribers])

  const addSuppression = useCallback(async (email: string, type: SuppressionType, reason: string) => {
    const item = await emailMarketingRequest<Suppression>("post", "/suppressions", { email: normalizeEmail(email), type, reason })
    setState((current) => ({ ...current, suppressions: [item, ...current.suppressions.filter((entry) => entry.email !== item.email)] }))
    return item
  }, [])
  const removeSuppression = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/suppressions/${id}`)
    setState((current) => ({ ...current, suppressions: current.suppressions.filter((item) => item.id !== id) }))
  }, [])

  const createCampaign = useCallback(async (input: CampaignInput) => {
    let item = await emailMarketingRequest<EmailCampaign>("post", "/campaigns", campaignPayload(input))
    if (input.status === "scheduled" && input.scheduledAt) {
      item = await emailMarketingRequest("post", `/campaigns/${item.id}/schedule`, { scheduledAt: input.scheduledAt, timezone: input.timezone })
    } else if (input.status === "active") {
      item = await emailMarketingRequest("post", `/campaigns/${item.id}/send`)
    }
    const normalized = normalizeCampaign(item)
    setState((current) => ({ ...current, campaigns: [normalized, ...current.campaigns] }))
    return normalized
  }, [])
  const updateCampaign = useCallback(async (id: string, updates: Partial<CampaignInput>) => {
    const payload = campaignPayload(updates)
    let item = Object.keys(payload).length
      ? await emailMarketingRequest<EmailCampaign>("patch", `/campaigns/${id}`, payload)
      : state.campaigns.find((campaign) => campaign.id === id) || null
    if (updates.status === "scheduled" && updates.scheduledAt) {
      item = await emailMarketingRequest("post", `/campaigns/${id}/schedule`, { scheduledAt: updates.scheduledAt, timezone: updates.timezone || item?.timezone || "Asia/Kolkata" })
    } else if (updates.status === "active") {
      item = await emailMarketingRequest("post", `/campaigns/${id}/send`)
    }
    if (!item) return null
    const normalized = normalizeCampaign(
      item,
      state.campaigns.find((campaign) => campaign.id === id),
    )
    replace("campaigns", normalized)
    return normalized
  }, [replace, state.campaigns])
  const duplicateCampaign = useCallback(async (id: string) => {
    const item = await emailMarketingRequest<EmailCampaign>("post", `/campaigns/${id}/duplicate`)
    const normalized = normalizeCampaign(item)
    setState((current) => ({ ...current, campaigns: [normalized, ...current.campaigns] }))
    return normalized
  }, [])
  const setCampaignStatus = useCallback(async (id: string, status: CampaignStatus) => {
    const actions: Partial<Record<CampaignStatus, string>> = {
      paused: "pause",
      active: "resume",
      scheduled: "resume",
      archived: "archive",
      sent: "send",
    }
    const action = actions[status]
    if (!action) return state.campaigns.find((item) => item.id === id) || null
    const item = await emailMarketingRequest<EmailCampaign>("post", `/campaigns/${id}/${action}`)
    const normalized = normalizeCampaign(
      item,
      state.campaigns.find((campaign) => campaign.id === id),
    )
    replace("campaigns", normalized)
    return normalized
  }, [replace, state.campaigns])
  const deleteCampaign = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/campaigns/${id}`)
    setState((current) => ({ ...current, campaigns: current.campaigns.filter((item) => item.id !== id) }))
  }, [])

  const addDomain = useCallback(async (domain: string) => {
    const item = await emailMarketingRequest<SendingDomain>("post", "/domains", { domain })
    setState((current) => ({ ...current, domains: [item, ...current.domains] }))
    return item
  }, [])
  const updateDomain = useCallback(async (id: string, updates: Partial<Omit<SendingDomain, "id" | "createdAt" | "updatedAt">>) => {
    if (updates.dedicatedIp?.status === "requested") {
      const item = await emailMarketingRequest<SendingDomain>("post", `/domains/${id}/dedicated-ip`, { notes: updates.dedicatedIp.notes })
      replace("domains", item)
      return item
    }
    return state.domains.find((item) => item.id === id) || null
  }, [replace, state.domains])
  const setDomainStatus = useCallback(async (id: string, _status: DomainStatus) => {
    const item = await emailMarketingRequest<SendingDomain>("post", `/domains/${id}/verify`)
    replace("domains", item)
    return item
  }, [replace])
  const deleteDomain = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/domains/${id}`)
    setState((current) => ({ ...current, domains: current.domains.filter((item) => item.id !== id) }))
  }, [])

  const createAutomation = useCallback(async (input: AutomationInput) => {
    const item = await emailMarketingRequest<EmailAutomation>("post", "/automations", automationPayload(input))
    setState((current) => ({ ...current, automations: [item, ...current.automations] }))
    return item
  }, [])
  const updateAutomation = useCallback(async (id: string, updates: Partial<AutomationInput>) => {
    const item = await emailMarketingRequest<EmailAutomation>("patch", `/automations/${id}`, automationPayload(updates))
    replace("automations", item)
    return item
  }, [replace])
  const duplicateAutomation = useCallback(async (id: string) => {
    const item = await emailMarketingRequest<EmailAutomation>("post", `/automations/${id}/duplicate`)
    setState((current) => ({ ...current, automations: [item, ...current.automations] }))
    return item
  }, [])
  const setAutomationStatus = useCallback(async (id: string, status: AutomationStatus) => {
    const action = status === "active" ? "activate" : "deactivate"
    const item = await emailMarketingRequest<EmailAutomation>("post", `/automations/${id}/${action}`)
    replace("automations", item)
    return item
  }, [replace])
  const runAutomationTest = useCallback(async (id: string, subscriberEmail: string) => {
    await emailMarketingRequest("post", `/automations/${id}/test`, { email: normalizeEmail(subscriberEmail) })
    await refresh()
    return state.automations.find((item) => item.id === id) || null
  }, [refresh, state.automations])
  const deleteAutomation = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/automations/${id}`)
    setState((current) => ({ ...current, automations: current.automations.filter((item) => item.id !== id) }))
  }, [])

  const purchaseCredits = useCallback(async (credits: number, amount: number) => {
    const result = await emailMarketingRequest<{ account: EmailMarketingState["billing"]; transactions: EmailMarketingState["billing"]["transactions"] }>("post", "/billing/credits/purchase", {
      credits,
      amount,
      idempotencyKey: `crm-${Date.now()}-${crypto.randomUUID()}`,
    })
    setState((current) => ({ ...current, billing: { ...result.account, transactions: result.transactions } }))
  }, [])
  const updateBillingProfile = useCallback(async (updates: Partial<Omit<EmailMarketingState["billing"], "transactions" | "creditBalance">>) => {
    const result = await emailMarketingRequest<{ account: EmailMarketingState["billing"]; transactions: EmailMarketingState["billing"]["transactions"] }>("patch", "/billing/profile", updates)
    setState((current) => ({ ...current, billing: { ...result.account, transactions: result.transactions } }))
  }, [])

  const createTeamUser = useCallback(async (input: TeamUserInput) => {
    const item = await emailMarketingRequest<TeamUser>("post", "/team", input)
    setState((current) => ({ ...current, teamUsers: [item, ...current.teamUsers.filter((entry) => entry.id !== item.id)] }))
    return item
  }, [])
  const updateTeamUser = useCallback(async (id: string, updates: Partial<TeamUserInput>) => {
    const item = await emailMarketingRequest<TeamUser>("patch", `/team/${id}`, {
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.permissions ? { permissions: updates.permissions } : {}),
    })
    replace("teamUsers", item)
    return item
  }, [replace])
  const deleteTeamUser = useCallback(async (id: string) => {
    await emailMarketingRequest("delete", `/team/${id}`)
    setState((current) => ({ ...current, teamUsers: current.teamUsers.filter((item) => item.id !== id) }))
  }, [])

  const value = useMemo<EmailMarketingStoreValue>(() => ({
    ...state,
    loading,
    syncError,
    permissions,
    platformSender,
    refresh,
    createSubscriber,
    updateSubscriber,
    deleteSubscribers,
    importSubscribers,
    bulkUpdateSubscribers,
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    deleteTemplate,
    createSegment,
    updateSegment,
    deleteSegment,
    getSegmentSubscribers,
    addSuppression,
    removeSuppression,
    createCampaign,
    updateCampaign,
    duplicateCampaign,
    setCampaignStatus,
    deleteCampaign,
    addDomain,
    updateDomain,
    setDomainStatus,
    deleteDomain,
    createAutomation,
    updateAutomation,
    duplicateAutomation,
    setAutomationStatus,
    runAutomationTest,
    deleteAutomation,
    purchaseCredits,
    updateBillingProfile,
    createTeamUser,
    updateTeamUser,
    deleteTeamUser,
  }), [state, loading, syncError, permissions, platformSender, refresh, createSubscriber, updateSubscriber, deleteSubscribers, importSubscribers, bulkUpdateSubscribers, createTemplate, updateTemplate, duplicateTemplate, deleteTemplate, createSegment, updateSegment, deleteSegment, getSegmentSubscribers, addSuppression, removeSuppression, createCampaign, updateCampaign, duplicateCampaign, setCampaignStatus, deleteCampaign, addDomain, updateDomain, setDomainStatus, deleteDomain, createAutomation, updateAutomation, duplicateAutomation, setAutomationStatus, runAutomationTest, deleteAutomation, purchaseCredits, updateBillingProfile, createTeamUser, updateTeamUser, deleteTeamUser])

  return <EmailMarketingStoreContext.Provider value={value}>{children}</EmailMarketingStoreContext.Provider>
}

export function useEmailMarketingStore() {
  const context = useContext(EmailMarketingStoreContext)
  if (!context) throw new Error("useEmailMarketingStore must be used inside EmailMarketingStoreProvider")
  return context
}
