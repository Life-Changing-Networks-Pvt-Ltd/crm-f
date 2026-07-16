import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { MessageSquare } from "lucide-react"

export default function WhatsAppCampaigns() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="WhatsApp Marketing" description="Manage your WhatsApp campaigns." />
      <EmptyState
        title="Coming Soon"
        description="This feature is currently under development."
        icon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  )
}
