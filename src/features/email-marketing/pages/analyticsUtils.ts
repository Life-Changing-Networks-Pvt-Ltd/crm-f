import type { EmailCampaign } from "../types"

export function aggregateCampaigns(campaigns: EmailCampaign[]) {
  return campaigns.reduce((total, campaign) => ({
    sent: total.sent + campaign.metrics.sent,
    delivered: total.delivered + campaign.metrics.delivered,
    opens: total.opens + campaign.metrics.opens,
    clicks: total.clicks + campaign.metrics.clicks,
    bounces: total.bounces + campaign.metrics.bounces,
    unsubscribes: total.unsubscribes + campaign.metrics.unsubscribes,
  }), { sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 })
}

export const rate = (value: number, base: number) => base ? `${((value / base) * 100).toFixed(2)}%` : "0.00%"
export const number = (value: number) => value.toLocaleString("en-IN")

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
