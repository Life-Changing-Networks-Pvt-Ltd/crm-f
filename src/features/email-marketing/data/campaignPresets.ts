import type { CampaignGoal, CampaignType, DripStep } from "../types"

export interface CampaignPreset {
  key: string
  label: string
  description: string
  type: CampaignType
  goal: CampaignGoal
  subject: string
  previewText: string
  dripSteps?: Array<Omit<DripStep, "id" | "templateId">>
}

export const campaignPresets: CampaignPreset[] = [
  { key: "product-launch", label: "New Product Launch", description: "Announce a new item with a launch message and clear CTA.", type: "product_launch", goal: "clicks", subject: "New arrival just landed", previewText: "Take a first look at what is new." },
  { key: "flash-sale", label: "Flash Sale", description: "Send a focused promotional push for a limited-time offer.", type: "promotional", goal: "revenue", subject: "Flash sale: limited-time savings", previewText: "Your offer is live for a short time." },
  { key: "newsletter", label: "Monthly Newsletter", description: "Share updates, highlights, and useful links in one email.", type: "newsletter", goal: "clicks", subject: "This month from our team", previewText: "Updates, picks, and useful links inside." },
  { key: "cart-recovery", label: "Cart Recovery Push", description: "Remind shoppers to return and complete a pending cart.", type: "promotional", goal: "orders", subject: "You left something in your cart", previewText: "Your selected items are still waiting." },
  { key: "win-back", label: "Win-back Offer", description: "Bring inactive subscribers back with a focused offer.", type: "win_back", goal: "reactivation", subject: "We saved something special for you", previewText: "Come back and take another look." },
  { key: "broadcast", label: "Store Broadcast", description: "Send a one-time update to a broad audience.", type: "broadcast", goal: "clicks", subject: "A quick update from our team", previewText: "Here is what is new today." },
]

export const dripCampaignPresets: CampaignPreset[] = [
  {
    key: "welcome-drip", label: "Welcome Drip", description: "A structured onboarding series for new subscribers.", type: "drip_campaign", goal: "clicks", subject: "Welcome to our community", previewText: "Here is the best place to start.",
    dripSteps: [
      { title: "Welcome email", delayValue: 0, delayUnit: "days", subject: "Welcome to our community" },
      { title: "Product introduction", delayValue: 1, delayUnit: "days", subject: "Here is the best place to start" },
      { title: "Customer story", delayValue: 3, delayUnit: "days", subject: "See how others use us" },
      { title: "Demo invitation", delayValue: 7, delayUnit: "days", subject: "Want a quick walkthrough?" },
    ],
  },
  {
    key: "nurture-drip", label: "Lead Nurture Drip", description: "Educate subscribers over time and guide their decision.", type: "drip_campaign", goal: "clicks", subject: "A useful guide for you", previewText: "A quick idea to help you choose better.",
    dripSteps: [
      { title: "Helpful guide", delayValue: 0, delayUnit: "days", subject: "A useful guide for you" },
      { title: "Problem education", delayValue: 2, delayUnit: "days", subject: "A better way to decide" },
      { title: "Customer proof", delayValue: 5, delayUnit: "days", subject: "What successful customers do" },
      { title: "Conversion nudge", delayValue: 9, delayUnit: "days", subject: "Ready for the next step?" },
    ],
  },
  {
    key: "post-purchase", label: "Post-purchase Drip", description: "Follow up after purchase with tips and next-step offers.", type: "drip_campaign", goal: "orders", subject: "How is your order going?", previewText: "Tips, support, and helpful next steps.",
    dripSteps: [
      { title: "Thank-you email", delayValue: 0, delayUnit: "days", subject: "Thank you for your order" },
      { title: "Product care", delayValue: 2, delayUnit: "days", subject: "A few tips for your purchase" },
      { title: "Cross-sell email", delayValue: 5, delayUnit: "days", subject: "Pairs well with your order" },
    ],
  },
  {
    key: "review-request", label: "Review Request Drip", description: "Ask for feedback with a gentle scheduled follow-up.", type: "drip_campaign", goal: "reactivation", subject: "How did we do?", previewText: "Your feedback helps us improve.",
    dripSteps: [
      { title: "Review request", delayValue: 3, delayUnit: "days", subject: "How did we do?" },
      { title: "Review reminder", delayValue: 7, delayUnit: "days", subject: "A quick reminder to share your feedback" },
    ],
  },
  {
    key: "win-back-drip", label: "Win-back Drip", description: "Send a scheduled reactivation series for inactive subscribers.", type: "drip_campaign", goal: "reactivation", subject: "We would love to see you again", previewText: "Here is something special for your return.",
    dripSteps: [
      { title: "Reconnect", delayValue: 0, delayUnit: "days", subject: "We would love to see you again" },
      { title: "Return offer", delayValue: 3, delayUnit: "days", subject: "A special offer for your return" },
      { title: "Final reminder", delayValue: 7, delayUnit: "days", subject: "Your return offer ends soon" },
    ],
  },
  {
    key: "seasonal-promo", label: "Seasonal Promo Drip", description: "Run a repeating seasonal promotion over multiple sends.", type: "drip_campaign", goal: "revenue", subject: "Our seasonal offer is here", previewText: "Limited-time seasonal savings inside.",
    dripSteps: [
      { title: "Season launch", delayValue: 0, delayUnit: "days", subject: "Our seasonal offer is here" },
      { title: "Featured picks", delayValue: 2, delayUnit: "days", subject: "Seasonal picks chosen for you" },
      { title: "Last chance", delayValue: 5, delayUnit: "days", subject: "Last chance for seasonal savings" },
    ],
  },
]
