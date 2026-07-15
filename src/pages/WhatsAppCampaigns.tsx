import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function WhatsAppCampaigns() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="WhatsAppCampaigns" description="Manage WhatsApp campaigns.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No whatsappcampaigns found"
        description="Get started by creating a new one."
        actionLabel="Create WhatsAppCampaigns"
        onAction={() => {}}
      />
    </div>
  )
}
