import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Notifications() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="View your notifications.">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </PageHeader>
      <EmptyState
        title="No notifications found"
        description="Get started by creating a new one."
        actionLabel="Create Notifications"
        onAction={() => {}}
      />
    </div>
  )
}
