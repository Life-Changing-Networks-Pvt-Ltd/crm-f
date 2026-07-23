import type { AutomationTrigger, AutomationStepType } from "../types"

export const triggerLabels: Record<AutomationTrigger, string> = {
  welcome_signup: "Signup email", welcome_series: "Welcome series", order_confirmation: "Order confirmation",
  payment_success: "Payment success", shipping_update: "Shipping update", delivery_confirmation: "Delivery confirmation",
  abandoned_cart: "Abandoned cart", browse_abandonment: "Browse abandonment", order_followup: "Order follow-up",
  review_request: "Review request", win_back: "Win-back", price_drop: "Price drop", back_in_stock: "Back in stock",
  inactive_subscriber: "Inactive subscriber", reminder_email: "Reminder email", discount_offer: "Discount offer",
}

export const stepTypeLabels: Record<AutomationStepType, string> = {
  delay: "Delay", condition: "Condition", send_email: "Send email", add_tag: "Add tag",
  remove_tag: "Remove tag", webhook: "Webhook", exit: "Exit",
}

export const automationPresets = [
  { key: "welcome", name: "Welcome new subscribers", description: "Welcome contacts and introduce your brand.", trigger: "welcome_signup" as AutomationTrigger, steps: ["send_email", "delay", "send_email"] as AutomationStepType[] },
  { key: "cart", name: "Recover abandoned carts", description: "Remind shoppers and follow up with an offer.", trigger: "abandoned_cart" as AutomationTrigger, steps: ["delay", "condition", "send_email"] as AutomationStepType[] },
  { key: "review", name: "Post-purchase review", description: "Ask delivered customers for product feedback.", trigger: "delivery_confirmation" as AutomationTrigger, steps: ["delay", "send_email"] as AutomationStepType[] },
  { key: "winback", name: "Win back inactive contacts", description: "Re-engage contacts who have gone quiet.", trigger: "inactive_subscriber" as AutomationTrigger, steps: ["condition", "send_email"] as AutomationStepType[] },
]
