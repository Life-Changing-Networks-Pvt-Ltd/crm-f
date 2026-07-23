import type { AudienceMode, EmailCampaign, Segment, Subscriber } from "../types"

export const campaignTypeLabels: Record<string, string> = {
  promotional: "Promotional",
  broadcast: "Broadcast",
  newsletter: "Newsletter",
  product_launch: "Product launch",
  win_back: "Win-back",
  drip_campaign: "Drip campaign",
}

export function formatDateTime(value: string) {
  if (!value) return "Not scheduled"
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function toDateTimeLocal(value: string) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

export function audienceCount(
  audienceMode: AudienceMode,
  subscriberIds: string[],
  segmentId: string,
  subscribers: Subscriber[],
  segments: Segment[],
  getSegmentSubscribers: (segment: Pick<Segment, "logic" | "conditions">) => Subscriber[],
) {
  const eligible = subscribers.filter((subscriber) => subscriber.status === "subscribed" && !subscriber.blocked)
  if (audienceMode === "all") return eligible.length
  if (audienceMode === "selected") return eligible.filter((subscriber) => subscriberIds.includes(subscriber.id)).length
  const segment = segments.find((item) => item.id === segmentId)
  return segment ? getSegmentSubscribers(segment).filter((subscriber) => subscriber.status === "subscribed" && !subscriber.blocked).length : 0
}

export function campaignPreviewSubject(campaign: Pick<EmailCampaign, "subject">, templateSubject = "") {
  return campaign.subject.trim() || templateSubject || "Your campaign subject"
}
